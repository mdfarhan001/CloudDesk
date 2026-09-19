// script.js — Dashboard logic. Talks to Flask via /api using the JWT token.

const API_BASE = "/api";
const token = localStorage.getItem("clouddesk_token");
const userStr = localStorage.getItem("clouddesk_user");

// ---------- AUTH GUARD ----------
// If there is no token, user is not logged in -> send back to login page
if (!token || !userStr) {
  window.location.href = "login.html";
}

const currentUser = userStr ? JSON.parse(userStr) : null;

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
  });

  // Token invalid/expired -> force re-login
  if (res.status === 401 || res.status === 422) {
    localStorage.removeItem("clouddesk_token");
    localStorage.removeItem("clouddesk_user");
    window.location.href = "login.html";
    return null;
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

// ---------- TOP BAR USER INFO ----------
if (currentUser) {
  document.getElementById("userName").textContent = currentUser.name;
  document.getElementById("userRole").textContent = currentUser.role || "Developer";
  document.getElementById("welcomeName").textContent = currentUser.name;
  document.getElementById("userAvatar").textContent = currentUser.name.charAt(0).toUpperCase();
  document.getElementById("settingsName").value = currentUser.name;
  document.getElementById("settingsEmail").value = currentUser.email;
}

// ---------- SIDEBAR NAVIGATION ----------
const navItems = document.querySelectorAll(".nav-item[data-section]");
navItems.forEach((item) => {
  item.addEventListener("click", (e) => {
    e.preventDefault();
    navItems.forEach((i) => i.classList.remove("active"));
    item.classList.add("active");

    document.querySelectorAll(".content-section").forEach((sec) => sec.classList.remove("active"));
    document.getElementById(item.dataset.section).classList.add("active");

    // Load data lazily when a section is opened
    if (item.dataset.section === "section-projects") loadProjects();
    if (item.dataset.section === "section-tasks") loadTasks();
    if (item.dataset.section === "section-notes") loadNotes();
    if (item.dataset.section === "section-team") loadTeam();
  });
});

// Mobile sidebar toggle
document.getElementById("menuToggle").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("open");
});

// ---------- LOGOUT ----------
function logout() {
  localStorage.removeItem("clouddesk_token");
  localStorage.removeItem("clouddesk_user");
  window.location.href = "login.html";
}
document.getElementById("logoutBtn").addEventListener("click", (e) => {
  e.preventDefault();
  logout();
});
document.getElementById("settingsLogoutBtn").addEventListener("click", logout);

// ---------- DASHBOARD STATS ----------
async function loadDashboard() {
  try {
    const stats = await apiFetch("/dashboard");
    if (!stats) return;
    document.getElementById("statProjects").textContent = stats.total_projects;
    document.getElementById("statTasks").textContent = stats.total_tasks;
    document.getElementById("statCompleted").textContent = stats.completed_tasks;
    document.getElementById("statTeam").textContent = stats.team_members;

    const activity = await apiFetch("/activity");
    const list = document.getElementById("activityList");
    list.innerHTML = "";
    (activity || []).forEach((a) => {
      const li = document.createElement("li");
      li.textContent = `${a.name}: ${a.activity}`;
      list.appendChild(li);
    });
  } catch (err) {
    console.error(err);
  }
}

function statusClass(status) {
  return "status-" + (status || "pending").toLowerCase().replace(/\s+/g, "-");
}

// ---------- PROJECTS ----------
async function loadProjects() {
  try {
    const projects = await apiFetch("/projects");
    const body = document.getElementById("projectsTableBody");
    body.innerHTML = "";
    (projects || []).forEach((p) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${p.project_name}</td>
        <td><span class="status-badge ${statusClass(p.status)}">${p.status}</span></td>
        <td>${p.progress}%</td>
        <td>
          <button class="link-btn" onclick="editProject(${p.id}, '${p.project_name.replace(/'/g, "\\'")}', '${p.status}', ${p.progress})">Edit</button>
          <button class="link-btn danger" onclick="deleteProject(${p.id})">Delete</button>
        </td>`;
      body.appendChild(row);
    });
  } catch (err) {
    console.error(err);
  }
}

document.getElementById("addProjectBtn").addEventListener("click", async () => {
  const name = prompt("Project name:");
  if (!name) return;
  try {
    await apiFetch("/projects", {
      method: "POST",
      body: JSON.stringify({ project_name: name, status: "Pending", progress: 0 }),
    });
    loadProjects();
  } catch (err) {
    alert(err.message);
  }
});

async function editProject(id, currentName, currentStatus, currentProgress) {
  const name = prompt("Project name:", currentName);
  if (!name) return;
  const status = prompt("Status (Pending / In Progress / Completed):", currentStatus);
  const progress = prompt("Progress (0-100):", currentProgress);
  try {
    await apiFetch(`/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify({ project_name: name, status, progress: Number(progress) || 0, description: "" }),
    });
    loadProjects();
  } catch (err) {
    alert(err.message);
  }
}

async function deleteProject(id) {
  if (!confirm("Delete this project?")) return;
  try {
    await apiFetch(`/projects/${id}`, { method: "DELETE" });
    loadProjects();
  } catch (err) {
    alert(err.message);
  }
}

// ---------- TASKS ----------
async function loadTasks() {
  try {
    const tasks = await apiFetch("/tasks");
    const body = document.getElementById("tasksTableBody");
    body.innerHTML = "";
    (tasks || []).forEach((t) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${t.title}</td>
        <td><span class="status-badge ${statusClass(t.status)}">${t.status}</span></td>
        <td>${t.priority}</td>
        <td>${t.due_date || "-"}</td>
        <td>
          <button class="link-btn" onclick="toggleTaskComplete(${t.id}, '${t.title.replace(/'/g, "\\'")}', '${t.status}', '${t.priority}')">Toggle</button>
          <button class="link-btn danger" onclick="deleteTask(${t.id})">Delete</button>
        </td>`;
      body.appendChild(row);
    });
  } catch (err) {
    console.error(err);
  }
}

document.getElementById("addTaskBtn").addEventListener("click", async () => {
  const title = prompt("Task title:");
  if (!title) return;
  const priority = prompt("Priority (Low / Medium / High):", "Medium");
  try {
    await apiFetch("/tasks", {
      method: "POST",
      body: JSON.stringify({ title, status: "Pending", priority: priority || "Medium" }),
    });
    loadTasks();
  } catch (err) {
    alert(err.message);
  }
});

async function toggleTaskComplete(id, title, currentStatus, priority) {
  const newStatus = currentStatus === "Completed" ? "Pending" : "Completed";
  try {
    await apiFetch(`/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify({ title, status: newStatus, priority, description: "" }),
    });
    loadTasks();
  } catch (err) {
    alert(err.message);
  }
}

async function deleteTask(id) {
  if (!confirm("Delete this task?")) return;
  try {
    await apiFetch(`/tasks/${id}`, { method: "DELETE" });
    loadTasks();
  } catch (err) {
    alert(err.message);
  }
}

// ---------- NOTES ----------
async function loadNotes() {
  try {
    const notes = await apiFetch("/notes");
    const grid = document.getElementById("notesGrid");
    grid.innerHTML = "";
    (notes || []).forEach((n) => {
      const card = document.createElement("div");
      card.className = "note-card";
      card.innerHTML = `
        <h4>${n.title}</h4>
        <p>${n.content || ""}</p>
        <button class="link-btn danger" onclick="deleteNote(${n.id})">Delete</button>`;
      grid.appendChild(card);
    });
  } catch (err) {
    console.error(err);
  }
}

document.getElementById("addNoteBtn").addEventListener("click", async () => {
  const title = prompt("Note title:");
  if (!title) return;
  const content = prompt("Note content:", "");
  try {
    await apiFetch("/notes", {
      method: "POST",
      body: JSON.stringify({ title, content }),
    });
    loadNotes();
  } catch (err) {
    alert(err.message);
  }
});

async function deleteNote(id) {
  if (!confirm("Delete this note?")) return;
  try {
    await apiFetch(`/notes/${id}`, { method: "DELETE" });
    loadNotes();
  } catch (err) {
    alert(err.message);
  }
}

// ---------- TEAM ----------
async function loadTeam() {
  try {
    const users = await apiFetch("/users");
    const body = document.getElementById("teamTableBody");
    body.innerHTML = "";
    (users || []).forEach((u) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${u.name}</td>
        <td>${u.email}</td>
        <td>${u.role}</td>
        <td>${(u.created_at || "").split("T")[0]}</td>`;
      body.appendChild(row);
    });
  } catch (err) {
    console.error(err);
  }
}

// ---------- INITIAL LOAD ----------
loadDashboard();
