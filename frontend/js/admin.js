/* Powers admin/dashboard.html, events.html, students.html,
   registrations.html, announcements.html, reports.html */

function renderAdminSidebar(active) {
  const el = document.getElementById("sidebar-placeholder");
  if (!el) return;
  const user = requireAuth("admin");
  if (!user) return;

  const links = [
    { key: "dashboard", href: "dashboard.html", icon: "bi-speedometer2", label: "Dashboard" },
    { key: "events", href: "events.html", icon: "bi-calendar-event", label: "Manage Events" },
    { key: "students", href: "students.html", icon: "bi-people", label: "Manage Students" },
    { key: "registrations", href: "registrations.html", icon: "bi-clipboard-check", label: "Registrations" },
    { key: "announcements", href: "announcements.html", icon: "bi-megaphone", label: "Announcements" },
    { key: "reports", href: "reports.html", icon: "bi-bar-chart", label: "Reports" },
  ];

  el.innerHTML = `
    <div class="sidebar-abc text-white p-3 h-100">
      <div class="d-flex align-items-center gap-2 mb-4 px-1">
        ${logoSVG(36)}
        <div>
          <div class="fw-bold small">ABC COLLEGE</div>
          <div class="small" style="color:var(--beige)">Admin Portal</div>
        </div>
      </div>
      <nav class="nav flex-column">
        ${links
          .map((l) => `<a class="nav-link ${active === l.key ? "active" : ""}" href="${l.href}"><i class="bi ${l.icon} me-2"></i>${l.label}</a>`)
          .join("")}
        <a class="nav-link mt-4" href="#" onclick="logout(); return false;"><i class="bi bi-box-arrow-right me-2"></i>Logout</a>
        <a class="nav-link" href="../index.html"><i class="bi bi-house me-2"></i>Back to Website</a>
      </nav>
    </div>`;
}

/* ---------------- Dashboard ---------------- */
async function loadAdminDashboard() {
  const el = document.getElementById("adminStatStudents");
  if (!el) return;
  try {
    const stats = await apiFetch("/admin/dashboard-stats");
    setStat("adminStatStudents", stats.totalStudents);
    setStat("adminStatEvents", stats.totalEvents);
    setStat("adminStatUpcoming", stats.upcomingEvents);
    setStat("adminStatRegistrations", stats.totalRegistrations);
    setStat("adminStatCompleted", stats.completedEvents);

    const recentEl = document.getElementById("adminRecentRegistrations");
    if (recentEl) {
      recentEl.innerHTML = stats.recentRegistrations.length
        ? `<div class="table-responsive"><table class="table align-middle mb-0">
            <thead><tr><th>Student</th><th>Event</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>${stats.recentRegistrations
              .map(
                (r) => `<tr>
                <td>${r.student ? r.student.name : "—"}</td>
                <td>${r.event ? r.event.title : "—"}</td>
                <td>${formatDate(r.createdAt)}</td>
                <td><span class="badge bg-purple">${r.status}</span></td>
              </tr>`
              )
              .join("")}</tbody></table></div>`
        : `<div class="empty-state"><i class="bi bi-inbox d-block mb-2"></i>No registrations yet.</div>`;
    }

    if (window.Chart) {
      const catCtx = document.getElementById("chartByCategory");
      if (catCtx) {
        new Chart(catCtx, {
          type: "bar",
          data: {
            labels: stats.registrationsByCategory.map((c) => c._id),
            datasets: [{ label: "Registrations", data: stats.registrationsByCategory.map((c) => c.count), backgroundColor: "#6A3D8F" }],
          },
          options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } },
        });
      }
      const monthCtx = document.getElementById("chartMonthly");
      if (monthCtx) {
        new Chart(monthCtx, {
          type: "line",
          data: {
            labels: stats.monthlyRegistrations.map((m) => m._id),
            datasets: [{ label: "Registrations", data: stats.monthlyRegistrations.map((m) => m.count), borderColor: "#800020", backgroundColor: "rgba(128,0,32,0.1)", fill: true, tension: 0.3 }],
          },
          options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } },
        });
      }
    }
  } catch (err) {
    showToast(err.message, "error");
  }
}

/* ---------------- Manage Events ---------------- */
let editingEventId = null;

async function loadCategoryOptions(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;
  let cats = EVENT_CATEGORIES_FALLBACK;
  try {
    const data = await apiFetch("/categories");
    if (data.categories.length) cats = data.categories.map((c) => c.name);
  } catch (e) {}
  select.innerHTML = `<option value="">Select category</option>` + cats.map((c) => `<option value="${c}">${c}</option>`).join("");
}

async function loadAdminEvents() {
  const tbody = document.getElementById("eventsTableBody");
  if (!tbody) return;
  try {
    const { events } = await apiFetch("/events?limit=200&sort=dateDesc");
    tbody.innerHTML = events.length
      ? events
          .map(
            (ev) => `
        <tr>
          <td>${ev.title}</td>
          <td>${ev.category}</td>
          <td>${formatDate(ev.date)}</td>
          <td>${ev.registeredCount}/${ev.maxParticipants}</td>
          <td><span class="status-badge ${statusClass(ev.status)}">${ev.status}</span></td>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-navy me-1" onclick="openEventModal('${ev._id}')"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteEvent('${ev._id}', '${ev.title.replace(/'/g, "\\'")}')"><i class="bi bi-trash"></i></button>
          </td>
        </tr>`
          )
          .join("")
      : `<tr><td colspan="6"><div class="empty-state"><i class="bi bi-calendar-x d-block mb-2"></i>No events yet. Create your first event.</div></td></tr>`;
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6">${err.message}</td></tr>`;
  }
}

async function openEventModal(id = null) {
  editingEventId = id;
  const form = document.getElementById("eventForm");
  form.reset();
  document.getElementById("eventModalTitle").textContent = id ? "Edit Event" : "Create Event";

  if (id) {
    const { event: ev } = await apiFetch(`/events/${id}`);
    document.getElementById("evTitle").value = ev.title;
    document.getElementById("evDescription").value = ev.description;
    document.getElementById("evCategory").value = ev.category;
    document.getElementById("evDate").value = ev.date.slice(0, 10);
    document.getElementById("evStartTime").value = ev.startTime;
    document.getElementById("evEndTime").value = ev.endTime;
    document.getElementById("evVenue").value = ev.venue;
    document.getElementById("evOrganizer").value = ev.organizer;
    document.getElementById("evMaxParticipants").value = ev.maxParticipants;
    document.getElementById("evDeadline").value = new Date(ev.registrationDeadline).toISOString().slice(0, 10);
    document.getElementById("evRules").value = ev.rules || "";
    document.getElementById("evContact").value = ev.contact || "";
    document.getElementById("evStatus").value = ev.status;
  }
  new bootstrap.Modal(document.getElementById("eventModal")).show();
}

async function saveEvent(e) {
  e.preventDefault();
  const fd = new FormData();
  fd.append("title", document.getElementById("evTitle").value);
  fd.append("description", document.getElementById("evDescription").value);
  fd.append("category", document.getElementById("evCategory").value);
  fd.append("date", document.getElementById("evDate").value);
  fd.append("startTime", document.getElementById("evStartTime").value);
  fd.append("endTime", document.getElementById("evEndTime").value);
  fd.append("venue", document.getElementById("evVenue").value);
  fd.append("organizer", document.getElementById("evOrganizer").value);
  fd.append("maxParticipants", document.getElementById("evMaxParticipants").value);
  fd.append("registrationDeadline", document.getElementById("evDeadline").value);
  fd.append("rules", document.getElementById("evRules").value);
  fd.append("contact", document.getElementById("evContact").value);
  fd.append("status", document.getElementById("evStatus").value || "Upcoming");
  const fileInput = document.getElementById("evImage");
  if (fileInput.files.length) fd.append("image", fileInput.files[0]);

  try {
    if (editingEventId) {
      await apiFetch(`/events/${editingEventId}`, { method: "PUT", body: fd });
      showToast("Event updated successfully.");
    } else {
      await apiFetch("/events", { method: "POST", body: fd });
      showToast("Event created successfully.");
    }
    bootstrap.Modal.getInstance(document.getElementById("eventModal")).hide();
    loadAdminEvents();
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function deleteEvent(id, title) {
  if (!confirm(`Delete "${title}"? This will also remove its registrations. This cannot be undone.`)) return;
  try {
    await apiFetch(`/events/${id}`, { method: "DELETE" });
    showToast("Event deleted.");
    loadAdminEvents();
  } catch (err) {
    showToast(err.message, "error");
  }
}

/* ---------------- Manage Students ---------------- */
async function loadAdminStudents() {
  const tbody = document.getElementById("studentsTableBody");
  if (!tbody) return;
  const search = document.getElementById("studentSearch")?.value.trim() || "";
  const params = new URLSearchParams();
  if (search) params.set("search", search);

  try {
    const { students } = await apiFetch(`/admin/students?${params.toString()}`);
    tbody.innerHTML = students.length
      ? students
          .map(
            (s) => `
        <tr>
          <td>${s.studentId}</td>
          <td>${s.name}</td>
          <td>${s.department}</td>
          <td>${s.year || "—"}</td>
          <td>${s.email}</td>
          <td>${s.phone || "—"}</td>
          <td class="text-end"><button class="btn btn-sm btn-outline-danger" onclick="deleteStudent('${s._id}', '${s.name.replace(/'/g, "\\'")}')"><i class="bi bi-trash"></i></button></td>
        </tr>`
          )
          .join("")
      : `<tr><td colspan="7"><div class="empty-state"><i class="bi bi-people d-block mb-2"></i>No students found.</div></td></tr>`;
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7">${err.message}</td></tr>`;
  }
}

async function deleteStudent(id, name) {
  if (!confirm(`Remove student "${name}"? This will also remove their registrations.`)) return;
  try {
    await apiFetch(`/admin/students/${id}`, { method: "DELETE" });
    showToast("Student removed.");
    loadAdminStudents();
  } catch (err) {
    showToast(err.message, "error");
  }
}

/* ---------------- Manage Registrations ---------------- */
async function loadAdminRegistrations() {
  const tbody = document.getElementById("registrationsTableBody");
  if (!tbody) return;
  const search = document.getElementById("regSearch")?.value.trim() || "";
  const status = document.getElementById("regStatusFilter")?.value || "";
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (status) params.set("status", status);

  try {
    const { registrations } = await apiFetch(`/admin/registrations?${params.toString()}`);
    tbody.innerHTML = registrations.length
      ? registrations
          .map(
            (r) => `
        <tr>
          <td>${r.student ? r.student.name : "—"}</td>
          <td>${r.event ? r.event.title : "—"}</td>
          <td>${r.student ? r.student.department : "—"}</td>
          <td>${r.student ? r.student.year || "—" : "—"}</td>
          <td>${formatDate(r.createdAt)}</td>
          <td><span class="badge bg-purple">${r.status}</span></td>
          <td class="text-end">
            <select class="form-select form-select-sm d-inline-block w-auto" onchange="updateRegStatus('${r._id}', this.value)">
              <option value="">Change status...</option>
              <option value="Approved">Approve</option>
              <option value="Rejected">Reject</option>
              <option value="Cancelled">Cancel</option>
            </select>
          </td>
        </tr>`
          )
          .join("")
      : `<tr><td colspan="7"><div class="empty-state"><i class="bi bi-clipboard-x d-block mb-2"></i>No registrations found.</div></td></tr>`;
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7">${err.message}</td></tr>`;
  }
}

async function updateRegStatus(id, status) {
  if (!status) return;
  try {
    await apiFetch(`/admin/registrations/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) });
    showToast(`Registration marked as ${status}.`);
    loadAdminRegistrations();
  } catch (err) {
    showToast(err.message, "error");
  }
}

/* ---------------- Manage Announcements ---------------- */
async function loadAdminAnnouncements() {
  const el = document.getElementById("announcementsList");
  if (!el) return;
  try {
    const { announcements } = await apiFetch("/announcements");
    el.innerHTML = announcements.length
      ? announcements
          .map(
            (a) => `
        <div class="announcement-item priority-${a.priority.toLowerCase()} d-flex justify-content-between align-items-start">
          <div>
            <div class="d-flex align-items-center gap-2">
              <strong>${a.title}</strong>
              <span class="badge ${a.priority === "Urgent" ? "bg-maroon" : a.priority === "Important" ? "bg-purple" : "bg-secondary"}">${a.priority}</span>
            </div>
            <p class="small mb-1 mt-1">${a.description}</p>
            <span class="small text-muted">${formatDate(a.createdAt)}</span>
          </div>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteAnnouncement('${a._id}')"><i class="bi bi-trash"></i></button>
        </div>`
          )
          .join("")
      : `<div class="empty-state"><i class="bi bi-megaphone d-block mb-2"></i>No announcements yet.</div>`;
  } catch (err) {
    el.innerHTML = err.message;
  }
}

async function createAnnouncement(e) {
  e.preventDefault();
  const title = document.getElementById("annTitle").value;
  const description = document.getElementById("annDescription").value;
  const priority = document.getElementById("annPriority").value;
  try {
    await apiFetch("/announcements", { method: "POST", body: JSON.stringify({ title, description, priority }) });
    showToast("Announcement posted.");
    document.getElementById("announcementForm").reset();
    loadAdminAnnouncements();
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function deleteAnnouncement(id) {
  if (!confirm("Delete this announcement?")) return;
  try {
    await apiFetch(`/announcements/${id}`, { method: "DELETE" });
    showToast("Announcement deleted.");
    loadAdminAnnouncements();
  } catch (err) {
    showToast(err.message, "error");
  }
}

/* ---------------- Reports ---------------- */
async function loadReports() {
  const tbody = document.getElementById("reportsTableBody");
  if (!tbody) return;
  try {
    const { report } = await apiFetch("/admin/reports");
    tbody.innerHTML = report.length
      ? report
          .map(
            (r) => `
        <tr>
          <td>${r.title}</td>
          <td>${r.category}</td>
          <td>${formatDate(r.date)}</td>
          <td><span class="status-badge ${statusClass(r.status)}">${r.status}</span></td>
          <td>${r.registeredCount}/${r.maxParticipants}</td>
          <td>${r.feedbackCount}</td>
          <td>${r.averageRating ? "⭐ " + r.averageRating : "—"}</td>
        </tr>`
          )
          .join("")
      : `<tr><td colspan="7"><div class="empty-state">No event data yet.</div></td></tr>`;
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7">${err.message}</td></tr>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.adminPage;
  if (!page) return;
  renderAdminSidebar(page);

  if (page === "dashboard") loadAdminDashboard();
  if (page === "events") {
    loadAdminEvents();
    loadCategoryOptions("evCategory");
    document.getElementById("eventForm")?.addEventListener("submit", saveEvent);
    document.getElementById("addEventBtn")?.addEventListener("click", () => openEventModal(null));
  }
  if (page === "students") {
    loadAdminStudents();
    document.getElementById("studentSearch")?.addEventListener("input", () => loadAdminStudents());
  }
  if (page === "registrations") {
    loadAdminRegistrations();
    document.getElementById("regSearch")?.addEventListener("input", () => loadAdminRegistrations());
    document.getElementById("regStatusFilter")?.addEventListener("change", () => loadAdminRegistrations());
  }
  if (page === "announcements") {
    loadAdminAnnouncements();
    document.getElementById("announcementForm")?.addEventListener("submit", createAnnouncement);
  }
  if (page === "reports") loadReports();
});
