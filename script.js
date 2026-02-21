// Data

const STORAGE_KEY = "'ipt_demo_v1";
const AUTH_TOKEN_KEY = "auth_token";
const UNVERIFIED_EMAIL_KEY = "unverified_email";

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
    document.getElementById(
      "currentUserName"
    ).textContent = `${user.firstName} ${user.lastName}`;
  } else {
    document.body.classList.remove("authenticated", "is-admin");
    document.body.classList.add("not-authenticated");
    const nameEl = document.getElementById("currentUserName");
    if (nameEl) nameEl.textContent = "";
  }
}

function checkAuthOnLoad() {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    const user = db.accounts.find((acc) => acc.email === token && acc.verified);
    if (user) setAuthState(true, user);
    else localStorage.removeItem(AUTH_TOKEN_KEY);
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

  const protectedRoutes = [
    "/profile",
    "/requests",
    "/accounts",
    "/departments",
    "/employees",
  ];
  const isProtected = protectedRoutes.some((p) => hash.startsWith(p));
  if (isProtected && !currentUser) {
    showToast("Please login first", "warning");
    return navigateTo("/login");
  }

  const adminRoutes = ["/accounts", "/departments", "/employees"];
  const isAdminRoute = adminRoutes.some((p) => hash.startsWith(p));
  if (isAdminRoute && (!currentUser || currentUser.role !== "admin")) {
    showToast("Admin access only", "danger");
    return navigateTo("/profile");
  }

  const pageId = routes[hash] || "home-page";
  const page = document.getElementById(pageId);
  if (page) page.classList.add("active");

  if (pageId === "profile-page") renderProfile();
  if (pageId === "verification-page") renderVerification();
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

  localStorage.setItem(UNVERIFIED_EMAIL_KEY, email);
  showToast("Registration successful! Verify your email.", "success");
  navigateTo("/verify-email");
});

// verification

document.getElementById("btnSimulateVerify")?.addEventListener("click", () => {
  const email = localStorage.getItem(UNVERIFIED_EMAIL_KEY);
  if (!email) return;

  const user = db.accounts.find((u) => u.email === email);
  if (user) {
    user.verified = true;
    saveToStorage();
    localStorage.removeItem(UNVERIFIED_EMAIL_KEY);
    showToast("Email verified!", "success");
    navigateTo("/login");
  }
});

function renderVerification() {
  const email = localStorage.getItem(UNVERIFIED_EMAIL_KEY);
  const el = document.getElementById("verifyEmailDisplay");
  if (el) el.textContent = email || "(no email found)";
  if (!email) navigateTo("/register");
}

// login

document.getElementById("loginForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const form = e.target;
  if (!form.checkValidity()) return form.classList.add("was-validated");

  const data = new FormData(form);
  const email = data.get("loginEmail").trim().toLowerCase();
  const pass = data.get("loginPassword");

  const user = db.accounts.find(
    (u) => u.email.toLowerCase() === email && u.password === pass && u.verified
  );

  if (user) {
    localStorage.setItem(AUTH_TOKEN_KEY, user.email);
    setAuthState(true, user);
    showToast(`Welcome, ${user.firstName}!`, "success");
    navigateTo("/profile");
  } else {
    showToast("Invalid credentials or unverified account", "danger");
  }
});

// logout

document.getElementById("btnLogout")?.addEventListener("click", (e) => {
  e.preventDefault();
  localStorage.removeItem(AUTH_TOKEN_KEY);
  setAuthState(false);
  showToast("Logged out", "info");
  navigateTo("/");
});

// profile

function renderProfile() {
  if (!currentUser) return;
  document.getElementById(
    "profileName"
  ).textContent = `${currentUser.firstName} ${currentUser.lastName}`;
  document.getElementById("profileEmail").textContent = currentUser.email;
  document.getElementById("profileRole").textContent =
    currentUser.role.toUpperCase();
}

// profile edit

function openProfileModal() {
  if (!currentUser) return;

  const modalEl = document.getElementById("profileModal");
  const form = document.getElementById("profileForm");
  if (!modalEl || !form) return;

  form.classList.remove("was-validated");
  form.reset();

  form.elements.firstName.value = currentUser.firstName || "";
  form.elements.lastName.value = currentUser.lastName || "";
  form.elements.email.value = currentUser.email || "";
  form.elements.password.value = "";

  const modal =
    bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
  modal.show();
}

document.getElementById("btnEditProfile")?.addEventListener("click", (e) => {
  e.preventDefault();
  openProfileModal();
});

document.getElementById("btnSaveProfile")?.addEventListener("click", () => {
  if (!currentUser) return;

  const modalEl = document.getElementById("profileModal");
  const form = document.getElementById("profileForm");
  if (!modalEl || !form) return;

  if (!form.checkValidity()) {
    form.classList.add("was-validated");
    return;
  }

  const firstName = form.elements.firstName.value.trim();
  const lastName = form.elements.lastName.value.trim();
  const newPassword = form.elements.password.value;

  if (newPassword && newPassword.length < 6) {
    return showToast("Password must be at least 6 characters", "warning");
  }

  // Update the account record in db
  const acc =
    db.accounts.find((a) => a.id === currentUser.id) ||
    db.accounts.find(
      (a) => normalizeEmail(a.email) === normalizeEmail(currentUser.email)
    );
  if (!acc) return showToast("Account not found", "danger");

  acc.firstName = firstName;
  acc.lastName = lastName;
  if (newPassword) acc.password = newPassword;

  // Keep currentUser in sync
  currentUser.firstName = firstName;
  currentUser.lastName = lastName;
  if (newPassword) currentUser.password = newPassword;

  saveToStorage();
  renderProfile();

  // Update navbar display name
  const nameEl = document.getElementById("currentUserName");
  if (nameEl) nameEl.textContent = `${firstName} ${lastName}`;

  // Close modal
  const modal = bootstrap.Modal.getInstance(modalEl);
  modal?.hide();

  showToast("Profile updated", "success");
});

// request

function renderRequests() {
  if (!currentUser) return;
  const tbody = document.querySelector("#requestsTable tbody");
  tbody.innerHTML = "";

  const userReqs = db.requests.filter(
    (r) => r.employeeEmail === currentUser.email
  );

  if (userReqs.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="4" class="text-center py-4">No requests yet.</td></tr>';
    return;
  }

  userReqs.forEach((req) => {
    const badgeClass =
      {
        Pending: "bg-warning text-dark",
        Approved: "bg-success",
        Rejected: "bg-danger",
      }[req.status] || "bg-secondary";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${new Date(req.date).toLocaleDateString()}</td>
      <td>${req.type}</td>
      <td>${req.items.map((i) => `${i.name} (${i.qty})`).join(", ")}</td>
      <td><span class="badge ${badgeClass}">${req.status}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

document.getElementById("btnAddItem")?.addEventListener("click", () => {
  const container = document.getElementById("itemsContainer");
  const row = document.createElement("div");
  row.className = "request-item-row input-group mb-2";
  row.innerHTML = `
    <input type="text" class="form-control" placeholder="Item name" name="itemName[]" required>
    <input type="number" class="form-control" placeholder="Qty" name="itemQty[]" min="1" style="max-width:90px;" required>
    <button type="button" class="btn btn-outline-danger btn-remove-item">×</button>
  `;
  container.appendChild(row);
});

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("btn-remove-item")) {
    e.target.closest(".request-item-row")?.remove();
  }
});

document.getElementById("btnSubmitRequest")?.addEventListener("click", () => {
  const form = document.getElementById("newRequestForm");
  if (!form.checkValidity()) return form.classList.add("was-validated");

  const data = new FormData(form);
  const type = data.get("type");
  const names = data.getAll("itemName[]");
  const qtys = data.getAll("itemQty[]");

  const items = names
    .map((n, i) => ({
      name: n.trim(),
      qty: Number(qtys[i]),
    }))
    .filter((it) => it.name && it.qty > 0);

  if (items.length === 0) return showToast("Add at least one item", "warning");

  db.requests.push({
    id: "req" + Date.now(),
    type,
    items,
    status: "Pending",
    date: new Date().toISOString(),
    employeeEmail: currentUser.email,
  });

  saveToStorage();
  bootstrap.Modal.getInstance(
    document.getElementById("newRequestModal")
  ).hide();
  form.reset();
  document.getElementById("itemsContainer").innerHTML = `
    <div class="request-item-row input-group mb-2">
      <input type="text" class="form-control" placeholder="Item name" name="itemName[]" required>
      <input type="number" class="form-control" placeholder="Qty" name="itemQty[]" min="1" style="max-width:90px;" required>
      <button type="button" class="btn btn-outline-danger btn-remove-item">×</button>
    </div>
  `;
  showToast("Request submitted", "success");
  renderRequests();
});

// accounts

function renderAccounts() {
  const tbody = document.querySelector("#accountsTable tbody");
  tbody.innerHTML = "";

  db.accounts.forEach((acc) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${acc.firstName} ${acc.lastName}</td>
      <td>${acc.email}</td>
      <td>${acc.role}</td>
      <td>${acc.verified ? "Yes" : "No"}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary btn-edit-acc" data-id="${
          acc.id
        }">Edit</button>
        <button class="btn btn-sm btn-outline-warning btn-reset-acc" data-id="${
          acc.id
        }">Reset PW</button>
        <button class="btn btn-sm btn-outline-danger btn-delete-acc" data-id="${
          acc.id
        }">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// accounts CRUD

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function updateEmailReferences(oldEmail, newEmail) {
  if (!oldEmail || !newEmail || oldEmail === newEmail) return;

  // Update employee records
  db.employees.forEach((e) => {
    if (normalizeEmail(e.userEmail) === normalizeEmail(oldEmail)) {
      e.userEmail = newEmail;
    }
  });

  // Update requests ownership
  db.requests.forEach((r) => {
    if (normalizeEmail(r.employeeEmail) === normalizeEmail(oldEmail)) {
      r.employeeEmail = newEmail;
    }
  });
}

function openAccountModal(acc = null) {
  const modalEl = document.getElementById("accountModal");
  const modal =
    bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
  const form = document.getElementById("accountForm");

  form.reset();
  form.classList.remove("was-validated");

  const pwHint = document.getElementById("accountPwHint");
  document.getElementById("accountModalLabel").textContent = acc
    ? "Edit Account"
    : "Add Account";

  // When adding, password is required; when editing, leave blank to keep.
  form.elements.password.required = !acc;
  if (pwHint) pwHint.textContent = acc ? "(leave blank to keep)" : "(min 6)";

  if (acc) {
    document.getElementById("accountId").value = acc.id;
    form.elements.firstName.value = acc.firstName || "";
    form.elements.lastName.value = acc.lastName || "";
    form.elements.email.value = acc.email || "";
    form.elements.role.value = acc.role || "employee";
    form.elements.verified.checked = Boolean(acc.verified);
  } else {
    document.getElementById("accountId").value = "";
    form.elements.role.value = "employee";
    form.elements.verified.checked = false;
  }

  modal.show();
}

document.getElementById("btnAddAccount")?.addEventListener("click", () => {
  openAccountModal(null);
});

document.getElementById("btnSaveAccount")?.addEventListener("click", () => {
  const form = document.getElementById("accountForm");
  if (!form.checkValidity()) return form.classList.add("was-validated");

  const data = new FormData(form);
  const id = String(data.get("id") || "");
  const firstName = String(data.get("firstName") || "").trim();
  const lastName = String(data.get("lastName") || "").trim();
  const email = normalizeEmail(data.get("email"));
  const password = String(data.get("password") || "");
  const role = String(data.get("role") || "employee");
  const verified = form.elements.verified.checked;

  // unique email
  const emailTaken = db.accounts.some(
    (a) => normalizeEmail(a.email) === email && a.id !== id
  );
  if (emailTaken) return showToast("Email already exists", "danger");

  if (!id) {
    // Create
    if (password.length < 6)
      return showToast("Password must be at least 6 characters", "warning");

    db.accounts.push({
      id: "u" + Date.now(),
      firstName,
      lastName,
      email,
      password,
      role,
      verified,
    });

    saveToStorage();
    renderAccounts();
    showToast("Account created", "success");
    forceCloseModalSafe("accountModal");
    return;
  }

  // Edit
  const acc = db.accounts.find((a) => a.id === id);
  if (!acc) return showToast("Account not found", "danger");

  const oldEmail = acc.email;

  acc.firstName = firstName;
  acc.lastName = lastName;
  acc.email = email;
  acc.role = role;
  acc.verified = verified;

  if (password.trim()) {
    if (password.length < 6)
      return showToast("Password must be at least 6 characters", "warning");
    acc.password = password;
  }

  // keep references consistent if email changed
  updateEmailReferences(oldEmail, email);

  // If editing self, keep auth token in sync
  if (
    currentUser &&
    normalizeEmail(currentUser.email) === normalizeEmail(oldEmail)
  ) {
    currentUser = acc;
    localStorage.setItem(AUTH_TOKEN_KEY, acc.email);
    document.getElementById(
      "currentUserName"
    ).textContent = `${acc.firstName} ${acc.lastName}`;
    // ensure admin class updates if role changed
    document.body.classList.toggle("is-admin", acc.role === "admin");
  }

  saveToStorage();
  renderAccounts();
  // If employee modal dropdowns are open later, keep data fresh
  showToast("Account updated", "success");
  forceCloseModalSafe("accountModal");
});

function forceCloseModalSafe(modalId) {
  const el = document.getElementById(modalId);
  if (!el) return;
  const instance = bootstrap.Modal.getInstance(el);
  if (instance) instance.hide();

  // Cleanup: prevents stuck dark backdrop in edge cases
  document.body.classList.remove("modal-open");
  document.querySelectorAll(".modal-backdrop").forEach((b) => b.remove());
  document.body.style.removeProperty("padding-right");
}

function resetAccountPassword(accId) {
  const acc = db.accounts.find((a) => a.id === accId);
  if (!acc) return showToast("Account not found", "danger");

  const newPw = prompt(`Enter new password for ${acc.email} (min 6 chars):`);
  if (newPw === null) return; // cancelled
  if (String(newPw).length < 6)
    return showToast("Password must be at least 6 characters", "warning");

  acc.password = String(newPw);
  saveToStorage();
  showToast("Password updated", "success");
}

function deleteAccount(accId) {
  const acc = db.accounts.find((a) => a.id === accId);
  if (!acc) return showToast("Account not found", "danger");

  if (
    currentUser &&
    normalizeEmail(currentUser.email) === normalizeEmail(acc.email)
  ) {
    return showToast(
      "You cannot delete your own account while logged in.",
      "warning"
    );
  }

  // Prevent deleting the last remaining admin (avoid locking the system)
  if (acc.role === "admin") {
    const adminCount = db.accounts.filter((a) => a.role === "admin").length;
    if (adminCount <= 1) {
      return showToast(
        "You cannot delete the last remaining admin account.",
        "warning"
      );
    }
  }

  if (
    !confirm(
      `Delete account: ${acc.email}? This will also remove related employee records and requests.`
    )
  )
    return;

  // Remove account
  db.accounts = db.accounts.filter((a) => a.id !== accId);

  // Cascade delete employee + requests for this email
  db.employees = db.employees.filter(
    (e) => normalizeEmail(e.userEmail) !== normalizeEmail(acc.email)
  );
  db.requests = db.requests.filter(
    (r) => normalizeEmail(r.employeeEmail) !== normalizeEmail(acc.email)
  );

  saveToStorage();
  renderAccounts();
  // If currently viewing employees/requests, refresh those tables
  if (document.getElementById("employees-page")?.classList.contains("active"))
    renderEmployees();
  if (document.getElementById("requests-page")?.classList.contains("active"))
    renderRequests();

  showToast("Account deleted", "info");
}

// departments CRUD

function renderDepartments() {
  const tbody = document.querySelector("#departmentsTable tbody");
  tbody.innerHTML = "";
  db.departments.forEach((dept) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${dept.name}</td>
      <td>${dept.description || "—"}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary btn-edit-dept" data-id="${
          dept.id
        }">Edit</button>
        <button class="btn btn-sm btn-outline-danger btn-delete-dept" data-id="${
          dept.id
        }">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function openDepartmentModal(dept = null) {
  const modalEl = document.getElementById("departmentModal");
  const modal = new bootstrap.Modal(modalEl);
  const form = document.getElementById("departmentForm");
  form.reset();

  document.getElementById("departmentModalLabel").textContent = dept
    ? "Edit Department"
    : "Add Department";

  if (dept) {
    document.getElementById("deptId").value = dept.id;
    form.elements.name.value = dept.name;
    form.elements.description.value = dept.description || "";
  } else {
    document.getElementById("deptId").value = "";
  }

  modal.show();
}

document
  .getElementById("btnAddDepartment")
  ?.addEventListener("click", () => openDepartmentModal());

document.getElementById("btnSaveDepartment")?.addEventListener("click", () => {
  const form = document.getElementById("departmentForm");
  if (!form.checkValidity()) return form.classList.add("was-validated");

  const data = new FormData(form);
  const id = data.get("id");
  const name = data.get("name").trim();

  if (
    db.departments.some(
      (d) => d.name.toLowerCase() === name.toLowerCase() && d.id !== id
    )
  ) {
    return showToast("Department name already exists", "danger");
  }

  if (id) {
    const dept = db.departments.find((d) => d.id === id);
    if (dept) {
      dept.name = name;
      dept.description = data.get("description").trim();
    }
  } else {
    db.departments.push({
      id: "dept" + Date.now(),
      name,
      description: data.get("description").trim(),
    });
  }

  saveToStorage();
  renderDepartments();
  bootstrap.Modal.getInstance(
    document.getElementById("departmentModal")
  ).hide();
  showToast(id ? "Department updated" : "Department created", "success");
});

// employees crud

function populateEmployeeDropdowns() {
  const userSel = document.getElementById("selectUserEmail");
  const deptSel = document.getElementById("selectDept");

  userSel.innerHTML = '<option value="">Select user...</option>';
  db.accounts
    .filter((a) => a.role !== "admin")
    .forEach((a) => {
      const opt = document.createElement("option");
      opt.value = a.email;
      opt.textContent = `${a.firstName} ${a.lastName} (${a.email})`;
      userSel.appendChild(opt);
    });

  deptSel.innerHTML = '<option value="">Select department...</option>';
  db.departments.forEach((d) => {
    const opt = document.createElement("option");
    opt.value = d.id;
    opt.textContent = d.name;
    deptSel.appendChild(opt);
  });
}

function renderEmployees() {
  const tbody = document.querySelector("#employeesTable tbody");
  tbody.innerHTML = "";

  db.employees.forEach((emp) => {
    const user = db.accounts.find((a) => a.email === emp.userEmail) || {};
    const dept = db.departments.find((d) => d.id === emp.departmentId) || {};

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${emp.employeeId}</td>
      <td>${user.firstName || ""} ${user.lastName || ""}<br><small>${
      emp.userEmail
    }</small></td>
      <td>${emp.position}</td>
      <td>${dept.name || "—"}</td>
      <td>${
        emp.hireDate ? new Date(emp.hireDate).toLocaleDateString() : "—"
      }</td>
      <td>
        <button class="btn btn-sm btn-outline-primary btn-edit-emp" data-id="${
          emp.id
        }">Edit</button>
        <button class="btn btn-sm btn-outline-danger btn-delete-emp" data-id="${
          emp.id
        }">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function openEmployeeModal(emp = null) {
  const modalEl = document.getElementById("employeeModal");
  const modal = new bootstrap.Modal(modalEl);
  const form = document.getElementById("employeeForm");
  form.reset();

  document.getElementById("employeeModalLabel").textContent = emp
    ? "Edit Employee"
    : "Add Employee";
  populateEmployeeDropdowns();

  if (emp) {
    document.getElementById("empId").value = emp.id;
    form.elements.employeeId.value = emp.employeeId;
    form.elements.userEmail.value = emp.userEmail;
    form.elements.position.value = emp.position;
    form.elements.departmentId.value = emp.departmentId;
    form.elements.hireDate.value = emp.hireDate || "";
  } else {
    document.getElementById("empId").value = "";
  }

  modal.show();
}

document
  .getElementById("btnAddEmployee")
  ?.addEventListener("click", () => openEmployeeModal());

document.getElementById("btnSaveEmployee")?.addEventListener("click", () => {
  const form = document.getElementById("employeeForm");
  if (!form.checkValidity()) return form.classList.add("was-validated");

  const data = new FormData(form);
  const id = data.get("id");
  const employeeId = data.get("employeeId").trim();
  const userEmail = data.get("userEmail");

  if (db.employees.some((e) => e.employeeId === employeeId && e.id !== id)) {
    return showToast("Employee ID already in use", "danger");
  }

  const payload = {
    employeeId,
    userEmail,
    position: data.get("position").trim(),
    departmentId: data.get("departmentId"),
    hireDate: data.get("hireDate"),
  };

  if (id) {
    const index = db.employees.findIndex((e) => e.id === id);
    if (index !== -1) Object.assign(db.employees[index], payload);
  } else {
    db.employees.push({ id: "emp" + Date.now(), ...payload });
  }

  saveToStorage();
  renderEmployees();
  bootstrap.Modal.getInstance(document.getElementById("employeeModal")).hide();
  showToast(id ? "Employee updated" : "Employee added", "success");
});

// event delegation for edit/delete

document.addEventListener("click", (e) => {
  const t = e.target;

  // Accounts
  if (t.classList.contains("btn-edit-acc")) {
    const id = t.dataset.id;
    const acc = db.accounts.find((a) => a.id === id);
    if (acc) openAccountModal(acc);
  }
  if (t.classList.contains("btn-reset-acc")) {
    const id = t.dataset.id;
    resetAccountPassword(id);
  }
  if (t.classList.contains("btn-delete-acc")) {
    const id = t.dataset.id;
    deleteAccount(id);
  }

  // Departments
  if (t.classList.contains("btn-edit-dept")) {
    const id = t.dataset.id;
    const dept = db.departments.find((d) => d.id === id);
    if (dept) openDepartmentModal(dept);
  }
  if (t.classList.contains("btn-delete-dept")) {
    const id = t.dataset.id;
    if (!confirm("Delete department?")) return;
    const idx = db.departments.findIndex((d) => d.id === id);
    if (idx !== -1) {
      db.departments.splice(idx, 1);
      saveToStorage();
      renderDepartments();
      showToast("Department deleted", "info");
    }
  }

  // Employees
  if (t.classList.contains("btn-edit-emp")) {
    const id = t.dataset.id;
    const emp = db.employees.find((e) => e.id === id);
    if (emp) openEmployeeModal(emp);
  }
  if (t.classList.contains("btn-delete-emp")) {
    const id = t.dataset.id;
    if (!confirm("Delete employee record?")) return;
    const idx = db.employees.findIndex((e) => e.id === id);
    if (idx !== -1) {
      db.employees.splice(idx, 1);
      saveToStorage();
      renderEmployees();
      showToast("Employee record deleted", "info");
    }
  }
});
