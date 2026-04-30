// ============================================
// INTERNMATCH — STUDENT DASHBOARD SCRIPT
// (Integrated with Backend API)
// ============================================

const API_BASE = '/api';

// Retrieve token from login
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

if (!user || user?.role !== 'student') {
  window.location.href = 'student-login.html';
}

// -------------------
// GLOBAL DATA
// -------------------
let skills = JSON.parse(localStorage.getItem("skills")) || [];
let allInternships = [];
let applications = [];

// -------------------
// NAVIGATION
// -------------------
function goStudent() {
  window.location.href = "student.html";
}

function showRegister() {
  window.location.href = "register.html";
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}

// Attach logout to any logout buttons if they exist
document.querySelectorAll('.sidebar-logout').forEach(btn => {
  btn.onclick = (e) => { e.preventDefault(); logout(); };
});

// -------------------
// SECTION SWITCHING
// -------------------
function showSection(sectionId) {
  let sections = document.querySelectorAll(".content-section");
  sections.forEach(s => s.classList.remove("active-section"));

  let target = document.getElementById("section-" + sectionId);
  if (target) {
    target.classList.add("active-section");
    target.style.animation = 'none';
    target.offsetHeight; 
    target.style.animation = '';
  }

  let navItems = document.querySelectorAll(".nav-item");
  navItems.forEach(item => {
    item.classList.remove("active");
    if (item.getAttribute("data-section") === sectionId) {
      item.classList.add("active");
    }
  });

  if (sectionId === "skills") {
    displaySkills();
    highlightSkills();
  } else if (sectionId === "internships") {
    showInternships();
  } else if (sectionId === "applications") {
    fetchApplications();
  } else if (sectionId === "dashboard") {
    updateStats();
  }
}

function toggleSidebar() {
  let sidebar = document.getElementById("sidebar");
  let overlay = document.getElementById("sidebarOverlay");
  sidebar.classList.toggle("open");
  if (overlay) overlay.classList.toggle("active");
}

// -------------------
// TOAST NOTIFICATION
// -------------------
function showToast(title, message, type = 'success') {
  let existing = document.querySelector(".toast");
  if (existing) existing.remove();

  let toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-icon" style="color: var(--${type === 'success' ? 'success' : 'danger'}); background: rgba(${type === 'success' ? '16,185,129' : '239,68,68'},0.12)">
      <i class="fas fa-${type === 'success' ? 'check' : 'exclamation-triangle'}"></i>
    </div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
  `;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 50);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// -------------------
// UPDATE STATS
// -------------------
function updateStats() {
  let statSkills = document.getElementById("statSkills");
  let statMatched = document.getElementById("statMatched");
  let statApplications = document.getElementById("statApplications");
  let statPending = document.getElementById("statPending");
  let notifBadge = document.getElementById("notifBadge");

  if (statSkills) statSkills.textContent = skills.length;

  let matched = allInternships.filter(i => skills.includes(i.skill_required));
  if (statMatched) statMatched.textContent = matched.length;

  if (statApplications) statApplications.textContent = applications.length;

  let pending = applications.filter(a => a.status === "Pending").length;
  if (statPending) statPending.textContent = pending;
  if (notifBadge) notifBadge.textContent = pending;
}

// -------------------
// PROFILE
// -------------------
function saveProfile() {
  let input = document.getElementById("interestInput");
  if (!input) return;
  let interest = input.value.trim();
  if (interest === "") {
    showToast("Oops!", "Please enter your area of interest.", "error");
    return;
  }
  localStorage.setItem("interest", interest);
  showToast("Profile Saved!", "Your interest has been updated successfully.");
}

// -------------------
// SKILLS SYSTEM
// -------------------
async function syncSkillsToStorage() {
  localStorage.setItem("skills", JSON.stringify(skills));
}

async function fetchSkills() {
  try {
    let res = await fetch(`${API_BASE}/skills`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
      skills = await res.json();
      await syncSkillsToStorage();
    }
  } catch (err) {
    console.error('Failed to fetch skills:', err);
  }
  displaySkills();
  highlightSkills();
  showInternships();
  updateStats();
}

async function addSkill(skill) {
  if (!skills.includes(skill)) {
    try {
      let res = await fetch(`${API_BASE}/skills`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ skill })
      });

      if (!res.ok) {
        let data = await res.json().catch(() => ({}));
        showToast("Notice", data.error || "Could not save skill", "error");
        return;
      }

      await fetchSkills();
      showToast("Skill Added!", `"${skill}" has been added to your profile.`);
    } catch (err) {
      showToast("Error", "Server error while saving skill.", "error");
    }
  }
}

function displaySkills() {
  let list = document.getElementById("skillList");
  let noMsg = document.getElementById("noSkillsMsg");
  let countEl = document.getElementById("skillCount");
  if (!list) return;

  list.innerHTML = "";
  if (countEl) countEl.textContent = skills.length + " selected";

  if (skills.length === 0) {
    if (noMsg) noMsg.style.display = "flex";
    return;
  }
  if (noMsg) noMsg.style.display = "none";

  skills.forEach((s, index) => {
    let span = document.createElement("span");
    span.innerHTML = `${s} <i class="fas fa-times"></i>`;
    span.onclick = () => removeSkill(index);
    span.title = "Click to remove";
    list.appendChild(span);
  });
}

async function removeSkill(index) {
  let removed = skills[index];
  try {
    let res = await fetch(`${API_BASE}/skills/${encodeURIComponent(removed)}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
      let data = await res.json().catch(() => ({}));
      showToast("Notice", data.error || "Could not remove skill", "error");
      return;
    }

    await fetchSkills();
    showToast("Skill Removed", `"${removed}" has been removed from your profile.`);
  } catch (err) {
    showToast("Error", "Server error while removing skill.", "error");
  }
}

function highlightSkills() {
  let buttons = document.querySelectorAll(".skill-options button");
  buttons.forEach(btn => {
    let skill = btn.getAttribute("data-skill");
    if (skill && skills.includes(skill)) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

// -------------------
// API: FETCH INTERNSHIPS
// -------------------
async function fetchInternships() {
  try {
    let res = await fetch(`${API_BASE}/internships`);
    if (res.ok) {
      allInternships = await res.json();
      showInternships();
      updateStats();
    }
  } catch (err) {
    console.error("Failed to fetch internships:", err);
  }
}

function showInternships() {
  let div = document.getElementById("internships");
  let noMsg = document.getElementById("noInternshipsMsg");
  let countEl = document.getElementById("matchedCount");
  if (!div) return;

  div.innerHTML = "";

  if (skills.length === 0) {
    if (noMsg) {
      noMsg.style.display = "flex";
      noMsg.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Please add skills first to see matching internships.';
    }
    if (countEl) countEl.textContent = "0 found";
    return;
  }

  // Use optional search filter if searchBar exists
  let searchQuery = document.getElementById("searchBar")?.value.toLowerCase() || "";
  
  let matched = allInternships.filter(i => {
    let matchesSkill = skills.includes(i.skill_required);
    let matchesSearch = !searchQuery || 
                        i.company_name.toLowerCase().includes(searchQuery) ||
                        i.skill_required.toLowerCase().includes(searchQuery) ||
                        i.location.toLowerCase().includes(searchQuery);
    return matchesSkill && matchesSearch;
  });

  if (matched.length === 0) {
    if (noMsg) {
      noMsg.style.display = "flex";
      noMsg.innerHTML = '<i class="fas fa-search"></i> No internships match your current skills/search.';
    }
    if (countEl) countEl.textContent = "0 found";
    return;
  }

  if (noMsg) noMsg.style.display = "none";
  if (countEl) countEl.textContent = matched.length + " found";

  matched.forEach(i => {
    // Check if applied using actual application records based exclusively on internship_id
    let alreadyApplied = applications.some(a => a.internship_id === i.id);
    
    let buttonHTML = alreadyApplied
      ? `<button class="btn-primary" disabled style="opacity:0.7;cursor:not-allowed;"><i class="fas fa-check-circle"></i> Applied Successfully</button>`
      : `<button class="btn-primary" onclick="applyToInternship(event, ${i.id}, '${i.company_name}')"><i class="fas fa-paper-plane"></i> Apply Now</button>`;

    let card = document.createElement("div");
    card.className = "internship-card";
    card.innerHTML = `
      <h4><i class="fas fa-building" style="color: var(--primary);"></i> ${i.company_name}</h4>
      <p><i class="fas fa-code" style="color: var(--text-muted); width: 16px;"></i> <b>Skill:</b> ${i.skill_required}</p>
      <p><i class="fas fa-map-marker-alt" style="color: var(--text-muted); width: 16px;"></i> <b>Location:</b> ${i.location}</p>
      <p><i class="fas fa-rupee-sign" style="color: var(--text-muted); width: 16px;"></i> <b>Stipend:</b> ₹${parseInt(i.stipend).toLocaleString()}/month</p>
      <p><i class="fas fa-clock" style="color: var(--text-muted); width: 16px;"></i> <b>Duration:</b> ${i.duration}</p>
      ${buttonHTML}
    `;
    div.appendChild(card);
  });
}

// Search functionality triggered by keyup on searchBar
document.getElementById('searchBar')?.addEventListener('keyup', showInternships);

// -------------------
// API: APPLICATION SYSTEM
// -------------------
async function applyToInternship(event, internshipId, companyName) {
  // Prevent double clicks instantly
  let btn = event.currentTarget;
  let originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Applying...`;
  btn.style.opacity = '0.7';

  try {
    let res = await fetch(`${API_BASE}/applications/apply`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ internship_id: internshipId })
    });
    
    if (res.ok) {
      showSuccessPopup(companyName);
      await fetchApplications(); // Ensure applications array updates before re-enabling UI
    } else {
      let data = await res.json();
      btn.disabled = false;
      btn.innerHTML = originalHtml;
      btn.style.opacity = '1';
      showToast("Notice", data.error || "Could not apply", "error");
    }
  } catch (err) {
    btn.disabled = false;
    btn.innerHTML = originalHtml;
    btn.style.opacity = '1';
    showToast("Error", "Server error while applying.", "error");
  }
}

// -------------------
// AWESOME SUCCESS POPUP
// -------------------
function showSuccessPopup(companyName) {
  let overlay = document.createElement('div');
  overlay.className = 'success-popup-overlay';
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    z-index: 9999; opacity: 0; transition: opacity 0.3s ease;
  `;

  let popup = document.createElement('div');
  popup.style.cssText = `
    background: var(--card-bg, #fff); padding: 40px; border-radius: 16px;
    text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.2);
    transform: scale(0.8); transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    max-width: 90%; width: 400px; border: 1px solid var(--border-color, #e5e7eb);
  `;

  popup.innerHTML = `
    <div style="width: 80px; height: 80px; background: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
      <i class="fas fa-check" style="color: white; font-size: 40px;"></i>
    </div>
    <h2 style="margin: 0 0 10px; color: var(--text-dark, #111827); font-size: 24px;">Application Sent!</h2>
    <p style="margin: 0 0 25px; color: var(--text-muted, #6b7280); font-size: 16px; line-height: 1.5;">
      You have successfully applied to <b>${companyName}</b>. They will review your application soon. Good luck! 🎉
    </p>
    <button onclick="this.closest('.success-popup-overlay').remove()" style="
      background: var(--primary, #3b82f6); color: white; border: none; padding: 12px 30px;
      border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;
      width: 100%; transition: opacity 0.2s;
    ">Awesome!</button>
  `;

  overlay.appendChild(popup);
  document.body.appendChild(overlay);

  // Trigger animations
  requestAnimationFrame(() => {
    overlay.style.opacity = '1';
    popup.style.transform = 'scale(1)';
  });
}

async function fetchApplications() {
  try {
    let res = await fetch(`${API_BASE}/applications/my`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      applications = await res.json();
      displayApplications();
      showInternships(); // update button states
      updateStats();
    }
  } catch (err) {
    console.error("Failed to fetch applications:", err);
  }
}

function displayApplications() {
  let div = document.getElementById("applications");
  let noMsg = document.getElementById("noAppsMsg");
  let countEl = document.getElementById("appCount");
  if (!div) return;

  div.innerHTML = "";
  if (countEl) countEl.textContent = applications.length + " total";

  if (applications.length === 0) {
    if (noMsg) noMsg.style.display = "flex";
    return;
  }
  if (noMsg) noMsg.style.display = "none";

  applications.forEach(a => {
    let statusClass = "status-pending";
    let statusIcon = "fa-clock";
    if (a.status === "Selected") {
      statusClass = "status-selected";
      statusIcon = "fa-check-circle";
    } else if (a.status === "Rejected") {
      statusClass = "status-rejected";
      statusIcon = "fa-times-circle";
    }

    let dateObj = new Date(a.applied_at);
    let dateStr = isNaN(dateObj) ? 'Recently' : dateObj.toLocaleDateString();

    let card = document.createElement("div");
    card.className = "internship-card app-card";
    card.innerHTML = `
      <h4><i class="fas fa-building" style="color: var(--primary);"></i> ${a.company_name}</h4>
      <p><i class="fas fa-code" style="color: var(--text-muted); width: 16px;"></i> <b>Skill:</b> ${a.skill_required}</p>
      <p><i class="fas fa-calendar" style="color: var(--text-muted); width: 16px;"></i> <b>Applied:</b> ${dateStr}</p>
      <div class="status-badge ${statusClass}">
        <i class="fas ${statusIcon}"></i> ${a.status}
      </div>
      ${a.status === 'Pending' ? `<button onclick="withdrawApplication(${a.id})" class="btn-sm" style="background:#ef4444;color:#fff;border:none;border-radius:6px;padding:6px 12px;margin-top:10px;cursor:pointer;font-size:13px;width:100%;"><i class="fas fa-trash"></i> Withdraw</button>` : ''}
    `;
    div.appendChild(card);
  });
}

// -------------------
// WITHDRAW APPLICATION
// -------------------
async function withdrawApplication(applicationId) {
  if (!confirm('Are you sure you want to withdraw this application?')) return;
  
  try {
    let res = await fetch(`${API_BASE}/applications/withdraw/${applicationId}`, {
      method: 'DELETE',
      headers: { 
        'Authorization': `Bearer ${token}` 
      }
    });
    
    if (res.ok) {
      showToast("Withdrawn", "Your application has been successfully withdrawn.");
      fetchApplications(); // Refresh applications, which will update buttons in the internships list
    } else {
      let data = await res.json();
      showToast("Notice", data.error || "Could not withdraw application", "error");
    }
  } catch (err) {
    showToast("Error", "Server error while withdrawing.", "error");
  }
}

// -------------------
// DARK MODE
// -------------------
function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  let isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('darkMode', isDark);
  let toggleBtn = document.getElementById('darkModeToggle');
  if (toggleBtn) {
    toggleBtn.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  }
}

// -------------------
// LOAD DATA ON START
// -------------------
window.onload = function () {
  // Set user greeting
  let greetingEl = document.querySelector('.topbar-greeting h2');
  if (greetingEl && user) greetingEl.innerHTML = `Welcome, ${user.name} <span class="wave">👋</span>`;

  // Restore interest field
  let savedInterest = localStorage.getItem("interest");
  if (savedInterest) {
    let input = document.getElementById("interestInput");
    if (input) input.value = savedInterest;
  }

  // Apply dark mode preference
  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
    let toggleBtn = document.getElementById('darkModeToggle');
    if (toggleBtn) toggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
  }

  // Initial Data Fetch
  fetchInternships();
  fetchApplications();
  fetchSkills();

  // Add overlay element for mobile sidebar
  if (!document.getElementById("sidebarOverlay")) {
    let overlay = document.createElement("div");
    overlay.className = "sidebar-overlay";
    overlay.id = "sidebarOverlay";
    overlay.onclick = toggleSidebar;
    document.body.appendChild(overlay);
  }
};
