// Configuration
const API_URL = 'http://localhost:5000/api/complaints';
const AUTH_URL = 'http://localhost:5000/api/auth';
let map;
const mapMarkers = {}; // Store markers

// Initialize Socket.io
const socket = io('http://localhost:5000');
socket.on('connect', () => console.log('Admin connected to real-time updates'));

socket.on('statusUpdate', (data) => {
  const { id, status } = data;
  
  // 1. Update Map Marker
  const marker = mapMarkers[id];
  if (marker) {
    marker.complaintData.status = status;
    updatePopupContent(marker);
  }
  
  // 2. Update Sidebar Card
  const listSelect = document.querySelector(`.complaint-card[data-id="${id}"] select`);
  if (listSelect) {
    listSelect.value = status;
  }
  const badge = document.querySelector(`.complaint-card[data-id="${id}"] .status-badge`);
  if (badge) {
    badge.textContent = status;
    badge.className = `status-badge ${status === 'In Progress' ? 'in-progress' : status === 'Resolved' ? 'resolved' : 'pending'}`;
  }

  showNotification(`Complaint status updated to ${status}`, 'success');
});

// Toast Notification
function showNotification(message, type = 'info') {
  const container = document.getElementById('notification-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icon = type === 'success' ? '✅' : 'ℹ️';
  toast.innerHTML = `<span>${icon}</span><div>${message}</div>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('hide');
    toast.addEventListener('animationend', () => toast.remove());
  }, 4000);
}

// Mock Admin Auth
async function ensureAdminAuth() {
  let token = localStorage.getItem('civicseva_admin_token');
  if (token) return token;
  const mockAdmin = {
    name: "Admin User",
    email: `admin${Date.now()}@example.com`,
    password: "password123",
    role: "admin"
  };
  try {
    const res = await fetch(`${AUTH_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockAdmin)
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('civicseva_admin_token', data.token);
      return data.token;
    }
  } catch (err) {
    console.error("Auth error", err);
  }
  return null;
}

// Initialize Admin Dashboard
async function init() {
  await ensureAdminAuth();
  
  // Init Map
  map = L.map('admin-map').setView([22.5726, 88.3639], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  loadComplaints();
}

async function loadComplaints() {
  try {
    const response = await fetch(`${API_URL}?sortBy=priority`);
    if (!response.ok) throw new Error('Failed to fetch complaints');
    const complaints = await response.json();
    
    const listContainer = document.getElementById('admin-list');
    listContainer.innerHTML = '<h3>Live Complaints</h3>';

    complaints.forEach(complaint => {
      // 1. Render Map Marker
      if (complaint.location && complaint.location.coordinates) {
        const lng = complaint.location.coordinates[0];
        const lat = complaint.location.coordinates[1];
        const marker = L.marker([lat, lng]).addTo(map);
        marker.complaintData = complaint;
        mapMarkers[complaint._id] = marker;
        updatePopupContent(marker);
      }

      // 2. Render Sidebar Card
      let statusClass = "pending";
      if (complaint.status === "In Progress") statusClass = "in-progress";
      if (complaint.status === "Resolved") statusClass = "resolved";

      const card = document.createElement('div');
      card.className = 'complaint-card';
      card.setAttribute('data-id', complaint._id);
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between;">
          <h4>${complaint.title}</h4>
          <span class="status-badge ${statusClass}">${complaint.status}</span>
        </div>
        <p style="font-size:0.85rem; color:#6B7280; margin-bottom:5px;">${complaint.category} • Priority: ${complaint.priorityScore}</p>
        <p style="font-size:0.9rem;">${complaint.description}</p>
        <select onchange="changeStatus('${complaint._id}', this.value)">
          <option value="Pending" ${complaint.status === 'Pending' ? 'selected' : ''}>Pending</option>
          <option value="In Progress" ${complaint.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
          <option value="Resolved" ${complaint.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
        </select>
      `;
      listContainer.appendChild(card);
    });
  } catch (err) {
    console.error('Error loading complaints', err);
  }
}

function updatePopupContent(marker) {
  const complaint = marker.complaintData;
  let statusClass = "pending";
  if (complaint.status === "In Progress") statusClass = "in-progress";
  if (complaint.status === "Resolved") statusClass = "resolved";

  const popupContent = `
    <div class="popup-content" data-id="${complaint._id}">
      <h3>${complaint.title}</h3>
      <p><strong>Category:</strong> ${complaint.category}</p>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
        <span class="status-badge ${statusClass}">${complaint.status}</span>
        <span>🔥 Priority: ${complaint.priorityScore}</span>
      </div>
    </div>
  `;
  marker.bindPopup(popupContent, { className: 'custom-popup' });
}

window.changeStatus = async function(id, newStatus) {
  const token = await ensureAdminAuth();
  if (!token) return alert('Auth required');

  try {
    const res = await fetch(`${API_URL}/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: newStatus })
    });
    
    if (!res.ok) {
      const data = await res.json();
      alert(`Error updating status: ${data.message}`);
    }
    // Success handling is driven by the socket.io 'statusUpdate' event globally
  } catch (err) {
    console.error(err);
  }
}

// Boot
window.onload = init;
