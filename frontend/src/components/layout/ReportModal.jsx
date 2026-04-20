import { useState, useEffect, useRef } from 'react';
import { useComplaintQueue } from '../../hooks/useComplaintQueue';
import { useConnectivity } from '../../context/ConnectivityContext';
import { X, MapPin, Mic, MicOff, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const ReportModal = ({ isOpen, onClose, location }) => {
  const { showToast } = useToast();
  
  // Helper for notification
  const notifyError = (msg) => showToast(msg, 'error');
  const notifySuccess = (msg) => showToast(msg, 'success');
  const notifyInfo = (msg) => showToast(msg, 'info');

  const [formData, setFormData] = useState({
    title: '',
    city: '',
    pincode: '',
    category: 'Roads',
    description: '',
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [photo, setPhoto] = useState(null);
  const [photoError, setPhotoError] = useState('');
  const [blurPhoto, setBlurPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const [nearbyComplaints, setNearbyComplaints] = useState([]);
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);

  const { isOnline } = useConnectivity();
  const { saveToQueue } = useComplaintQueue();

  // Voice Input Setup
  let recognition = null;
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setFormData(prev => ({
        ...prev,
        description: prev.description ? `${prev.description} ${transcript}` : transcript
      }));
      if (formErrors.description) setFormErrors(prev => ({ ...prev, description: '' }));
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
      switch(event.error) {
        case 'not-allowed':
          setVoiceError('Microphone access denied. Please allow microphone permissions in your browser.');
          break;
        case 'network':
          setVoiceError('Network error. Voice typing requires an internet connection.');
          break;
        case 'no-speech':
          setVoiceError('No speech detected. Please try again.');
          break;
        case 'language-not-supported':
          setVoiceError('Language not supported by your browser.');
          break;
        case 'aborted':
          setVoiceError(''); // User stopped it intentionally
          break;
        default:
          setVoiceError(`Voice typing error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  }

  const toggleVoiceInput = () => {
    if (!recognition) {
      setVoiceError("Voice input is not supported in your browser. Try using Chrome or Edge.");
      return;
    }
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      setVoiceError('');
      try {
        recognition.start();
        setIsListening(true);
      } catch (err) {
        console.error("Could not start speech recognition:", err);
        setVoiceError("Microphone is already in use or cannot be started.");
      }
    }
  };

  const titleInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setFormErrors({});
      setPhotoError('');
      
      // Autofocus the first meaningful input
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 300); // Wait for framer-motion anim

      const handleEsc = (e) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleEsc);
      return () => {
        window.removeEventListener('keydown', handleEsc);
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && location && location.lat && location.lng) {
      const fetchLocationDetails = async () => {
        setIsGeocoding(true);
        try {
          const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.lat},${location.lng}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`);
          const data = await res.json();
          if (data.status === 'OK' && data.results.length > 0) {
            const addressComponents = data.results[0].address_components;
            let fetchedCity = '';
            let fetchedPincode = '';
            
            addressComponents.forEach(component => {
              if (component.types.includes('locality')) {
                fetchedCity = component.long_name;
              }
              if (component.types.includes('postal_code')) {
                fetchedPincode = component.long_name;
              }
            });
            
            setFormData(prev => ({
              ...prev,
              city: fetchedCity || prev.city,
              pincode: fetchedPincode || prev.pincode
            }));
            
            if (!fetchedCity || !fetchedPincode) {
               setFormErrors(prev => ({ ...prev, 
                 ...(!fetchedCity ? { city: 'Please enter city manually' } : {}),
                 ...(!fetchedPincode ? { pincode: 'Please enter pincode manually' } : {})
               }));
            }
          } else {
            notifyInfo("Could not auto-fetch address. Please enter it manually.");
            setFormErrors(prev => ({ ...prev, city: 'Required', pincode: 'Required' }));
          }
        } catch (err) {
          console.error("Geocoding failed", err);
          notifyInfo("Location detection service unavailable. Please enter details manually.");
          setFormErrors(prev => ({ ...prev, city: 'Required', pincode: 'Required' }));
        } finally {
          setIsGeocoding(false);
        }
      };
      
      const fetchNearbyIssues = async () => {
        setIsLoadingNearby(true);
        try {
          const data = await api.get(`/complaints/nearby?lon=${location.lng}&lat=${location.lat}&radius=200`);
          if (Array.isArray(data)) {
            setNearbyComplaints(data);
          }
        } catch (err) {
          console.error("Failed to fetch nearby issues", err);
        } finally {
          setIsLoadingNearby(false);
        }
      };
      
      fetchLocationDetails();
      fetchNearbyIssues();
    }
  }, [location, isOpen]);

  const potentialDuplicates = nearbyComplaints.filter(c => c.category === formData.category);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setPhotoError('Please upload a valid image file.');
        setPhoto(null);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setPhotoError('File size exceeds 5MB limit.');
        setPhoto(null);
        return;
      }
      setPhotoError('');
      setPhoto(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = {};
    if (!formData.title.trim()) errors.title = "Title is required";
    if (!formData.city.trim()) errors.city = "City is required";
    if (!/^\d{6}$/.test(formData.pincode)) errors.pincode = "Pincode must be exactly 6 digits";
    if (!formData.description.trim()) errors.description = "Description is required";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      // Vibrate if supported to indicate validation error
      if (navigator.vibrate) navigator.vibrate(200);
      return;
    }

    if (!location) {
      notifyError("Please select a location on the map first.");
      return;
    }

    setIsSubmitting(true);

    const submissionData = new FormData();
    Object.keys(formData).forEach(key => submissionData.append(key, formData[key].trim()));
    submissionData.append('latitude', location.lat);
    submissionData.append('longitude', location.lng);
    
    if (photo) {
      submissionData.append('photo', photo);
    }

    if (!isOnline) {
      const dataObj = { ...formData, latitude: location.lat, longitude: location.lng, photo: photo || null };
      await saveToQueue(dataObj);
      notifyInfo("You are currently offline. Your report has been saved locally.");
      setIsSubmitting(false);
      onClose();
      return;
    }

    try {
      await api.upload('/complaints', submissionData);
      notifySuccess("Complaint submitted successfully!");
      onClose();
    } catch (error) {
      console.error('Submission error:', error);
      
      if (error.name === 'ApiError' && error.status !== 500) {
        notifyError(error.message);
      } else {
        // Network error or server crash - fallback to offline queue
        const dataObj = { ...formData, latitude: location.lat, longitude: location.lng, photo: photo || null };
        await saveToQueue(dataObj);
        notifyInfo("Connection unstable. Report saved locally for auto-sync.");
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[var(--color-on-surface)]/30 backdrop-blur-sm" 
            onClick={onClose}
          />
          
          {/* Modal Content */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative bg-[var(--color-surface-container-lowest)] w-full max-w-lg rounded-[var(--radius-xl)] shadow-[var(--shadow-soft-3)] flex flex-col max-h-[90vh] overflow-hidden"
          >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[var(--color-outline-variant)] flex justify-between items-center bg-[var(--color-surface-bright)]">
          <div>
            <h2 className="text-2xl font-bold text-[var(--color-on-surface)] tracking-tight">Report a Civic Issue</h2>
            <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">Your report helps authorities clear the problem faster.</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-[var(--color-surface-container)] text-[var(--color-outline)] hover:text-[var(--color-on-surface)] transition-colors hover:scale-105 active:scale-95"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 flex flex-col gap-5">
          
          {/* Duplicate Detection Alert */}
          <AnimatePresence>
            {potentialDuplicates.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="bg-[var(--color-primary-container)]/30 border border-[var(--color-primary)]/20 rounded-[var(--radius-lg)] p-3 flex flex-col gap-2"
              >
                <div className="flex items-center gap-2 text-[var(--color-primary)] font-semibold text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>Similar issue already reported nearby!</span>
                </div>
                <p className="text-xs text-[var(--color-on-surface-variant)]">
                  An issue was already submitted nearby. You can still submit, and we'll automatically upvote the existing one for faster visibility.
                </p>
                <div className="max-h-24 overflow-y-auto bg-white/50 dark:bg-black/10 rounded-[var(--radius-md)] p-2 flex flex-col gap-1">
                  {potentialDuplicates.map(dup => (
                    <div key={dup._id} className="text-xs border-b border-black/5 dark:border-white/5 last:border-0 pb-1 mb-1">
                      <span className="font-semibold block truncate">• {dup.title}</span>
                      <span className="opacity-70 flex justify-between">
                        <span>Status: {dup.status}</span>
                        <span>👍 {dup.upvotes}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[var(--color-on-surface)] tracking-wide">Issue Title <span className="text-[var(--color-error)]">*</span></label>
            <input 
              ref={titleInputRef}
              type="text" name="title" value={formData.title} onChange={handleChange}
              placeholder="e.g. Deep pothole on MG Road"
              className={`px-4 py-3 text-base border ${formErrors.title ? 'border-[var(--color-error)]' : 'border-[var(--color-outline-variant)]'} rounded-[var(--radius-lg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent bg-[var(--color-surface)] transition-all`}
            />
            {formErrors.title && <span className="text-xs text-[var(--color-error)] font-medium px-1">{formErrors.title}</span>}
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col gap-1.5 flex-1 relative">
              <label className="text-sm font-semibold text-[var(--color-on-surface)] tracking-wide">City <span className="text-[var(--color-error)]">*</span></label>
              <div className="relative">
                <input 
                  type="text" name="city" value={formData.city} onChange={handleChange}
                  placeholder="e.g. Kolkata"
                  className={`w-full pl-10 pr-4 py-3 text-base border ${formErrors.city ? 'border-[var(--color-error)]' : 'border-[var(--color-outline-variant)]'} rounded-[var(--radius-lg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent bg-[var(--color-surface)] transition-all`}
                />
                <MapPin className={`absolute left-3 top-3.5 w-4 h-4 ${isGeocoding ? 'text-[var(--color-primary)] animate-pulse' : 'text-[var(--color-on-surface-variant)]'}`} />
              </div>
              {formErrors.city && <span className="text-xs text-[var(--color-error)] font-medium px-1">{formErrors.city}</span>}
            </div>
            <div className="flex flex-col gap-1.5 flex-1 relative">
              <label className="text-sm font-semibold text-[var(--color-on-surface)] tracking-wide">Pincode <span className="text-[var(--color-error)]">*</span></label>
              <input 
                type="text" name="pincode" value={formData.pincode} onChange={handleChange}
                placeholder="e.g. 700001"
                className={`px-4 py-3 text-base border ${formErrors.pincode ? 'border-[var(--color-error)]' : 'border-[var(--color-outline-variant)]'} rounded-[var(--radius-lg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent bg-[var(--color-surface)] transition-all`}
              />
              {formErrors.pincode && <span className="text-xs text-[var(--color-error)] font-medium px-1">{formErrors.pincode}</span>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[var(--color-on-surface)] tracking-wide">Category</label>
            <select 
              name="category" value={formData.category} onChange={handleChange} 
              className="px-4 py-3 text-base border border-[var(--color-outline-variant)] rounded-[var(--radius-lg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent bg-[var(--color-surface)] transition-all appearance-none cursor-pointer"
            >
              <option value="Roads">Roads</option>
              <option value="Garbage">Garbage</option>
              <option value="Water">Water</option>
              <option value="Electricity">Electricity</option>
              <option value="Others">Others</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-end">
              <label className="text-sm font-semibold text-[var(--color-on-surface)] tracking-wide">Description <span className="text-[var(--color-error)]">*</span></label>
              <button
                type="button"
                onClick={toggleVoiceInput}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  isListening
                    ? 'bg-red-100 text-red-600 animate-pulse'
                    : 'bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] hover:brightness-95'
                }`}
              >
                {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                {isListening ? 'Listening...' : 'Voice Typing'}
              </button>
            </div>
            <textarea 
              name="description" value={formData.description} onChange={handleChange}
              placeholder="Provide more details..." rows={3}
              className={`px-4 py-3 text-base border ${(voiceError || formErrors.description) ? 'border-[var(--color-error)]' : 'border-[var(--color-outline-variant)]'} rounded-[var(--radius-lg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent bg-[var(--color-surface)] resize-none transition-all`}
            ></textarea>
            {formErrors.description && <span className="text-xs text-[var(--color-error)] font-medium px-1">{formErrors.description}</span>}
            {voiceError && (
              <motion.p 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                className="text-xs text-[var(--color-error)] font-medium px-1"
              >
                {voiceError}
              </motion.p>
            )}
          </div>

          <div className="flex flex-col gap-1.5 bg-[var(--color-surface-container-low)] p-4 rounded-[var(--radius-lg)] border border-[var(--color-surface-container-highest)]">
            <label className="text-sm font-semibold text-[var(--color-on-surface)] tracking-wide">Upload Photo</label>
            <p className="text-xs text-[var(--color-on-surface-variant)] mb-2">Optional, but highly recommended for faster resolution (Max 5MB).</p>
            <input 
              type="file" accept="image/*" onChange={handlePhotoChange} 
              className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-[var(--radius-md)] file:border-0 file:text-sm file:font-semibold file:bg-[var(--color-primary-container)] file:text-[var(--color-on-primary-container)] hover:file:bg-[var(--color-primary)] hover:file:text-[var(--color-on-primary)] file:transition-colors file:cursor-pointer cursor-pointer" 
            />
            {photoError && <span className="text-xs text-[var(--color-error)] font-medium px-1 mt-1">{photoError}</span>}
            
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--color-surface-container-highest)]">
              <input 
                type="checkbox" id="blur-photo" checked={blurPhoto} onChange={(e) => setBlurPhoto(e.target.checked)} 
                className="w-4 h-4 rounded border-[var(--color-outline-variant)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer" 
              />
              <label htmlFor="blur-photo" className="text-sm text-[var(--color-on-surface)] cursor-pointer">Blur Faces/Number plates (Privacy)</label>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-2 pt-5 border-t border-[var(--color-outline-variant)] flex justify-end gap-4">
            <button 
              type="button" onClick={onClose} 
              className="px-6 py-3 rounded-[var(--radius-lg)] font-semibold text-[var(--color-primary)] hover:bg-[var(--color-surface-container)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
            >
              Cancel
            </button>
            <button 
              type="submit" disabled={isSubmitting} 
              className={`px-8 py-3 rounded-[var(--radius-lg)] font-semibold shadow-[var(--shadow-soft-2)] hover:shadow-[var(--shadow-soft-3)] hover:scale-[1.02] active:scale-[0.98] hover:brightness-110 disabled:opacity-50 disabled:pointer-events-none transition-all duration-300 flex items-center justify-center min-w-[160px] gap-2 ${
                !isOnline
                  ? 'bg-amber-500 text-white'
                  : 'bg-[var(--color-primary)] text-[var(--color-on-primary)]'
              }`}
            >
              {isSubmitting
                ? 'Submitting...'
                : !isOnline
                  ? '📦 Save Offline'
                  : 'Submit Report'
              }
            </button>
          </div>
        </form>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
};

export default ReportModal;

