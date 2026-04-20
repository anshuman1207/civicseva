// Configuration
const API_URL = 'http://localhost:5000/api/complaints';
const AUTH_URL = 'http://localhost:5000/api/auth';
let map;
let clickMarker = null;
const mapMarkers = {}; // Store markers by complaint ID

// i18next Translations Dictionary
const resources = {
  en: {
    translation: {
      "header": { "reportBtn": "Report Issue" },
      "modal": { "title": "Report a Civic Issue", "subtitle": "Your report helps authorities clear the problem faster." },
      "form": {
        "issueTitle": "Issue Title", "titlePlaceholder": "e.g. Deep pothole on MG Road",
        "city": "City", "cityPlaceholder": "e.g. Kolkata",
        "pincode": "Pincode", "pincodePlaceholder": "e.g. 700001", "pincodeTitle": "Pincode must be exactly 6 digits",
        "category": "Category",
        "categories": { "roads": "Roads", "garbage": "Garbage", "water": "Water", "electricity": "Electricity", "others": "Others" },
        "description": "Description", "descPlaceholder": "Provide more details...",
        "uploadPhoto": "Upload Photo", "photoSubtitle": "Optional, but highly recommended for faster resolution.",
        "blur": "Blur Faces/Number plates (Privacy)",
        "submitBtn": "Submit Report"
      },
      "popup": {
        "category": "Category", "loadComments": "Load comments...", "writeComment": "Write a comment...", "send": "Send", "noComments": "No comments yet."
      },
      "status": {
        "Pending": "Pending", "In Progress": "In Progress", "Resolved": "Resolved"
      },
      "gamification": {
        "pts": "pts"
      }
    }
  },
  bn: {
    translation: {
      "header": { "reportBtn": "সমস্যা জানান" },
      "modal": { "title": "একটি নাগরিক সমস্যা জানান", "subtitle": "আপনার রিপোর্ট কর্তৃপক্ষকে দ্রুত সমস্যা সমাধানে সাহায্য করে।" },
      "form": {
        "issueTitle": "সমস্যার শিরোনাম", "titlePlaceholder": "যেমন: এমজি রোডে গভীর গর্ত",
        "city": "শহর", "cityPlaceholder": "যেমন: কলকাতা",
        "pincode": "পিনকোড", "pincodePlaceholder": "যেমন: 700001", "pincodeTitle": "পিনকোড ঠিক ৬ সংখ্যার হতে হবে",
        "category": "বিভাগ",
        "categories": { "roads": "রাস্তা", "garbage": "আবর্জনা", "water": "জল", "electricity": "বিদ্যুৎ", "others": "অন্যান্য" },
        "description": "বর্ণনা", "descPlaceholder": "আরও বিস্তারিত তথ্য দিন...",
        "uploadPhoto": "ছবি আপলোড করুন", "photoSubtitle": "ঐচ্ছিক, তবে দ্রুত সমাধানের জন্য সুপারিশ করা হচ্ছে।",
        "blur": "মুখ/গাড়ির নম্বর প্লেট ব্লার করুন (গোপনীয়তা)",
        "submitBtn": "রিপোর্ট জমা দিন"
      },
      "popup": {
        "category": "বিভাগ", "loadComments": "মন্তব্য লোড করুন...", "writeComment": "একটি মন্তব্য লিখুন...", "send": "পাঠান", "noComments": "এখনও কোনও মন্তব্য নেই।"
      },
      "status": {
        "Pending": "অপেক্ষমাণ", "In Progress": "চলছে", "Resolved": "সমাধান হয়েছে"
      },
      "gamification": {
        "pts": "পয়েন্ট"
      }
    }
  },
  hi: {
    translation: {
      "header": { "reportBtn": "समस्या दर्ज करें" },
      "modal": { "title": "नागरिक समस्या दर्ज करें", "subtitle": "आपकी रिपोर्ट अधिकारियों को समस्या जल्दी हल करने में मदद करती है।" },
      "form": {
        "issueTitle": "समस्या का शीर्षक", "titlePlaceholder": "जैसे: एमजी रोड पर गहरा गड्ढा",
        "city": "शहर", "cityPlaceholder": "जैसे: कोलकाता",
        "pincode": "पिनकोड", "pincodePlaceholder": "जैसे: 700001", "pincodeTitle": "पिनकोड ठीक 6 अंकों का होना चाहिए",
        "category": "श्रेणी",
        "categories": { "roads": "सड़कें", "garbage": "कचरा", "water": "पानी", "electricity": "बिजली", "others": "अन्य" },
        "description": "विवरण", "descPlaceholder": "अधिक विवरण प्रदान करें...",
        "uploadPhoto": "फोटो अपलोड करें", "photoSubtitle": "वैकल्पिक, लेकिन तेजी से समाधान के लिए अनुशंसित।",
        "blur": "चेहरे/नंबर प्लेट धुंधला करें (गोपनीयता)",
        "submitBtn": "रिपोर्ट जमा करें"
      },
      "popup": {
        "category": "श्रेणी", "loadComments": "टिप्पणियाँ लोड करें...", "writeComment": "एक टिप्पणी लिखें...", "send": "भेजें", "noComments": "अभी कोई टिप्पणी नहीं।"
      },
      "status": {
        "Pending": "लंबित", "In Progress": "प्रगति पर", "Resolved": "हल हो गया"
      },
      "gamification": {
        "pts": "अंक"
      }
    }
  }
};

// Initialize i18next
i18next.init({
  lng: 'en', // default language
  fallbackLng: 'en',
  resources
}).then(() => {
  updateContent(); // Initial translation pass
});

// Update static DOM elements based on data-i18n attributes
function updateContent() {
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const keyString = element.getAttribute('data-i18n');
    const keys = keyString.split(';');

    keys.forEach(k => {
      let attribute = null;
      let i18nKey = k;
      
      // Support for attributes like [placeholder]form.titlePlaceholder 
      const match = k.match(/^\[(.*?)\](.*)/);
      if (match) {
        attribute = match[1];
        i18nKey = match[2];
      }

      const translation = i18next.t(i18nKey);
      
      if (attribute) {
        element.setAttribute(attribute, translation);
      } else {
        element.innerText = translation;
      }
    });
  });
}

// Handle language switcher event
window.addEventListener('DOMContentLoaded', () => {
  const selector = document.getElementById('language-selector');
  if (selector) {
    selector.addEventListener('change', (e) => {
      i18next.changeLanguage(e.target.value).then(() => {
        updateContent();
        refreshAllPopups(); // Refresh any open or existing popups with new language
      });
    });
  }
});

// Helper to re-render all marker popups during a language switch
function refreshAllPopups() {
  Object.values(mapMarkers).forEach(marker => {
    updatePopupContent(marker); // re-build with new language
  });
}

// Initialize Socket.io
const socket = io('http://localhost:5000');
socket.on('connect', () => {
  console.log('Connected to real-time updates');
});
socket.on('statusUpdate', (data) => {
  console.log('Status updated received:', data);
  const { id, status } = data;
  
  // Find the marker on the map and update its popup content and style dynamically
  const marker = mapMarkers[id];
  if (marker) {
    // We could change the marker icon color here if we had custom icons
    // For now, if the popup is open, we update the status badge
    const badge = document.querySelector(`.popup-content[data-id="${id}"] .status-badge`);
    if (badge) {
      badge.textContent = status;
      badge.className = `status-badge ${status === 'In Progress' ? 'in-progress' : status === 'Resolved' ? 'resolved' : 'pending'}`;
    }
    // Update the local data so if it's reopened it shows correctly
    marker.complaintData.status = status;
    updatePopupContent(marker); // Custom helper below
    
    // Show toast notification
    showNotification(`Status for "${marker.complaintData.title}" updated to ${status}`, 'info');
  }
});

// Toast Notification Function
function showNotification(message, type = 'info') {
  const container = document.getElementById('notification-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  // Icon based on type
  const icon = type === 'success' ? '✅' : 'ℹ️';
  
  toast.innerHTML = `
    <span>${icon}</span>
    <div>${message}</div>
  `;
  
  container.appendChild(toast);
  
  // Remove after 4 seconds
  setTimeout(() => {
    toast.classList.add('hide');
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }, 4000);
}

// Helper to fully regenerate a marker's popup
function updatePopupContent(marker) {
  const complaint = marker.complaintData;
  let statusClass = "pending";
  if (complaint.status === "In Progress") statusClass = "in-progress";
  if (complaint.status === "Resolved") statusClass = "resolved";

  const popupContent = `
    <div class="popup-content" data-id="${complaint._id}">
      <h3>${complaint.title}</h3>
      <p><strong>${i18next.t('popup.category')}:</strong> ${i18next.t(`form.categories.${complaint.category.toLowerCase()}`)}</p>
      <p>${complaint.description}</p>
      ${complaint.photo ? `<img src="http://localhost:5000${complaint.photo}" alt="Issue Photo" style="width:100%; margin-top:5px; border-radius:4px; max-height:100px; object-fit:cover;">` : ''}
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
        <span class="status-badge ${statusClass}">${i18next.t(`status.${complaint.status}`)}</span>
        <button class="upvote-btn" onclick="toggleUpvote('${complaint._id}')" style="background: transparent; border: 1px solid #4F46E5; color: #4F46E5; padding: 4px 8px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 4px;">
          👍 <span id="upvote-count-${complaint._id}">${complaint.upvotes || 0}</span>
        </button>
      </div>
      <hr style="margin: 10px 0; border: 0; border-top: 1px solid #E5E7EB;">
      <div id="comments-container-${complaint._id}" style="max-height: 100px; overflow-y: auto; font-size: 0.8rem; margin-bottom: 8px;">
        <small style="color:#6B7280; cursor:pointer;" onclick="loadComments('${complaint._id}')">${i18next.t('popup.loadComments')}</small>
      </div>
      <div style="display: flex; gap: 4px;">
        <input type="text" id="comment-input-${complaint._id}" placeholder="${i18next.t('popup.writeComment')}" style="flex:1; padding:4px; border:1px solid #ccc; border-radius:3px; font-size:0.8rem;">
        <button onclick="postComment('${complaint._id}')" style="background:var(--primary); color:white; border:none; padding:4px 8px; border-radius:3px; cursor:pointer; font-size:0.8rem;">${i18next.t('popup.send')}</button>
      </div>
    </div>
  `;
  marker.bindPopup(popupContent, { className: 'custom-popup' });
}


// DOM Elements
const reportBtn = document.getElementById('report-btn');
const reportModal = document.getElementById('report-modal');
const closeBtn = document.querySelector('.close-btn');
const complaintForm = document.getElementById('complaint-form');
const latInput = document.getElementById('lat');
const lngInput = document.getElementById('lng');
const cityInput = document.getElementById('city');
const pincodeInput = document.getElementById('pincode');

// Mock Auth logic to ensure we have a token for upvoting
async function ensureAuth() {
  let token = localStorage.getItem('civicseva_token');
  if (token) return token;
  const mockUser = {
    name: "Test User",
    email: `test${Date.now()}@example.com`,
    password: "password123"
  };
  try {
    const res = await fetch(`${AUTH_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockUser)
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('civicseva_token', data.token);
      token = data.token;
    }
  } catch (err) {
    console.error("Auth error", err);
  }
  
  if (token) loadUserStats(token);
  return token;
}

// Fetch gamification stats and update HUD
async function loadUserStats(token) {
  try {
    const res = await fetch(`${AUTH_URL}/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const user = await res.json();
      document.getElementById('user-points').innerText = user.points;
      document.getElementById('user-level').innerText = user.level;
    }
  } catch(err) {
    console.error('Gamification fetch error:', err);
  }
}

// Ensure auth on load
ensureAuth();

// 1. Initialize Map
function initMap() {
  // Center on Kolkata
  map = L.map('map').setView([22.5726, 88.3639], 13);

  // Add Street Map Tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  // Map Click Event (for selecting a location to report)
  map.on('click', function(e) {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;

    // Remove existing temporary marker
    if (clickMarker) {
      map.removeLayer(clickMarker);
    }

    // Add new temporary marker
    clickMarker = L.marker([lat, lng], { draggable: true }).addTo(map);
    clickMarker.bindPopup("<b>Selected Location</b><br>Click 'Report Issue' to submit.").openPopup();

    // Populate hidden inputs
    latInput.value = lat;
    lngInput.value = lng;
    
    // Update inputs if marker is dragged
    clickMarker.on('dragend', function(event) {
      const position = clickMarker.getLatLng();
      latInput.value = position.lat;
      lngInput.value = position.lng;
    });
  });

  // Load existing complaints
  loadComplaints();
}

// 2. Fetch and Display Complaints
async function loadComplaints() {
  try {
    const response = await fetch(`${API_URL}?sortBy=priority`);
    if (!response.ok) throw new Error('Failed to fetch complaints');
    
    const complaints = await response.json();
    
    complaints.forEach(complaint => {
      // Ensure we have valid coordinates
      if (complaint.location && complaint.location.coordinates && complaint.location.coordinates.length === 2) {
        // MongoDB uses [lng, lat], Leaflet uses [lat, lng]
        const lng = complaint.location.coordinates[0];
        const lat = complaint.location.coordinates[1];
        
        // Store complaint data on marker to allow real-time updates
        const marker = L.marker([lat, lng]).addTo(map);
        marker.complaintData = complaint;
        mapMarkers[complaint._id] = marker;
        
        updatePopupContent(marker); // Call the helper which sets the popup
      }
    });
  } catch (error) {
    console.error('Error loading complaints:', error);
  }
}

// Global function to handle upvote toggle
window.toggleUpvote = async function(complaintId) {
  const token = await ensureAuth();
  if (!token) return alert('Authentication required to upvote');

  try {
    const res = await fetch(`${API_URL}/${complaintId}/upvote`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await res.json();
    if (res.ok) {
      document.getElementById(`upvote-count-${complaintId}`).innerText = data.upvotes;
    } else {
      alert(data.message);
    }
  } catch (err) {
    console.error('Upvote failed', err);
  }
};

window.loadComments = async function(complaintId) {
  const container = document.getElementById(`comments-container-${complaintId}`);
  if (!container) return;
  container.innerHTML = '<small>Loading...</small>';
  try {
    const actualRes = await fetch(`${API_URL}/${complaintId}/comments`);
    const comments = await actualRes.json();
    
    if (comments.length === 0) {
      container.innerHTML = '<small style="color:#9CA3AF;">No comments yet.</small>';
      return;
    }

    container.innerHTML = comments.map(c => 
      `<div style="margin-bottom: 4px;"><strong>${c.userId?.name || 'User'}</strong>: ${c.text} 
        <small style="color:#9CA3AF; margin-left:4px; font-size:0.7em;">${new Date(c.createdAt).toLocaleDateString()}</small>
      </div>`
    ).join('');
  } catch (err) {
    container.innerHTML = '<small style="color:red;">Error loading comments</small>';
  }
};

window.postComment = async function(complaintId) {
  const token = await ensureAuth();
  if (!token) return alert('Authentication required to comment');
  
  const input = document.getElementById(`comment-input-${complaintId}`);
  const text = input.value.trim();
  if (!text) return;

  try {
    const res = await fetch(`${API_URL}/${complaintId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ text })
    });
    
    if (res.ok) {
      input.value = '';
      loadComments(complaintId);
      
      showNotification('Comment added! +2 Points.', 'success');
      const token = localStorage.getItem('civicseva_token');
      if(token) loadUserStats(token);
    } else {
      const data = await res.json();
      alert(data.message);
    }
  } catch (err) {
    console.error('Comment failed', err);
  }
};

// 3. Modal Logic
function openModal() {
  if (!latInput.value || !lngInput.value) {
    alert("Please click anywhere on the map first to select the issue location.");
    return;
  }
  reportModal.classList.remove('hidden');
}

function closeModal() {
  reportModal.classList.add('hidden');
  complaintForm.reset();
}

reportBtn.addEventListener('click', openModal);
closeBtn.addEventListener('click', closeModal);
window.addEventListener('click', (e) => {
  if (e.target === reportModal) closeModal();
});

// Helper for Privacy Blur
async function applyPrivacyBlur(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;

        // Apply a basic blur filter globally (in a real app, this would use a face-detection library)
        ctx.filter = 'blur(10px)';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas toBlob failed"));
        }, 'image/jpeg', 0.9);
      };
      img.onerror = reject;
      img.src = event.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 4. Form Submission
complaintForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const cityInput = document.getElementById('city');
  const pincodeInput = document.getElementById('pincode');
  
  const city = cityInput.value.trim();
  const pincode = pincodeInput.value.trim();
  
  if (!city) {
    alert("City is required.");
    return;
  }
  
  if (!/^\d{6}$/.test(pincode)) {
    alert("Pincode must be exactly 6 digits.");
    return;
  }
  let formData = new FormData(complaintForm);
  const blurCheck = document.getElementById('blur-photo');
  const photoInput = document.getElementById('photo');

  if (blurCheck && blurCheck.checked && photoInput.files.length > 0) {
    try {
      const blurredBlob = await applyPrivacyBlur(photoInput.files[0]);
      formData.set('photo', blurredBlob, 'blurred_photo.jpg');
    } catch (err) {
      console.error("Failed to blur image:", err);
      // Optional: stop submission if privacy mode fails, 
      // but for prototype we'll just alert and proceed or fail.
    }
  }

  const submitBtn = complaintForm.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  
  // Prepare data for potential offline storage
  const dataObject = {};
  formData.forEach((value, key) => {
    // We don't store the file in localStorage for this prototype to keep it simple
    if (key !== 'photo') dataObject[key] = value;
  });

  // CHECK ONLINE STATUS
  if (!navigator.onLine) {
    saveToOfflineQueue(dataObject);
    alert("You are currently offline. Your report has been saved and will be uploaded automatically once you are back online!");
    closeModal();
    return;
  }

  submitBtn.textContent = 'Submitting...';
  submitBtn.disabled = true;

  try {
    const headers = {};
    const token = localStorage.getItem('civicseva_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers,
      body: formData
    });

    if (response.ok) {
      alert("Complaint submitted successfully! +10 Points awarded.");
      closeModal();
      
      if (clickMarker) map.removeLayer(clickMarker);
      latInput.value = '';
      lngInput.value = '';
      
      loadComplaints();
      const token = localStorage.getItem('civicseva_token');
      if (token) loadUserStats(token); // Update UI
    } else {
      const errorData = await response.json();
      alert(`Error: ${errorData.message}`);
    }
  } catch (error) {
    console.error('Submission error:', error);
    // If a network error happens even if navigator.onLine was true
    saveToOfflineQueue(dataObject);
    alert("Connection lost. Report saved locally for auto-sync.");
    closeModal();
  } finally {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
});

// 5. Offline & Sync Logic
function saveToOfflineQueue(data) {
  const queue = JSON.parse(localStorage.getItem('civicseva_queue') || '[]');
  queue.push({ ...data, timestamp: Date.now() });
  localStorage.setItem('civicseva_queue', JSON.stringify(queue));
}

async function syncOfflineReports() {
  const queue = JSON.parse(localStorage.getItem('civicseva_queue') || '[]');
  if (queue.length === 0) return;

  console.log(`Checking for ${queue.length} offline reports to sync...`);

  const remainingQueue = [];

  for (const report of queue) {
    try {
      // Create a temporary FormData since the backend expects it
      const formData = new FormData();
      Object.keys(report).forEach(key => formData.append(key, report[key]));

      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Sync failed');
      console.log('Successfully synced one report.');
    } catch (error) {
      console.error('Failed to sync report, keeping in queue:', error);
      remainingQueue.push(report);
    }
  }

  localStorage.setItem('civicseva_queue', JSON.stringify(remainingQueue));
  
  if (remainingQueue.length < queue.length) {
    const syncedCount = queue.length - remainingQueue.length;
    alert(`Successfully synced ${syncedCount} offline report(s)!`);
    loadComplaints(); // Refresh map
  } else if (remainingQueue.length === 0) {
    console.log('All offline reports synced!');
  }
}

// Listen for network restoration
window.addEventListener('online', syncOfflineReports);

// Initial check on load
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  if (navigator.onLine) syncOfflineReports();
});
