const STORAGE_KEY = "fullstack-prototype-ferrer";

let db = {
  accounts: [],
  departments: [],
  employees: [],
  requests: [],
};

let currentUser = null;

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

function setAuthState(isAuthenticated, user = null) {
  currentUser = user;

  if (isAuthenticated && user) {
    document.body.classList.remove("not-authenticated");
    document.body.classList.add("authenticated");
    document.body.classList.toggle("is-admin", user.role === "admin");
    document.getElementById(
      "currentUserName"
    ).textContent = `${user.firstName} ${user.lastName}`;
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

const routes = {
    "": "home-page",
    "/": "home-page",
    "home": "home-page",
    "/register": "register-page",
    "verify-email": "verify-email-page",
    "/login": "login-page",
    "/profile": "profile-page",
    "/requests": "requests-page",
    "/acounts": "accounts-page",
    "/departments": "departments-page",
    "/employees": "employees-page",
};

function navigateTo(hash) {
    if (!hash.startsWith("#")) hash = "#" + hash;
    window.location.hash = hash;
}

function handleRouting() {
    let hash = (window.location.hash || "#/")
      .replace("#", "")
      .toLowerCase();
    if (hash === "") hash = "/";

    document
      .querySelectorAll(".page")
      .forEach((p) => p.classList.remove("active"));

    const isProtected = ["/profile", "/requests", "/admin"].some((p) =>
      hash.startsWith(p)
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
    if (pageId === "admin-accounts-page") renderAccounts();
    if (pageId === "admin-departments-page") renderDepartments();
    if (pageId === "admin-employees-page") renderEmployees();
  }
