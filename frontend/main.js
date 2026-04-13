// Configuration
const API_URL = 'http://localhost:5000/api/complaints';
let map;
let clickMarker = null;

// DOM Elements
const reportBtn = document.getElementById('report-btn');
const reportModal = document.getElementById('report-modal');
const closeBtn = document.querySelector('.close-btn');
const complaintForm = document.getElementById('complaint-form');
const latInput = document.getElementById('lat');
const lngInput = document.getElementById('lng');

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
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Failed to fetch complaints');
    
    const complaints = await response.json();
    
    complaints.forEach(complaint => {
      // Ensure we have valid coordinates
      if (complaint.location && complaint.location.coordinates && complaint.location.coordinates.length === 2) {
        // MongoDB uses [lng, lat], Leaflet uses [lat, lng]
        const lng = complaint.location.coordinates[0];
        const lat = complaint.location.coordinates[1];
        
        let statusClass = "pending";
        if (complaint.status === "In Progress") statusClass = "in-progress";
        if (complaint.status === "Resolved") statusClass = "resolved";

        const popupContent = `
          <div class="popup-content">
            <h3>${complaint.title}</h3>
            <p><strong>Category:</strong> ${complaint.category}</p>
            <p>${complaint.description}</p>
            ${complaint.photo ? `<img src="http://localhost:5000${complaint.photo}" alt="Issue Photo" style="width:100%; margin-top:5px; border-radius:4px; max-height:100px; object-fit:cover;">` : ''}
            <span class="status-badge ${statusClass}">${complaint.status}</span>
          </div>
        `;

        L.marker([lat, lng])
          .addTo(map)
          .bindPopup(popupContent, { className: 'custom-popup' });
      }
    });
  } catch (error) {
    console.error('Error loading complaints:', error);
  }
}

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

// 4. Form Submission
complaintForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData(complaintForm);
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
    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      alert("Complaint submitted successfully!");
      closeModal();
      
      if (clickMarker) map.removeLayer(clickMarker);
      latInput.value = '';
      lngInput.value = '';
      
      loadComplaints();
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
  if (remainingQueue.length === 0) {
    console.log('All offline reports synced!');
    loadComplaints(); // Refresh map
  }
}

// Listen for network restoration
window.addEventListener('online', syncOfflineReports);

// Initial check on load
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  if (navigator.onLine) syncOfflineReports();
});
