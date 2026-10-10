/* Handles the login and registration forms. Included only on login.html / register.html */

function initLoginForm() {
  const form = document.getElementById("loginForm");
  if (!form) return;

  // If already logged in, skip straight to the right dashboard.
  const user = getUser();
  if (isLoggedIn() && user) {
    window.location.href = user.role === "admin" ? "admin/dashboard.html" : "student/dashboard.html";
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const btn = document.getElementById("loginBtn");
    const errorBox = document.getElementById("loginError");
    errorBox.classList.add("d-none");

    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Logging in...`;

    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setAuth(data.token, data.user);
      showToast(`Welcome back, ${data.user.name}!`);
      setTimeout(() => {
        window.location.href = data.user.role === "admin" ? "admin/dashboard.html" : "student/dashboard.html";
      }, 500);
    } catch (err) {
      errorBox.textContent = err.message;
      errorBox.classList.remove("d-none");
      btn.disabled = false;
      btn.innerHTML = "Login";
    }
  });
}

function initRegisterForm() {
  const form = document.getElementById("registerForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("registerBtn");
    const errorBox = document.getElementById("registerError");
    errorBox.classList.add("d-none");

    const payload = {
      name: document.getElementById("name").value.trim(),
      email: document.getElementById("email").value.trim(),
      password: document.getElementById("password").value,
      studentId: document.getElementById("studentId").value.trim(),
      department: document.getElementById("department").value,
      year: document.getElementById("year").value,
      phone: document.getElementById("phone").value.trim(),
    };

    const confirmPassword = document.getElementById("confirmPassword").value;
    if (payload.password !== confirmPassword) {
      errorBox.textContent = "Passwords do not match.";
      errorBox.classList.remove("d-none");
      return;
    }

    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Creating account...`;

    try {
      const data = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setAuth(data.token, data.user);
      showToast("Account created successfully! Welcome to ABC College.");
      setTimeout(() => (window.location.href = "student/dashboard.html"), 500);
    } catch (err) {
      errorBox.textContent = err.message;
      errorBox.classList.remove("d-none");
      btn.disabled = false;
      btn.innerHTML = "Create Account";
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initLoginForm();
  initRegisterForm();
});
