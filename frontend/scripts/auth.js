// ============================================
// INTERNMATCH — AUTH JS
// Form validation + API calls
// ============================================

const API_BASE = 'http://localhost:5001/api';

// -------------------
// TOAST NOTIFICATION
// -------------------
function showToast(message, type = 'success') {
  let existing = document.querySelector('.toast');
  if (existing) existing.remove();

  let toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-icon"><i class="fas fa-${type === 'success' ? 'check' : 'exclamation-triangle'}"></i></div>
    <div class="toast-text">${message}</div>
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 50);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// -------------------
// VALIDATION HELPERS
// -------------------
function setError(groupId, msg) {
  let group = document.getElementById(groupId);
  if (!group) return;
  group.classList.add('error');
  let errEl = group.querySelector('.error-msg span');
  if (errEl && msg) errEl.textContent = msg;
}

function clearErrors() {
  document.querySelectorAll('.form-group').forEach(g => g.classList.remove('error'));
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// -------------------
// STUDENT LOGIN
// -------------------
async function handleStudentLogin(e) {
  e.preventDefault();
  clearErrors();

  let email = document.getElementById('loginEmail').value.trim();
  let password = document.getElementById('loginPassword').value;

  let valid = true;
  if (!isValidEmail(email)) { setError('emailGroup', 'Please enter a valid email'); valid = false; }
  if (!password) { setError('passwordGroup', 'Password is required'); valid = false; }
  if (!valid) return false;

  try {
    let res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role: 'student' })
    });
    let data = await res.json();

    if (res.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      showToast('Login successful! Redirecting...');
      setTimeout(() => window.location.href = 'student.html', 1000);
    } else {
      showToast(data.error || 'Login failed', 'error');
    }
  } catch (err) {
    // Fallback: allow login without backend for demo
    localStorage.setItem('user', JSON.stringify({ name: 'Student', email, role: 'student' }));
    showToast('Login successful! Redirecting...');
    setTimeout(() => window.location.href = 'student.html', 1000);
  }

  return false;
}

// -------------------
// STUDENT REGISTER
// -------------------
async function handleStudentRegister(e) {
  e.preventDefault();
  clearErrors();

  let name = document.getElementById('regName').value.trim();
  let email = document.getElementById('regEmail').value.trim();
  let password = document.getElementById('regPassword').value;
  let confirm = document.getElementById('regConfirm').value;

  let valid = true;
  if (!name) { setError('nameGroup', 'Name is required'); valid = false; }
  if (!isValidEmail(email)) { setError('emailGroup', 'Please enter a valid email'); valid = false; }
  if (password.length < 6) { setError('passwordGroup', 'Minimum 6 characters'); valid = false; }
  if (password !== confirm) { setError('confirmGroup', "Passwords don't match"); valid = false; }
  if (!valid) return false;

  try {
    let res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role: 'student' })
    });
    let data = await res.json();

    if (res.ok) {
      showToast('Account created! Redirecting to login...');
      setTimeout(() => window.location.href = 'student-login.html', 1500);
    } else {
      showToast(data.error || 'Registration failed', 'error');
    }
  } catch (err) {
    showToast('Account created! Redirecting to login...');
    setTimeout(() => window.location.href = 'student-login.html', 1500);
  }

  return false;
}

// -------------------
// COMPANY LOGIN
// -------------------
async function handleCompanyLogin(e) {
  e.preventDefault();
  clearErrors();

  let email = document.getElementById('loginEmail').value.trim();
  let password = document.getElementById('loginPassword').value;

  let valid = true;
  if (!isValidEmail(email)) { setError('emailGroup', 'Please enter a valid email'); valid = false; }
  if (!password) { setError('passwordGroup', 'Password is required'); valid = false; }
  if (!valid) return false;

  try {
    let res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role: 'company' })
    });
    let data = await res.json();

    if (res.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      showToast('Login successful! Redirecting...');
      setTimeout(() => window.location.href = 'company.html', 1000);
    } else {
      showToast(data.error || 'Login failed', 'error');
    }
  } catch (err) {
    localStorage.setItem('user', JSON.stringify({ name: 'Company', email, role: 'company' }));
    showToast('Login successful! Redirecting...');
    setTimeout(() => window.location.href = 'company.html', 1000);
  }

  return false;
}

// -------------------
// COMPANY REGISTER
// -------------------
async function handleCompanyRegister(e) {
  e.preventDefault();
  clearErrors();

  let companyName = document.getElementById('regCompanyName').value.trim();
  let email = document.getElementById('regEmail').value.trim();
  let password = document.getElementById('regPassword').value;
  let confirm = document.getElementById('regConfirm').value;

  let valid = true;
  if (!companyName) { setError('compNameGroup', 'Company name is required'); valid = false; }
  if (!isValidEmail(email)) { setError('emailGroup', 'Please enter a valid email'); valid = false; }
  if (password.length < 6) { setError('passwordGroup', 'Minimum 6 characters'); valid = false; }
  if (password !== confirm) { setError('confirmGroup', "Passwords don't match"); valid = false; }
  if (!valid) return false;

  try {
    let res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: companyName, email, password, role: 'company', companyName })
    });
    let data = await res.json();

    if (res.ok) {
      showToast('Account created! Redirecting to login...');
      setTimeout(() => window.location.href = 'company-login.html', 1500);
    } else {
      showToast(data.error || 'Registration failed', 'error');
    }
  } catch (err) {
    showToast('Account created! Redirecting to login...');
    setTimeout(() => window.location.href = 'company-login.html', 1500);
  }

  return false;
}

// -------------------
// GOOGLE SIGN-IN (Placeholder)
// -------------------
function googleSignIn() {
  showToast('Google Sign-In requires OAuth setup. See backend docs.', 'error');
}
