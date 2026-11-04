/* ============================================================
   LOGIN PAGE — Student Portal
   Author section: Login screen (individual contribution)

   NOTE ON BACKEND WIRING
   -----------------------
   There is no live /api/login endpoint or database yet, so this
   file authenticates against MOCK_USERS below. The business-rule
   checks (unique email format, required fields, account status,
   password match, lockout after repeated failures) are written the
   same way they will run once a real endpoint exists — see
   sql/login_queries.sql for the exact queries that endpoint should
   run against the `users` table.

   When the backend is ready, replace the block marked
   "REPLACE WITH REAL API CALL" below with:

     const response = await fetch('/api/login', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ email, password })
     });
     if (!response.ok) { ... }
     const result = await response.json();

   ============================================================ */

// Flip to false before final submission to hide the QA panel.
const QA_MODE = true;

const MOCK_USERS = [
    { email: "rocco@campus.edu", password: "Campus2026!", status: "active" },
    { email: "suspended@campus.edu", password: "Campus2026!", status: "suspended" }
];

const MAX_ATTEMPTS = 3;
let failedAttempts = 0;

document.addEventListener("DOMContentLoaded", function () {

    console.log("Login page loaded.");

    const form = document.getElementById("loginForm");
    form.addEventListener("submit", handleLogin);

    document.getElementById("toggleVisibility")
        .addEventListener("click", togglePasswordVisibility);

    document.getElementById("forgotPassword")
        .addEventListener("click", function (e) {
            e.preventDefault();
            alert("A password reset link would be emailed to you here.");
        });

    if (QA_MODE) {
        document.getElementById("qaPanel").style.display = "block";
        document.querySelectorAll("[data-scenario]").forEach(function (btn) {
            btn.addEventListener("click", function () {
                runScenario(btn.getAttribute("data-scenario"));
            });
        });
    } else {
        document.getElementById("qaPanel").style.display = "none";
    }
});

/* ---------------- CORE VALIDATION ---------------- */

function isValidEmailFormat(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function setFieldError(fieldId, message) {
    const input = document.getElementById(fieldId);
    const errorBox = document.getElementById(fieldId + "-error");
    input.closest(".input-group").classList.add("has-error");
    errorBox.textContent = message;
    errorBox.classList.add("show");
}

function clearFieldError(fieldId) {
    const input = document.getElementById(fieldId);
    const errorBox = document.getElementById(fieldId + "-error");
    input.closest(".input-group").classList.remove("has-error");
    errorBox.textContent = "";
    errorBox.classList.remove("show");
}

function setBanner(type, message) {
    const banner = document.getElementById("formBanner");
    banner.className = "banner show " + type;
    banner.textContent = message;
}

function clearBanner() {
    const banner = document.getElementById("formBanner");
    banner.className = "banner";
    banner.textContent = "";
}

/* ---------------- LOGIN HANDLER ---------------- */

async function handleLogin(event) {
    event.preventDefault();

    clearFieldError("email");
    clearFieldError("password");
    clearBanner();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const signInBtn = document.getElementById("signInBtn");

    // Business rule: lockout after repeated failed attempts (TC-10)
    if (failedAttempts >= MAX_ATTEMPTS) {
        setBanner("error", "Too many failed attempts. Please try again in a few minutes.");
        signInBtn.disabled = true;
        return;
    }

    // Required-field checks (TC-02 / TC-04)
    let hasError = false;
    if (!email) {
        setFieldError("email", "Email is required.");
        hasError = true;
    } else if (!isValidEmailFormat(email)) {
        // TC-03
        setFieldError("email", "Please enter a valid email address.");
        hasError = true;
    }
    if (!password) {
        setFieldError("password", "Password is required.");
        hasError = true;
    }
    if (hasError) return;

    // ---- REPLACE WITH REAL API CALL once /api/login exists ----
    const user = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user || user.password !== password) {
        // TC-05
        failedAttempts++;
        setBanner("error", "Invalid credentials. Please try again.");
        return;
    }

    if (user.status === "suspended") {
        // TC-09
        setBanner("error", "Your account has been suspended. Contact support for assistance.");
        return;
    }
    // ---- END REPLACE BLOCK ----

    failedAttempts = 0;
    setBanner("success", "Signed in successfully. Redirecting to the marketplace…");
    console.log("Login success:", email);
    // window.location.href = "homepage.html";
}

function togglePasswordVisibility() {
    const input = document.getElementById("password");
    const btn = document.getElementById("toggleVisibility");
    const nowVisible = input.type === "password";
    input.type = nowVisible ? "text" : "password";
    btn.textContent = nowVisible ? "🙈" : "👁";
}

/* ============================================================
   QA SCENARIOS — for Testing Evidence screenshots only.
   TC-01 to TC-10 reuse the real handleLogin() path above.
   The two runtime/network scenarios are isolated here since they
   simulate bugs that should NEVER exist in the shipped form logic.
   ============================================================ */

function fillAndSubmit(email, password) {
    document.getElementById("email").value = email;
    document.getElementById("password").value = password;
    document.getElementById("loginForm").dispatchEvent(new Event("submit", { cancelable: true }));
}

function runScenario(key) {
    const qaConsole = document.getElementById("qaConsole");
    qaConsole.classList.remove("show");
    qaConsole.textContent = "";

    switch (key) {
        case "tc01":
            fillAndSubmit("rocco@campus.edu", "Campus2026!");
            break;
        case "tc02":
            fillAndSubmit("", "Campus2026!");
            break;
        case "tc03":
            fillAndSubmit("rocco@", "Campus2026!");
            break;
        case "tc04":
            fillAndSubmit("rocco@campus.edu", "");
            break;
        case "tc05":
            fillAndSubmit("rocco@campus.edu", "wrongPassword1");
            break;
        case "tc09":
            fillAndSubmit("suspended@campus.edu", "Campus2026!");
            break;
        case "tc10":
            failedAttempts = MAX_ATTEMPTS;
            fillAndSubmit("rocco@campus.edu", "wrongPassword1");
            break;
        case "runtime-null":
            runNullDomBug(qaConsole);
            break;
        case "network-down":
            runNetworkDownBug(qaConsole);
            break;
    }
}

// BUG DEMO: references an element ID that doesn't exist on this page.
// Real cause in past bugs on this project: a copy-pasted id from profile.html.
function runNullDomBug(consoleBox) {
    consoleBox.classList.add("show");
    try {
        const el = document.getElementById("studentName"); // does not exist on login.html
        el.textContent = "test"; // throws: el is null
    } catch (e) {
        consoleBox.textContent = "> Uncaught TypeError: " + e.message;
        console.error(e);
    }
}

// BUG DEMO: simulates the backend being unreachable / returning 500.
function runNetworkDownBug(consoleBox) {
    consoleBox.classList.add("show");
    consoleBox.textContent = "Contacting server…";
    setTimeout(function () {
        consoleBox.textContent =
            "> POST /api/login 500 (Internal Server Error)\n" +
            "> Uncaught (in promise) TypeError: Failed to fetch";
        console.error("POST /api/login 500 (Internal Server Error)");
        setBanner("error", "Couldn't reach the server. Please try again later.");
    }, 600);
}
