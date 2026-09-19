// auth.js — handles Login and Register form logic
// Talks ONLY to the Flask backend via /api (never touches MySQL directly)

const API_BASE = "/api";

function showError(msg) {
  const el = document.getElementById("errorMsg");
  const success = document.getElementById("successMsg");
  if (success) success.style.display = "none";
  if (el) {
    el.textContent = msg;
    el.style.display = "block";
  }
}

function showSuccess(msg) {
  const el = document.getElementById("successMsg");
  const error = document.getElementById("errorMsg");
  if (error) error.style.display = "none";
  if (el) {
    el.textContent = msg;
    el.style.display = "block";
  }
}

// ---------- LOGIN ----------
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  const togglePassword = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("password");

  if (togglePassword) {
    togglePassword.addEventListener("click", () => {
      const type = passwordInput.type === "password" ? "text" : "password";
      passwordInput.type = type;
    });
  }

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const loginBtn = document.getElementById("loginBtn");
    const loginBtnText = document.getElementById("loginBtnText");

    loginBtn.disabled = true;
    loginBtnText.textContent = "Logging in...";

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        showError(data.error || "Invalid email or password.");
        loginBtn.disabled = false;
        loginBtnText.textContent = "LOGIN";
        return;
      }

      // Store JWT + user info for the dashboard to use
      localStorage.setItem("clouddesk_token", data.token);
      localStorage.setItem("clouddesk_user", JSON.stringify(data.user));

      showSuccess("Login successful! Redirecting...");
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 800);
    } catch (err) {
      showError("Unable to reach the server. Please try again.");
      loginBtn.disabled = false;
      loginBtnText.textContent = "LOGIN";
    }
  });
}

// ---------- REGISTER ----------
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const registerBtn = document.getElementById("registerBtn");
    const registerBtnText = document.getElementById("registerBtnText");

    if (password !== confirmPassword) {
      showError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      showError("Password must be at least 6 characters.");
      return;
    }

    registerBtn.disabled = true;
    registerBtnText.textContent = "Creating account...";

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        showError(data.error || "Registration failed.");
        registerBtn.disabled = false;
        registerBtnText.textContent = "CREATE ACCOUNT";
        return;
      }

      showSuccess("Account created successfully. Redirecting to login...");
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1200);
    } catch (err) {
      showError("Unable to reach the server. Please try again.");
      registerBtn.disabled = false;
      registerBtnText.textContent = "CREATE ACCOUNT";
    }
  });
}
