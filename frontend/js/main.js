/* =========================================================
   ABC COLLEGE — shared front-end utilities
   Loaded on every page, before the page-specific script.
   ========================================================= */

/* ---------------- Auth/session helpers ---------------- */
function getToken() { return localStorage.getItem("abc_token"); }
function getUser() {
  const raw = localStorage.getItem("abc_user");
  return raw ? JSON.parse(raw) : null;
}
function setAuth(token, user) {
  localStorage.setItem("abc_token", token);
  localStorage.setItem("abc_user", JSON.stringify(user));
}
function clearAuth() {
  localStorage.removeItem("abc_token");
  localStorage.removeItem("abc_user");
}
function isLoggedIn() { return !!getToken(); }
function logout() {
  clearAuth();
  window.location.href = pathTo("login.html");
}

// Works out the correct relative path whether the current page is at the
// frontend root, or inside /student/ or /admin/.
function pathTo(target) {
  const depth = window.location.pathname.includes("/student/") || window.location.pathname.includes("/admin/") ? "../" : "";
  return depth + target;
}

// Redirects away if the user isn't logged in / doesn't have the right role.
// Call at the top of any protected page.
function requireAuth(role) {
  const user = getUser();
  if (!isLoggedIn() || !user) {
    window.location.href = pathTo("login.html");
    return null;
  }
  if (role && user.role !== role) {
    window.location.href = user.role === "admin" ? pathTo("admin/dashboard.html") : pathTo("student/dashboard.html");
    return null;
  }
  return user;
}

/* ---------------- Fetch wrapper ---------------- */
async function apiFetch(endpoint, options = {}) {
  const headers = options.headers ? { ...options.headers } : {};
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  let data = {};
  try { data = await res.json(); } catch (e) { /* no JSON body */ }

  if (!res.ok) {
    throw new Error(data.message || "Something went wrong. Please try again.");
  }
  return data;
}

/* ---------------- Toasts ---------------- */
function showToast(message, type = "success") {
  let container = document.getElementById("abc-toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "abc-toast-container";
    container.className = "toast-container position-fixed top-0 end-0 p-3";
    container.style.zIndex = "1080";
    document.body.appendChild(container);
  }
  const bg = type === "success" ? "bg-purple" : type === "error" ? "bg-maroon" : "bg-navy";
  const toastEl = document.createElement("div");
  toastEl.className = `toast align-items-center text-white ${bg} border-0`;
  toastEl.setAttribute("role", "alert");
  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>`;
  container.appendChild(toastEl);
  const toast = new bootstrap.Toast(toastEl, { delay: 4000 });
  toast.show();
  toastEl.addEventListener("hidden.bs.toast", () => toastEl.remove());
}

/* ---------------- Formatting helpers ---------------- */
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function formatTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hour = Number(h);
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${m} ${period}`;
}
function statusClass(status) {
  const map = {
    "Upcoming": "status-upcoming",
    "Registration Open": "status-open",
    "Registration Closed": "status-closed",
    "Completed": "status-completed",
    "Cancelled": "status-cancelled",
  };
  return map[status] || "status-upcoming";
}
function imageUrl(path) {
  if (!path) return "https://placehold.co/600x340/E8DCC4/172A46?text=ABC+College+Event";
  return path.startsWith("http") ? path : `${UPLOADS_BASE}${path}`;
}

/* ---------------- College emblem logo (pure SVG, no real institution) ---------------- */
function logoSVG(size = 44) {
  return `
  <svg class="abc-emblem" width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-label="ABC College emblem">
    <circle cx="50" cy="50" r="48" fill="#6A3D8F" stroke="#E8DCC4" stroke-width="3"/>
    <circle cx="50" cy="50" r="38" fill="none" stroke="#FFF8E7" stroke-width="1.5" opacity="0.5"/>
    <path d="M50 22 L66 66 H58 L55 57 H45 L42 66 H34 Z M50 34 L44 51 H56 Z" fill="#FFF8E7"/>
    <rect x="30" y="72" width="40" height="4" fill="#800020"/>
    <path d="M20 40 Q50 28 80 40" stroke="#FFF8E7" stroke-width="2" fill="none" opacity="0.7"/>
  </svg>`;
}

/* ---------------- Navbar ---------------- */
function renderNavbar(active = "") {
  const el = document.getElementById("navbar-placeholder");
  if (!el) return;
  const user = getUser();

  let rightLinks = "";
  if (isLoggedIn() && user) {
    const dashHref = user.role === "admin" ? pathTo("admin/dashboard.html") : pathTo("student/dashboard.html");
    rightLinks = `
      <li class="nav-item"><a class="nav-link" href="${dashHref}"><i class="bi bi-speedometer2 me-1"></i>Dashboard</a></li>
      <li class="nav-item"><a class="nav-link" href="#" onclick="logout(); return false;"><i class="bi bi-box-arrow-right me-1"></i>Logout</a></li>`;
  } else {
    rightLinks = `
      <li class="nav-item"><a class="nav-link ${active === 'login' ? 'active' : ''}" href="${pathTo('login.html')}">Login</a></li>
      <li class="nav-item"><a class="btn btn-brand-primary btn-sm ms-lg-2 mt-2 mt-lg-0" href="${pathTo('register.html')}">Register</a></li>`;
  }

  el.innerHTML = `
  <nav class="navbar navbar-expand-lg navbar-abc sticky-top">
    <div class="container">
      <a class="navbar-brand" href="${pathTo('index.html')}">
        ${logoSVG(40)}
        <span>
          <span class="brand-name d-block">ABC COLLEGE</span>
          <span class="brand-sub d-none d-sm-block">Event Management Portal</span>
        </span>
      </a>
      <button class="navbar-toggler border-0 text-white" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav">
        <i class="bi bi-list fs-2 text-white"></i>
      </button>
      <div class="collapse navbar-collapse" id="mainNav">
        <ul class="navbar-nav ms-auto align-items-lg-center">
          <li class="nav-item"><a class="nav-link ${active === 'home' ? 'active' : ''}" href="${pathTo('index.html')}">Home</a></li>
          <li class="nav-item"><a class="nav-link ${active === 'events' ? 'active' : ''}" href="${pathTo('events.html')}">Events</a></li>
          <li class="nav-item"><a class="nav-link ${active === 'about' ? 'active' : ''}" href="${pathTo('about.html')}">About</a></li>
          <li class="nav-item"><a class="nav-link ${active === 'contact' ? 'active' : ''}" href="${pathTo('contact.html')}">Contact</a></li>
          ${rightLinks}
        </ul>
      </div>
    </div>
  </nav>`;
}

/* ---------------- Footer ---------------- */
function renderFooter() {
  const el = document.getElementById("footer-placeholder");
  if (!el) return;
  el.innerHTML = `
  <footer class="footer-abc">
    <div class="container">
      <div class="row g-4">
        <div class="col-md-4">
          <div class="d-flex align-items-center gap-2 mb-2">${logoSVG(36)}<span class="h5 mb-0 text-white">ABC COLLEGE</span></div>
          <p class="small mb-0">Empowering Students &bull; Inspiring Innovation &bull; Building Tomorrow</p>
        </div>
        <div class="col-6 col-md-2">
          <h6>Explore</h6>
          <ul class="list-unstyled small">
            <li class="mb-2"><a href="${pathTo('index.html')}">Home</a></li>
            <li class="mb-2"><a href="${pathTo('events.html')}">Events</a></li>
            <li class="mb-2"><a href="${pathTo('about.html')}">About</a></li>
          </ul>
        </div>
        <div class="col-6 col-md-2">
          <h6>Account</h6>
          <ul class="list-unstyled small">
            <li class="mb-2"><a href="${pathTo('login.html')}">Login</a></li>
            <li class="mb-2"><a href="${pathTo('register.html')}">Register</a></li>
            <li class="mb-2"><a href="${pathTo('contact.html')}">Contact</a></li>
          </ul>
        </div>
        <div class="col-md-4">
          <h6>Reach Us</h6>
          <p class="small mb-1"><i class="bi bi-geo-alt me-2"></i>123 College Road, Knowledge City</p>
          <p class="small mb-1"><i class="bi bi-envelope me-2"></i>info@abccollege.edu</p>
          <p class="small mb-0"><i class="bi bi-telephone me-2"></i>+91 98765 43210</p>
        </div>
      </div>
      <div class="footer-bottom text-center">
        &copy; ${new Date().getFullYear()} ABC College. All rights reserved. This is a fictional college created for a student mini-project.
      </div>
    </div>
  </footer>`;
}

document.addEventListener("DOMContentLoaded", () => {
  renderNavbar(document.body.dataset.page || "");
  renderFooter();
  const authLogo = document.getElementById("authLogo");
  if (authLogo) authLogo.innerHTML = logoSVG(64);
});
