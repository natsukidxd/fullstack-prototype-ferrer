// Data

const STORAGE_KEY = "fullstack-prototype-ferrer";

let db = {
  accounts: [],
  departments: [],
  employees: [],
  requests: [],
};

let currentUser = null;

// Storage

function loadFromStorage() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      Object.assign(db, JSON.parse(data));
    } else {
      seedInitialData();
    }
  } catch (error) {
    console.error("Storage parse error", error);
    seedInitialData();
  }
}

function seedInitialData() {
  db = {
    accounts: [
      {
        id: "admin1",
        firstName: "Admin",
        lastName: "User",
        email: "admin@example.com",
        password: "Password123!",
        verified: true,
        role: "admin",
      },
    ],
    departments: [
      {
        id: "dept1",
        name: "Engineering",
        description: "Software team",
      },
      {
        id: "dept2",
        name: "HR",
        description: "Human Resources",
      },
    ],
    employees: [],
    requests: [],
  };
  saveToStorage();
}

function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (error) {
    console.error("Storage save error", error);
  }
}

// Authentication States

function setAuthState(isAuthenticated, user = null) {
  currentUser = user;

  if (isAuthenticated && user) {
    document.body.classList.remove("not-authenticated");
    document.body.classList.add("authenticated");
    document.body.classList.toggle("is-admin", user.role === "admin");
    document.getElementById("currentUserName").textContent =
      `${user.firstName} ${user.lastName}`;
  } else {
    document.body.classList.remove("authenticated", "is-admin");
    document.body.classList.add("not-authenticated");
  }
}

function checkAuthOnLoad() {
  const token = localStorage.getItem("authToken");
  if (token) {
    const user = db.accounts.find((acc) => acc.email === token && acc.verified);
    if (user) setAuthState(true, user);
    else localStorage.removeItem("authToken");
  }
}

// Routing

const routes = {
  "": "home-page",
  "/": "home-page",
  "/register": "register-page",
  "/verify-email": "verification-page",
  "/login": "login-page",
  "/profile": "profile-page",
  "/requests": "requests-page",
  "/accounts": "accounts-page",
  "/departments": "departments-page",
  "/employees": "employees-page",
};

function navigateTo(hash) {
  if (!hash.startsWith("#")) hash = "#" + hash;
  window.location.hash = hash;
}

function handleRouting() {
  let hash = (window.location.hash || "#/").replace("#", "").toLowerCase();
  if (hash === "") hash = "/";

  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));

  const isProtected = ["/profile", "/requests", "/admin"].some((p) =>
    hash.startsWith(p),
  );
  if (isProtected && !currentUser) {
    showToast("Please login first", "warning");
    return navigateTo("/login");
  }

  const isAdminRoute = hash.startsWith("/admin");
  if (isAdminRoute && (!currentUser || currentUser.role !== "admin")) {
    showToast("Admin access only", "danger");
    return navigateTo("/profile");
  }

  const pageId = routes[hash] || "home-page";
  const page = document.getElementById(pageId);
  if (page) page.classList.add("active");

  if (pageId === "profile-page") renderProfile();
  if (pageId === "requests-page") renderRequests();
  if (pageId === "accounts-page") renderAccounts();
  if (pageId === "departments-page") renderDepartments();
  if (pageId === "employees-page") renderEmployees();
}

window.addEventListener("hashchange", handleRouting);
window.addEventListener("load", () => {
  loadFromStorage();
  checkAuthOnLoad();
  if (!window.location.hash) navigateTo("/");
  handleRouting();
});

// Toast

function showToast(message, type = "info") {
  const bg =
    {
      success: "bg-success text-white",
      danger: "bg-danger text-white",
      warning: "bg-warning text-dark",
      info: "bg-info text-white",
    }[type] || "bg-info text-white";

  const toast = document.createElement("div");
  toast.className = `toast align-items-center ${bg} border-0`;
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `;
  document.querySelector(".toast-container").appendChild(toast);
  new bootstrap.Toast(toast, { autohide: true, delay: 3500 }).show();
}

// Register
document.getElementById("registerForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const form = e.target;
  if (!form.checkValidity()) return form.classList.add("was-validated");

  const data = new FormData(form);
  const email = data.get("registerEmail").trim().toLowerCase();

  if (db.accounts.some((a) => a.email.toLowerCase() === email)) {
    return showToast("Email already registered", "danger");
  }

  const newUser = {
    id: "u" + Date.now(),
    firstName: data.get("registerFirstName").trim(),
    lastName: data.get("registerLastName").trim(),
    email,
    password: data.get("registerPassword"),
    verified: false,
    role: "employee",
  };

  db.accounts.push(newUser);
  saveToStorage();

  localStorage.setItem("unverified_email", email);
  showToast("Registration successful! Verify your email.", "success");
  navigateTo("/verify-email");
});

// verification

document.getElementById("btnSimulateVerify")?.addEventListener("click", () => {
  const email = localStorage.getItem("unverified_email");
  if (!email) return;

  const user = db.accounts.find((u) => u.email === email);
  if (user) {
    user.verified = true;
    saveToStorage();
    localStorage.removeItem("unverified_email");
    showToast("Email verified!", "success");
    navigateTo("/login");
  }
});

document
  .getElementById("verification-page")
  ?.addEventListener("classListChanged", () => {
    const email = localStorage.getItem("unverified_email");
    document.getElementById("verifyEmailDisplay").textContent =
      email || "(no email found)";
    if (!email) navigateTo("/register");
  });

// login

document.getElementById("loginForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const form = e.target;
  if (!form.checkValidity()) return form.classList.add("was-validated");

  const data = new FormData(form);
  const email = data.get("loginEmail").trim().toLowerCase();
  const pass = data.get("loginPassword");

  const user = db.accounts.find(
    (u) => u.email.toLowerCase() === email && u.password === pass && u.verified,
  );

  if (user) {
    localStorage.setItem("auth_token", user.email);
    setAuthState(true, user);
    showToast(`Welcome, ${user.firstName}!`, "success");
    navigateTo("/profile");
  } else {
    showToast("Invalid credentials or unverified account", "danger");
  }
});
