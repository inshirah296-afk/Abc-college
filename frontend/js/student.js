/* Powers student/dashboard.html, my-events.html, profile.html, feedback.html, event-registration.html */

function renderStudentSidebar(active) {
  const el = document.getElementById("sidebar-placeholder");
  if (!el) return;
  const user = requireAuth("student");
  if (!user) return;

  const links = [
    { key: "dashboard", href: "dashboard.html", icon: "bi-speedometer2", label: "Dashboard" },
    { key: "browse", href: "event-registration.html", icon: "bi-calendar-plus", label: "Browse & Register" },
    { key: "my-events", href: "my-events.html", icon: "bi-calendar-check", label: "My Events" },
    { key: "feedback", href: "feedback.html", icon: "bi-chat-square-text", label: "Feedback" },
    { key: "profile", href: "profile.html", icon: "bi-person-circle", label: "My Profile" },
  ];

  el.innerHTML = `
    <div class="sidebar-abc text-white p-3 h-100">
      <div class="d-flex align-items-center gap-2 mb-4 px-1">
        ${logoSVG(36)}
        <div>
          <div class="fw-bold small">ABC COLLEGE</div>
          <div class="small" style="color:var(--beige)">Student Portal</div>
        </div>
      </div>
      <nav class="nav flex-column">
        ${links
          .map(
            (l) => `<a class="nav-link ${active === l.key ? "active" : ""}" href="${l.href}"><i class="bi ${l.icon} me-2"></i>${l.label}</a>`
          )
          .join("")}
        <a class="nav-link mt-4" href="#" onclick="logout(); return false;"><i class="bi bi-box-arrow-right me-2"></i>Logout</a>
        <a class="nav-link" href="../index.html"><i class="bi bi-house me-2"></i>Back to Website</a>
      </nav>
    </div>`;

  const welcomeName = document.getElementById("studentWelcomeName");
  if (welcomeName) welcomeName.textContent = user.name.split(" ")[0];
}

/* ---------------- Dashboard ---------------- */
async function loadStudentDashboard() {
  const el = document.getElementById("dashStatRegistered");
  if (!el) return;

  try {
    const [{ registrations }, { announcements }] = await Promise.all([
      apiFetch("/registrations/my"),
      apiFetch("/announcements"),
    ]);

    const active = registrations.filter((r) => r.status !== "Cancelled");
    const now = new Date();
    const upcoming = active.filter((r) => r.event && new Date(r.event.date) >= now);
    const completed = active.filter((r) => r.event && r.event.status === "Completed");

    setStat("dashStatRegistered", active.length);
    setStat("dashStatUpcoming", upcoming.length);
    setStat("dashStatCompleted", completed.length);

    const recentEl = document.getElementById("dashRecentRegistrations");
    if (recentEl) {
      const recent = active.slice(0, 5);
      recentEl.innerHTML = recent.length
        ? `<div class="table-responsive"><table class="table align-middle mb-0">
            <thead><tr><th>Event</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>${recent
              .map(
                (r) => `<tr>
                  <td>${r.event ? r.event.title : "(event removed)"}</td>
                  <td>${r.event ? formatDate(r.event.date) : "—"}</td>
                  <td><span class="status-badge ${statusClass(r.event ? r.event.status : "Cancelled")}">${r.status}</span></td>
                </tr>`
              )
              .join("")}</tbody></table></div>`
        : `<div class="empty-state"><i class="bi bi-calendar-x d-block mb-2"></i>No registrations yet. <a href="event-registration.html">Browse events</a> to get started.</div>`;
    }

    const remindersEl = document.getElementById("dashReminders");
    if (remindersEl) {
      const soon = upcoming
        .slice()
        .sort((a, b) => new Date(a.event.date) - new Date(b.event.date))
        .slice(0, 3);
      remindersEl.innerHTML = soon.length
        ? soon.map((r) => `<li class="list-group-item d-flex justify-content-between"><span>${r.event.title}</span><span class="text-muted small">${formatDate(r.event.date)}</span></li>`).join("")
        : `<li class="list-group-item text-muted small">No upcoming events on your calendar.</li>`;
    }

    const annEl = document.getElementById("dashAnnouncements");
    if (annEl) {
      annEl.innerHTML = announcements.slice(0, 4).map(announcementHTML).join("") || `<p class="text-muted small">No announcements.</p>`;
    }
  } catch (err) {
    showToast(err.message, "error");
  }
}

/* ---------------- My Events ---------------- */
async function loadMyEvents() {
  const el = document.getElementById("myEventsTableBody");
  if (!el) return;

  try {
    const { registrations } = await apiFetch("/registrations/my");
    el.innerHTML = registrations.length
      ? registrations
          .map((r) => {
            const ev = r.event;
            if (!ev) return "";
            const canCancel = r.status !== "Cancelled" && new Date() < new Date(ev.registrationDeadline) && ev.status !== "Completed";
            return `
            <tr>
              <td>
                <div class="fw-semibold">${ev.title}</div>
                <div class="small text-muted">${ev.category}</div>
              </td>
              <td>${formatDate(ev.date)}</td>
              <td><span class="status-badge ${statusClass(ev.status)}">${ev.status}</span></td>
              <td><span class="badge ${r.status === "Cancelled" ? "bg-secondary" : "bg-purple"}">${r.status}</span></td>
              <td class="text-end">
                <a href="../event-details.html?id=${ev._id}" class="btn btn-sm btn-outline-navy me-1">View</a>
                ${canCancel ? `<button class="btn btn-sm btn-outline-danger" onclick="cancelMyRegistration('${r._id}')">Cancel</button>` : ""}
              </td>
            </tr>`;
          })
          .join("")
      : `<tr><td colspan="5"><div class="empty-state"><i class="bi bi-calendar-x d-block mb-2"></i>You haven't registered for any events yet.</div></td></tr>`;
  } catch (err) {
    el.innerHTML = `<tr><td colspan="5">${err.message}</td></tr>`;
  }
}

async function cancelMyRegistration(id) {
  if (!confirm("Cancel this registration?")) return;
  try {
    await apiFetch(`/registrations/${id}`, { method: "DELETE" });
    showToast("Registration cancelled.");
    loadMyEvents();
  } catch (err) {
    showToast(err.message, "error");
  }
}

/* ---------------- Profile ---------------- */
async function loadProfile() {
  const form = document.getElementById("profileForm");
  if (!form) return;
  const user = getUser();
  document.getElementById("profileName").value = user.name || "";
  document.getElementById("profileEmail").value = user.email || "";
  document.getElementById("profileStudentId").value = user.studentId || "";
  document.getElementById("profileDepartment").value = user.department || "";
  document.getElementById("profileYear").value = user.year || "";
  document.getElementById("profilePhone").value = user.phone || "";
  const img = document.getElementById("profileImagePreview");
  if (img) img.src = user.profileImage ? imageUrl(user.profileImage) : "https://placehold.co/120x120/E8DCC4/172A46?text=" + (user.name ? user.name[0] : "S");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("profileSaveBtn");
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Saving...`;

    const fileInput = document.getElementById("profileImageInput");
    let body, headers;
    if (fileInput && fileInput.files.length) {
      const fd = new FormData();
      fd.append("name", document.getElementById("profileName").value);
      fd.append("department", document.getElementById("profileDepartment").value);
      fd.append("year", document.getElementById("profileYear").value);
      fd.append("phone", document.getElementById("profilePhone").value);
      fd.append("profileImage", fileInput.files[0]);
      body = fd;
    } else {
      body = JSON.stringify({
        name: document.getElementById("profileName").value,
        department: document.getElementById("profileDepartment").value,
        year: document.getElementById("profileYear").value,
        phone: document.getElementById("profilePhone").value,
      });
    }

    try {
      const data = await apiFetch("/users/profile", { method: "PUT", body });
      localStorage.setItem("abc_user", JSON.stringify(data.user));
      showToast("Profile updated successfully.");
      renderStudentSidebar("profile");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      btn.disabled = false;
      btn.innerHTML = "Save Changes";
    }
  });

  const pwForm = document.getElementById("passwordForm");
  if (pwForm) {
    pwForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const currentPassword = document.getElementById("currentPassword").value;
      const newPassword = document.getElementById("newPassword").value;
      try {
        await apiFetch("/users/password", { method: "PUT", body: JSON.stringify({ currentPassword, newPassword }) });
        showToast("Password changed successfully.");
        pwForm.reset();
      } catch (err) {
        showToast(err.message, "error");
      }
    });
  }
}

/* ---------------- Feedback ---------------- */
async function loadFeedbackPage() {
  const el = document.getElementById("feedbackEventsList");
  if (!el) return;

  try {
    const { registrations } = await apiFetch("/registrations/my");
    const eligible = registrations.filter((r) => r.event && r.event.status === "Completed" && r.status !== "Cancelled");

    el.innerHTML = eligible.length
      ? eligible
          .map(
            (r) => `
        <div class="card-abc p-3 mb-3" id="fb-card-${r.event._id}">
          <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <h6 class="mb-1">${r.event.title}</h6>
              <span class="small text-muted">${formatDate(r.event.date)} • ${r.event.category}</span>
            </div>
            <button class="btn btn-brand-primary btn-sm" onclick="openFeedbackForm('${r.event._id}', '${r.event.title.replace(/'/g, "\\'")}')">Give Feedback</button>
          </div>
          <div id="fb-form-${r.event._id}" class="mt-3"></div>
        </div>`
          )
          .join("")
      : `<div class="empty-state"><i class="bi bi-chat-square-text d-block mb-2"></i>No completed events awaiting feedback yet.</div>`;
  } catch (err) {
    el.innerHTML = err.message;
  }
}

function openFeedbackForm(eventId, title) {
  const box = document.getElementById(`fb-form-${eventId}`);
  if (box.dataset.open === "true") { box.innerHTML = ""; box.dataset.open = "false"; return; }
  box.dataset.open = "true";
  box.innerHTML = `
    <form onsubmit="submitFeedbackForm(event, '${eventId}')" class="border-top pt-3">
      <div class="mb-2">
        <label class="form-label">Rating</label>
        <select class="form-select" id="rating-${eventId}" required>
          <option value="">Select rating</option>
          <option value="5">5 - Excellent</option>
          <option value="4">4 - Good</option>
          <option value="3">3 - Average</option>
          <option value="2">2 - Below Average</option>
          <option value="1">1 - Poor</option>
        </select>
      </div>
      <div class="mb-2">
        <label class="form-label">Comments</label>
        <textarea class="form-control" id="comment-${eventId}" rows="2" placeholder="What did you think of ${title}?"></textarea>
      </div>
      <div class="mb-3">
        <label class="form-label">Suggestions</label>
        <textarea class="form-control" id="suggestions-${eventId}" rows="2" placeholder="Anything we could improve?"></textarea>
      </div>
      <button type="submit" class="btn btn-maroon btn-sm">Submit Feedback</button>
    </form>`;
}

async function submitFeedbackForm(e, eventId) {
  e.preventDefault();
  const rating = document.getElementById(`rating-${eventId}`).value;
  const comment = document.getElementById(`comment-${eventId}`).value;
  const suggestions = document.getElementById(`suggestions-${eventId}`).value;
  try {
    await apiFetch("/feedback", { method: "POST", body: JSON.stringify({ event: eventId, rating: Number(rating), comment, suggestions }) });
    showToast("Thank you for your feedback!");
    document.getElementById(`fb-card-${eventId}`).innerHTML = `<div class="text-success"><i class="bi bi-check-circle me-2"></i>Feedback submitted. Thank you!</div>`;
  } catch (err) {
    showToast(err.message, "error");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.studentPage;
  if (!page) return;
  renderStudentSidebar(page);
  if (page === "dashboard") loadStudentDashboard();
  if (page === "my-events") loadMyEvents();
  if (page === "profile") loadProfile();
  if (page === "feedback") loadFeedbackPage();
});
