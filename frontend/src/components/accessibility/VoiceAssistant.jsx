import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, X, Command, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const VoiceAssistant = ({ onReportClick }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-IN';

      recognitionRef.current.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
        
        if (event.results[0].isFinal) {
          processCommand(currentTranscript.toLowerCase());
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Voice assistant error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setError('Microphone access denied.');
        } else if (event.error !== 'no-speech') {
          setError(`Error: ${event.error}`);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
    
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const processCommand = (cmd) => {
    setFeedback('Processing...');
    
    // Timeout to show command success before closing
    const successClose = () => {
      setTimeout(() => {
        setIsOpen(false);
        setTranscript('');
        setFeedback('');
      }, 1500);
    };

    if (cmd.includes('map') || cmd.includes('navigate to map')) {
      setFeedback('Navigating to Map 🗺️');
      navigate('/map');
      successClose();
    } 
    else if (cmd.includes('home') || cmd.includes('dashboard')) {
      setFeedback('Going to Dashboard 🏠');
      navigate('/');
      successClose();
    }
    else if (cmd.includes('report') || cmd.includes('file complaint')) {
      setFeedback('Opening Report Workflow 📢');
      onReportClick();
      successClose();
    }
    else if (cmd.includes('profile') || cmd.includes('my account')) {
      setFeedback('Opening Profile 👤');
      navigate('/profile');
      successClose();
    }
    else if (cmd.includes('complaint') || cmd.includes('my issue')) {
      setFeedback('Opening My Complaints 📝');
      navigate('/complaints');
      successClose();
    }
    else if (cmd.includes('setting')) {
      setFeedback('Opening Settings ⚙️');
      navigate('/settings');
      successClose();
    }
    else if (cmd.includes('leader') || cmd.includes('rank')) {
      setFeedback('Opening Leaderboard 🏆');
      navigate('/leaderboard');
      successClose();
    }
    else {
      setFeedback('Command not recognized. Try "Open Map".');
      setTimeout(() => setFeedback(''), 2000);
    }
  };

  const startListening = () => {
    if (!recognitionRef.current) {
      setError('Speech recognition not supported in this browser.');
      return;
    }
    setError('');
    setTranscript('');
    setFeedback('Listening...');
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleAssistant = () => {
    if (!isOpen) {
      setIsOpen(true);
      // Short delay to allow opening animation before listening
      setTimeout(startListening, 300);
    } else {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsOpen(false);
      setIsListening(false);
    }
  };

  return (
    <>
      {/* Floating FAB */}
      <div className="fixed bottom-20 right-6 z-40 md:bottom-6">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleAssistant}
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-colors ${
            isOpen 
              ? 'bg-[var(--color-error-container)] text-[var(--color-on-error-container)]' 
              : 'bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-dim)]'
          }`}
          aria-label="Voice Assistant"
        >
          {isOpen ? <X size={20} /> : <Mic size={20} />}
        </motion.button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-36 right-6 z-50 w-72 md:bottom-20 md:right-20 bg-[var(--color-surface-container-high)] rounded-[var(--radius-xl)] shadow-[var(--shadow-soft-3)] border border-[var(--color-outline-variant)] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-3 bg-[var(--color-surface-container-highest)] border-b border-[var(--color-outline-variant)] flex items-center gap-2">
              <div className="bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] p-1.5 rounded-lg">
                <Command size={16} />
              </div>
              <span className="font-semibold text-sm text-[var(--color-on-surface)]">Voice Commands</span>
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col items-center text-center">
              {isListening && (
                <div className="relative mb-4 flex items-center justify-center">
                  <motion.div 
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.2, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute w-12 h-12 rounded-full bg-[var(--color-primary)]/20"
                  />
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] p-3 rounded-full z-10"
                  >
                    <Mic size={24} className="animate-pulse" />
                  </motion.div>
                </div>
              )}

              <p className="text-sm font-medium text-[var(--color-primary)] min-h-[1.25rem]">
                {feedback || (isListening ? 'Try saying a command...' : '')}
              </p>
              
              <p className="mt-2 italic text-[var(--color-on-surface-variant)] min-h-[1.5rem] text-sm break-words">
                {transcript ? `"${transcript}"` : ''}
              </p>

              {error && (
                <p className="mt-2 text-xs text-[var(--color-error)] font-medium">{error}</p>
              )}

              {!isListening && !feedback && (
                <button 
                  onClick={startListening}
                  className="mt-2 px-4 py-1.5 bg-[var(--color-surface-container-highest)] hover:bg-[var(--color-primary-container)] transition-colors rounded-full text-xs font-semibold text-[var(--color-on-surface)] flex items-center gap-1"
                >
                  <Mic size={12} /> Tap to Speak
                </button>
              )}
            </div>

            {/* Hints */}
            <div className="bg-[var(--color-surface-container-low)] p-3 text-xs text-[var(--color-on-surface-variant)] border-t border-[var(--color-outline-variant)]/50">
              <p className="font-medium mb-1 flex items-center gap-1 opacity-75"><HelpCircle size={12} /> Suggested Commands:</p>
              <ul className="grid grid-cols-2 gap-x-2 gap-y-1 font-mono text-[10px]">
                <li>• "Open Map"</li>
                <li>• "Report Issue"</li>
                <li>• "Go Home"</li>
                <li>• "My Profile"</li>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default VoiceAssistant;
