// ============================================
// INTERNMATCH — COMPANY DASHBOARD SCRIPT
// (Integrated with Backend API)
// ============================================

const API_BASE = '/api';

// Retrieve token from login
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

if (!user || user?.role !== 'company') {
  window.location.href = 'company-login.html';
}

if (!user?.id) {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'company-login.html';
}

let companyInternships = [];
let companyApplications = [];

// -------------------
// TOAST
// -------------------
function showToast(title, message, type = 'success') {
  let existing = document.querySelector('.toast');
  if (existing) existing.remove();
  let toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <div class="toast-icon" style="color: var(--${type}); background: rgba(${type === 'success' ? '16,185,129' : '239,68,68'},0.12)">
      <i class="fas fa-${type === 'success' ? 'check' : 'times'}"></i>
    </div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 50);
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 3000);
}

// -------------------
// SECTION NAVIGATION
// -------------------
function showSection(sectionId) {
  document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active-section'));
  let target = document.getElementById('section-' + sectionId);
  if (target) {
    target.classList.add('active-section');
    target.style.animation = 'none';
    target.offsetHeight;
    target.style.animation = '';
  }
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
    if (item.getAttribute('data-section') === sectionId) item.classList.add('active');
  });

  if (sectionId === 'manage') fetchInternships();
  if (sectionId === 'applications') fetchApplications();
  if (sectionId === 'dashboard') {
    fetchInternships();
    fetchApplications();
  }
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// -------------------
// UPDATE STATS
// -------------------
function updateStats() {
  let el = (id) => document.getElementById(id);
  if (el('statPosted')) el('statPosted').textContent = companyInternships.length;
  if (el('statApps')) el('statApps').textContent = companyApplications.length;
  if (el('statActive')) el('statActive').textContent = companyInternships.filter(i => i.status === 'Active').length;
  if (el('statSelected')) el('statSelected').textContent = companyApplications.filter(a => a.status === 'Selected').length;
}

async function fetchCompanyProfile() {
  try {
    let res = await fetch(`${API_BASE}/company/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) return;

    let data = await res.json();
    const nameEl = document.getElementById('profileName');
    const industryEl = document.getElementById('profileIndustry');
    const locationEl = document.getElementById('profileLocation');

    if (nameEl) nameEl.value = data.company_name || '';
    if (industryEl) industryEl.value = data.industry || '';
    if (locationEl) locationEl.value = data.location || '';
  } catch (err) {
    console.error('Failed to load company profile:', err);
  }
}

// -------------------
// API: FETCH INTERNSHIPS
// -------------------
async function fetchInternships() {
  try {
    let res = await fetch(`${API_BASE}/internships`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      let data = await res.json();
      // Filter by company_id so a renamed company still sees its own internships
      companyInternships = data.filter(i => Number(i.company_id) === Number(user.id));
      displayManagedInternships();
      updateStats();
    }
  } catch (err) {
    console.error(err);
  }
}

// -------------------
// API: POST INTERNSHIP
// -------------------
async function postInternship(e) {
  e.preventDefault();
  let payload = {
    skill_required: document.getElementById('postSkill').value,
    stipend: document.getElementById('postStipend').value,
    location: document.getElementById('postLocation').value,
    duration: document.getElementById('postDuration').value,
    description: document.getElementById('postDescription').value
  };

  try {
    let res = await fetch(`${API_BASE}/internships`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      document.getElementById('postForm').reset();
      showToast('Internship Posted! 🎉', `${payload.skill_required} internship has been published.`);
      fetchInternships();
    } else {
      let data = await res.json();
      showToast('Error', data.error || 'Failed to post', 'error');
    }
  } catch (err) {
    showToast('Error', 'Server error', 'error');
  }

  return false;
}

// -------------------
// API: DELETE INTERNSHIP
// -------------------
async function deleteInternship(id, skill) {
  if (!confirm(`Are you sure you want to delete the ${skill} internship?`)) return;

  try {
    let res = await fetch(`${API_BASE}/internships/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (res.ok) {
      showToast('Internship Deleted', `${skill} internship has been removed.`);
      fetchInternships();
    }
  } catch (err) {
    showToast('Error', 'Failed to delete', 'error');
  }
}

function displayManagedInternships() {
  let grid = document.getElementById('manageGrid');
  let noMsg = document.getElementById('noManageMsg');
  let countEl = document.getElementById('manageCount');
  grid.innerHTML = '';

  if (countEl) countEl.textContent = companyInternships.length + ' posted';

  if (companyInternships.length === 0) {
    if (noMsg) noMsg.style.display = 'flex';
    return;
  }
  if (noMsg) noMsg.style.display = 'none';

  companyInternships.forEach(i => {
    let card = document.createElement('div');
    card.className = 'manage-card';
    card.innerHTML = `
      <h4><i class="fas fa-briefcase" style="color:var(--primary)"></i> ${i.skill_required} Intern</h4>
      <p><i class="fas fa-map-marker-alt" style="color:var(--text-muted);width:16px"></i> <b>Location:</b> ${i.location}</p>
      <p><i class="fas fa-rupee-sign" style="color:var(--text-muted);width:16px"></i> <b>Stipend:</b> ₹${i.stipend.toLocaleString()}/month</p>
      <p><i class="fas fa-clock" style="color:var(--text-muted);width:16px"></i> <b>Duration:</b> ${i.duration}</p>
      <div class="status-badge ${i.status === 'Active' ? 'status-selected' : 'status-rejected'}">
        <i class="fas fa-${i.status === 'Active' ? 'check-circle' : 'times-circle'}"></i> ${i.status}
      </div>
      <div class="card-actions">
        <button class="btn-sm btn-delete" onclick="deleteInternship(${i.id}, '${i.skill_required}')"><i class="fas fa-trash"></i> Delete</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

// -------------------
// API: FETCH APPLICATIONS
// -------------------
async function fetchApplications() {
  try {
    let res = await fetch(`${API_BASE}/applications`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      companyApplications = await res.json();
      displayApplications();
      updateStats();
    }
  } catch (err) {
    console.error(err);
  }
}

function displayApplications() {
  let grid = document.getElementById('applicationsGrid');
  let noMsg = document.getElementById('noAppsMsg');
  let countEl = document.getElementById('appCount');
  grid.innerHTML = '';

  if (countEl) countEl.textContent = companyApplications.length + ' total';

  if (companyApplications.length === 0) {
    if (noMsg) noMsg.style.display = 'flex';
    return;
  }
  if (noMsg) noMsg.style.display = 'none';

  companyApplications.forEach(a => {
    let statusClass = a.status === 'Selected' ? 'status-selected' : (a.status === 'Rejected' ? 'status-rejected' : 'status-pending');
    let statusIcon = a.status === 'Selected' ? 'check-circle' : (a.status === 'Rejected' ? 'times-circle' : 'clock');

    let actionsHTML = '';
    if (a.status === 'Pending') {
      actionsHTML = `
        <div class="card-actions">
          <button class="btn-sm btn-accept" onclick="updateAppStatus(${a.id}, 'Selected')"><i class="fas fa-check"></i> Accept</button>
          <button class="btn-sm btn-reject" onclick="updateAppStatus(${a.id}, 'Rejected')"><i class="fas fa-times"></i> Reject</button>
        </div>
      `;
    }

    let dateObj = new Date(a.applied_at);
    let dateStr = isNaN(dateObj) ? 'Recently' : dateObj.toLocaleDateString();

    let card = document.createElement('div');
    card.className = 'app-card-item';
    card.innerHTML = `
      <h4><i class="fas fa-user-graduate" style="color:var(--primary)"></i> ${a.student_name}</h4>
      <p><i class="fas fa-envelope" style="color:var(--text-muted);width:16px"></i> ${a.student_email}</p>
      <p><i class="fas fa-code" style="color:var(--text-muted);width:16px"></i> <b>Applied For:</b> ${a.skill_required}</p>
      <p><i class="fas fa-calendar" style="color:var(--text-muted);width:16px"></i> <b>Applied:</b> ${dateStr}</p>
      <div class="status-badge ${statusClass}">
        <i class="fas fa-${statusIcon}"></i> ${a.status}
      </div>
      ${actionsHTML}
    `;
    grid.appendChild(card);
  });
}

// -------------------
// API: UPDATE APPLICATION STATUS
// -------------------
async function updateAppStatus(id, newStatus) {
  try {
    let res = await fetch(`${API_BASE}/applications/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ status: newStatus })
    });
    
    if (res.ok) {
      showToast(`Application ${newStatus}!`, `Student application has been ${newStatus.toLowerCase()}.`);
      fetchApplications();
    }
  } catch (err) {
    showToast('Error', 'Failed to update status', 'error');
  }
}

// Profile saved to MySQL
function saveCompanyProfile(e) {
  e.preventDefault();
  return updateCompanyProfile();
}

async function updateCompanyProfile() {
  try {
    const payload = {
      companyName: document.getElementById('profileName')?.value.trim() || '',
      industry: document.getElementById('profileIndustry')?.value.trim() || '',
      location: document.getElementById('profileLocation')?.value.trim() || ''
    };

    let res = await fetch(`${API_BASE}/company/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      showToast('Profile Saved!', 'Your company profile has been updated.');
      if (user) {
        user.name = payload.companyName || user.name;
        localStorage.setItem('user', JSON.stringify(user));
      }
      await fetchCompanyProfile();
    } else {
      let data = await res.json().catch(() => ({}));
      showToast('Error', data.error || 'Failed to save profile', 'error');
    }
  } catch (err) {
    showToast('Error', 'Server error while saving profile', 'error');
  }
  return false;
}

// LOGOUT
document.querySelector('.sidebar-logout').addEventListener('click', (e) => {
  e.preventDefault();
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
});

// INIT
window.onload = function() {
  document.querySelector('.topbar-greeting h2').innerHTML = `Welcome, ${user.name} <span class="wave">🏢</span>`;
  fetchCompanyProfile();
  fetchInternships();
  fetchApplications();
};
