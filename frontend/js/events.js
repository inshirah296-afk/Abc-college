/* Powers index.html, events.html and event-details.html */

function eventCardHTML(ev) {
  const seatsLeft = ev.seatsAvailable ?? (ev.maxParticipants - (ev.registeredCount || 0));
  return `
  <div class="col-md-6 col-lg-4">
    <div class="card-abc h-100 d-flex flex-column">
      <img src="${imageUrl(ev.image)}" class="event-card-img" alt="${ev.title}">
      <div class="p-3 d-flex flex-column flex-grow-1">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <span class="card-category-badge">${ev.category}</span>
          <span class="status-badge ${statusClass(ev.status)}">${ev.status}</span>
        </div>
        <h5 class="mb-1">${ev.title}</h5>
        <p class="small text-muted mb-2"><i class="bi bi-calendar3 me-1"></i>${formatDate(ev.date)} &nbsp;•&nbsp; <i class="bi bi-geo-alt me-1"></i>${ev.venue}</p>
        <p class="small mb-3 flex-grow-1">${(ev.description || "").slice(0, 90)}${ev.description && ev.description.length > 90 ? "…" : ""}</p>
        <div class="d-flex justify-content-between align-items-center mt-auto pt-2 border-top">
          <span class="small text-muted"><i class="bi bi-people me-1"></i>${seatsLeft > 0 ? seatsLeft + " seats left" : "Full"}</span>
          <a href="${pathTo('event-details.html')}?id=${ev._id}" class="btn btn-outline-navy btn-sm">Details</a>
        </div>
      </div>
    </div>
  </div>`;
}

function announcementHTML(a) {
  const cls = a.priority.toLowerCase();
  return `
  <div class="announcement-item priority-${cls}">
    <div class="d-flex justify-content-between">
      <strong>${a.title}</strong>
      <span class="badge ${cls === 'urgent' ? 'bg-maroon' : cls === 'important' ? 'bg-purple' : 'bg-secondary'}">${a.priority}</span>
    </div>
    <p class="small mb-1 mt-1">${a.description}</p>
    <span class="small text-muted">${formatDate(a.createdAt)}</span>
  </div>`;
}

/* ---------------- Homepage ---------------- */
async function loadHomepage() {
  const featuredEl = document.getElementById("featuredEvents");
  if (!featuredEl) return;

  try {
    const [openRes, upcomingRes, announcementsRes, categoriesRes] = await Promise.all([
      apiFetch("/events?status=Registration Open&limit=3&sort=dateAsc"),
      apiFetch("/events?limit=3&sort=dateAsc"),
      apiFetch("/announcements"),
      apiFetch("/categories"),
    ]);

    featuredEl.innerHTML = openRes.events.length
      ? openRes.events.map(eventCardHTML).join("")
      : `<div class="col-12"><div class="empty-state"><i class="bi bi-calendar-x d-block mb-2"></i>No events open for registration right now. Check back soon!</div></div>`;

    const upcomingEl = document.getElementById("upcomingEvents");
    if (upcomingEl) {
      upcomingEl.innerHTML = upcomingRes.events.length
        ? upcomingRes.events.map(eventCardHTML).join("")
        : `<div class="col-12"><div class="empty-state"><i class="bi bi-calendar3 d-block mb-2"></i>No upcoming events scheduled yet.</div></div>`;
    }

    const announcementsEl = document.getElementById("homeAnnouncements");
    if (announcementsEl) {
      const top = announcementsRes.announcements.slice(0, 4);
      announcementsEl.innerHTML = top.length
        ? top.map(announcementHTML).join("")
        : `<p class="text-muted small">No announcements at the moment.</p>`;
    }

    const catEl = document.getElementById("categoryList");
    if (catEl) {
      const cats = categoriesRes.categories.length ? categoriesRes.categories : EVENT_CATEGORIES_FALLBACK.map((name) => ({ name }));
      catEl.innerHTML = cats
        .map(
          (c) => `<a href="events.html?category=${encodeURIComponent(c.name)}" class="badge bg-beige text-navy text-decoration-none px-3 py-2">${c.name}</a>`
        )
        .join(" ");
    }

    // Public homepage stats
    try {
      const st = await apiFetch("/stats");
      setStat("statTotalEvents", st.totalEvents);
      setStat("statUpcoming", st.upcomingEvents);
      setStat("statCompleted", st.completedEvents);
      setStat("statStudents", st.totalStudents);
    } catch (e) { /* stats are decorative */ }
  } catch (err) {
    featuredEl.innerHTML = `<div class="col-12"><div class="empty-state"><i class="bi bi-wifi-off d-block mb-2"></i>Couldn't load events. Is the backend server running?</div></div>`;
  }
}
function setStat(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

/* ---------------- Events listing page ---------------- */
let currentPage = 1;
async function loadEventsList(page = 1) {
  const grid = document.getElementById("eventsGrid");
  if (!grid) return;
  currentPage = page;

  const search = document.getElementById("searchInput")?.value.trim() || "";
  const category = document.getElementById("categoryFilter")?.value || "";
  const status = document.getElementById("statusFilter")?.value || "";
  const date = document.getElementById("dateFilter")?.value || "";
  const sort = document.getElementById("sortSelect")?.value || "dateAsc";

  grid.innerHTML = `<div class="col-12 loading-spinner-wrap"><div class="spinner-border text-purple"></div></div>`;

  const params = new URLSearchParams({ page, limit: 9, sort });
  if (search) params.set("search", search);
  if (category) params.set("category", category);
  if (status) params.set("status", status);
  if (date) params.set("date", date);

  try {
    const data = await apiFetch(`/events?${params.toString()}`);
    grid.innerHTML = data.events.length
      ? data.events.map(eventCardHTML).join("")
      : `<div class="col-12"><div class="empty-state"><i class="bi bi-search d-block mb-2"></i>No events match your filters. Try broadening your search.</div></div>`;
    renderPagination(data.page, data.pages);
  } catch (err) {
    grid.innerHTML = `<div class="col-12"><div class="empty-state"><i class="bi bi-wifi-off d-block mb-2"></i>${err.message}</div></div>`;
  }
}

function renderPagination(page, pages) {
  const el = document.getElementById("paginationWrap");
  if (!el) return;
  if (pages <= 1) { el.innerHTML = ""; return; }
  let html = `<nav><ul class="pagination justify-content-center">`;
  for (let i = 1; i <= pages; i++) {
    html += `<li class="page-item ${i === page ? "active" : ""}"><a class="page-link" href="#" onclick="loadEventsList(${i}); return false;">${i}</a></li>`;
  }
  html += `</ul></nav>`;
  el.innerHTML = html;
}

async function populateCategoryFilter() {
  const select = document.getElementById("categoryFilter");
  if (!select) return;
  let cats = EVENT_CATEGORIES_FALLBACK;
  try {
    const data = await apiFetch("/categories");
    if (data.categories.length) cats = data.categories.map((c) => c.name);
  } catch (e) { /* use fallback */ }
  select.innerHTML = `<option value="">All Categories</option>` + cats.map((c) => `<option value="${c}">${c}</option>`).join("");

  // Pre-select category from URL query string, if present
  const urlParams = new URLSearchParams(window.location.search);
  const cat = urlParams.get("category");
  if (cat) select.value = cat;
}

function initEventsPage() {
  const grid = document.getElementById("eventsGrid");
  if (!grid) return;
  populateCategoryFilter().then(() => loadEventsList(1));

  ["searchInput", "categoryFilter", "statusFilter", "dateFilter", "sortSelect"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const evt = id === "searchInput" ? "input" : "change";
    let debounce;
    el.addEventListener(evt, () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => loadEventsList(1), 350);
    });
  });
}

/* ---------------- Event details page ---------------- */
async function loadEventDetails() {
  const container = document.getElementById("eventDetailsContainer");
  if (!container) return;

  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) {
    container.innerHTML = `<div class="empty-state"><i class="bi bi-exclamation-triangle d-block mb-2"></i>No event specified.</div>`;
    return;
  }

  try {
    const { event: ev } = await apiFetch(`/events/${id}`);
    document.title = `${ev.title} — ABC College`;

    const deadlinePassed = new Date() > new Date(ev.registrationDeadline);
    const isFull = ev.seatsAvailable <= 0;
    const closedStatus = ["Registration Closed", "Completed", "Cancelled"].includes(ev.status);

    let actionHTML = "";
    const user = getUser();
    if (!isLoggedIn()) {
      actionHTML = `<a href="login.html" class="btn btn-brand-primary btn-lg w-100"><i class="bi bi-box-arrow-in-right me-2"></i>Login to Register</a>`;
    } else if (user.role === "admin") {
      actionHTML = `<div class="alert alert-secondary mb-0">Admin accounts cannot register for events.</div>`;
    } else if (ev.alreadyRegistered) {
      actionHTML = `<div class="alert alert-success mb-0"><i class="bi bi-check-circle me-2"></i>You are already registered for this event.</div>`;
    } else if (closedStatus) {
      actionHTML = `<div class="alert alert-secondary mb-0">Registration is ${ev.status.toLowerCase()}.</div>`;
    } else if (deadlinePassed) {
      actionHTML = `<div class="alert alert-secondary mb-0">The registration deadline has passed.</div>`;
    } else if (isFull) {
      actionHTML = `<div class="alert alert-secondary mb-0">This event has reached full capacity.</div>`;
    } else {
      actionHTML = `<button id="registerBtn" class="btn btn-maroon btn-lg w-100"><i class="bi bi-pencil-square me-2"></i>REGISTER NOW</button>`;
    }

    container.innerHTML = `
      <div class="row g-4">
        <div class="col-lg-7">
          <img src="${imageUrl(ev.image)}" class="img-fluid rounded shadow-sm mb-3 w-100" style="max-height:380px;object-fit:cover;" alt="${ev.title}">
          <div class="d-flex gap-2 mb-3">
            <span class="card-category-badge">${ev.category}</span>
            <span class="status-badge ${statusClass(ev.status)}">${ev.status}</span>
          </div>
          <h2>${ev.title}</h2>
          <p>${ev.description}</p>
          ${ev.rules ? `<h6 class="mt-4">Event Rules</h6><p class="small">${ev.rules}</p>` : ""}
          ${ev.contact ? `<h6 class="mt-4">Contact</h6><p class="small">${ev.contact}</p>` : ""}
        </div>
        <div class="col-lg-5">
          <div class="card-abc p-4">
            <ul class="list-unstyled small mb-4">
              <li class="mb-3"><i class="bi bi-calendar3 me-2 text-purple"></i><strong>Date:</strong> ${formatDate(ev.date)}</li>
              <li class="mb-3"><i class="bi bi-clock me-2 text-purple"></i><strong>Time:</strong> ${formatTime(ev.startTime)} – ${formatTime(ev.endTime)}</li>
              <li class="mb-3"><i class="bi bi-geo-alt me-2 text-purple"></i><strong>Venue:</strong> ${ev.venue}</li>
              <li class="mb-3"><i class="bi bi-person-badge me-2 text-purple"></i><strong>Organizer:</strong> ${ev.organizer}</li>
              <li class="mb-3"><i class="bi bi-people me-2 text-purple"></i><strong>Seats Available:</strong> ${Math.max(ev.seatsAvailable, 0)} / ${ev.maxParticipants}</li>
              <li class="mb-0"><i class="bi bi-hourglass-split me-2 text-purple"></i><strong>Registration Deadline:</strong> ${formatDate(ev.registrationDeadline)}</li>
            </ul>
            ${actionHTML}
          </div>
        </div>
      </div>`;

    const regBtn = document.getElementById("registerBtn");
    if (regBtn) {
      regBtn.addEventListener("click", async () => {
        regBtn.disabled = true;
        regBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Registering...`;
        try {
          await apiFetch(`/events/${id}/register`, { method: "POST" });
          showToast("You're registered! See you at the event.");
          loadEventDetails();
        } catch (err) {
          showToast(err.message, "error");
          regBtn.disabled = false;
          regBtn.innerHTML = `<i class="bi bi-pencil-square me-2"></i>REGISTER NOW`;
        }
      });
    }
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><i class="bi bi-exclamation-triangle d-block mb-2"></i>${err.message}</div>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadHomepage();
  initEventsPage();
  loadEventDetails();
});
