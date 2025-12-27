// vividmedi-flow.js
console.log("✅ vividmedi-flow.js loaded successfully");

const sections = document.querySelectorAll(".form-section");
const progressBar = document.querySelector(".progress-bar");
const continueButtons = document.querySelectorAll(".continue-btn");
const backButtons = document.querySelectorAll(".back-btn");
const paymentLinks = document.querySelectorAll(".payment-option");
const submitBtn = document.getElementById("submitBtn");

let currentStep = 0;
let paymentInProgress = false;

// ----------------------
// Show section
// ----------------------
function showSection(index) {
  sections.forEach((sec, i) => sec.classList.toggle("active", i === index));
  progressBar.style.width = `${((index + 1) / sections.length) * 100}%`;

  if (sections[index].querySelector("#certificatePreview")) updateCertificatePreview();
}
showSection(currentStep);

// ----------------------
// Handle payment links
// ----------------------
paymentLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    paymentInProgress = true;
    console.log("💳 Payment link clicked — waiting for user to return.");

    // Temporarily show a message overlay
    const msg = document.createElement("div");
    msg.id = "payment-overlay";
    msg.textContent = "Processing Payment... Please return after completing checkout.";
    Object.assign(msg.style, {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background: "rgba(255,255,255,0.95)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "1.2rem",
      zIndex: 9999,
      color: "#333",
      textAlign: "center",
      padding: "20px",
    });
    document.body.appendChild(msg);
  });
});

// Detect when user returns to the tab (focus restored)
window.addEventListener("focus", () => {
  if (paymentInProgress) {
    paymentInProgress = false;
    console.log("✅ User returned from payment — unlocking submit.");
    document.getElementById("payment-overlay")?.remove();
    submitBtn.disabled = false;
  }
});

// Disable submit until payment completed
if (submitBtn) submitBtn.disabled = true;

// ----------------------
// Continue button logic
// ----------------------
continueButtons.forEach((btn) => {
  btn.addEventListener("click", async () => {
    if (btn.id === "submitBtn") {
      if (paymentInProgress) {
        alert("Please complete your payment first.");
        return;
      }
      await handleSubmit();
      return;
    }

    currentStep++;
    showSection(currentStep);
  });
});

// ----------------------
// Back button logic
// ----------------------
backButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    currentStep = Math.max(0, currentStep - 1);
    showSection(currentStep);
  });
});

// ----------------------
// Handle “Other” leave
// ----------------------
const otherRadio = document.getElementById("other");
const otherLeaveField = document.getElementById("otherLeaveField");
if (otherRadio) {
  otherRadio.addEventListener("change", () => (otherLeaveField.style.display = "block"));
}
document.querySelectorAll("input[name='leaveFrom']").forEach((radio) => {
  if (radio.id !== "other") {
    radio.addEventListener("change", () => (otherLeaveField.style.display = "none"));
  }
});

// ----------------------
// Date validation
// ----------------------
const fromDate = document.getElementById("fromDate");
const toDate = document.getElementById("toDate");
const dateError = document.getElementById("dateError");

if (fromDate && toDate) {
  toDate.addEventListener("change", () => {
    const start = new Date(fromDate.value);
    const end = new Date(toDate.value);
    const today = new Date();
    const diffDays = (end - start) / (1000 * 60 * 60 * 24);
    if (start < today.setDate(today.getDate() - 7)) {
      dateError.textContent = "Start date cannot be more than 7 days ago.";
      dateError.style.display = "block";
    } else if (diffDays > 5) {
      dateError.textContent = "Duration cannot exceed 5 days.";
      dateError.style.display = "block";
    } else {
      dateError.style.display = "none";
    }
  });
}

// ----------------------
// Form submission
// ----------------------
async function handleSubmit() {
  const payload = {
    certType: document.querySelector("input[name='certType']:checked")?.value,
    leaveFrom: document.querySelector("input[name='leaveFrom']:checked")?.value,
    reason: document.querySelector("input[name='reason']:checked")?.value,
    email: document.getElementById("email")?.value,
    firstName: document.getElementById("firstName")?.value,
    lastName: document.getElementById("lastName")?.value,
    dob: document.getElementById("dob")?.value,
    mobile: document.getElementById("mobile")?.value,
    gender: document.querySelector("input[name='gender']:checked")?.value,
    address: document.getElementById("address")?.value,
    city: document.getElementById("city")?.value,
    state: document.getElementById("state")?.value,
    postcode: document.getElementById("postcode")?.value,
    fromDate: document.getElementById("fromDate")?.value,
    toDate: document.getElementById("toDate")?.value,
    symptoms: document.getElementById("symptoms")?.value,
    doctorNote: document.getElementById("doctorNote")?.value,
  };

  console.log("📤 Submitting data:", payload);

  try {
    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (data.success) {
      console.log("✅ Submission successful:", data);
      currentStep++;
      showSection(currentStep);
    } else {
      alert("❌ There was a problem submitting your request.");
    }
  } catch (err) {
    console.error("❌ Submission error:", err);
    alert("Network error: Unable to reach the server.");
  }
}

// ----------------------
// Live certificate preview
// ----------------------
function updateCertificatePreview() {
  const preview = document.getElementById("certificatePreview");
  if (!preview) return;

  const certType = document.querySelector("input[name='certType']:checked")?.value;
  const firstName = document.getElementById("firstName")?.value || "First Name";
  const lastName = document.getElementById("lastName")?.value || "Last Name";
  const fromDateVal = document.getElementById("fromDate")?.value;
  const toDateVal = document.getElementById("toDate")?.value;

  preview.innerHTML = `
    <strong>Type:</strong> ${certType}<br>
    <strong>Name:</strong> ${firstName} ${lastName}<br>
    <strong>From:</strong> ${fromDateVal || "-"}<br>
    <strong>To:</strong> ${toDateVal || "-"}
  `;
}

document.querySelectorAll("input, textarea, select").forEach((el) =>
  el.addEventListener("input", updateCertificatePreview)
);
