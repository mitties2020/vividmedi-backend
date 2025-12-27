// vividmedi-flow.js
console.log("✅ vividmedi-flow.js loaded successfully");

// ------------------------------
// DOM elements
// ------------------------------
const sections = document.querySelectorAll(".form-section");
const progressBar = document.querySelector(".progress-bar");
const continueButtons = document.querySelectorAll(".continue-btn:not(#submitBtn)");
const backButtons = document.querySelectorAll(".back-btn");
const submitBtn = document.getElementById("submitBtn");
const paymentLinks = document.querySelectorAll(".payment-option");

let currentStep = 0;
let paymentClicked = false;

// ------------------------------
// Show a specific section
// ------------------------------
function showSection(index) {
  sections.forEach((sec, i) => sec.classList.toggle("active", i === index));
  progressBar.style.width = `${((index + 1) / sections.length) * 100}%`;
  if (sections[index].querySelector("#certificatePreview")) updateCertificatePreview();
}
showSection(currentStep);

// ------------------------------
// Handle normal "Continue" buttons
// ------------------------------
continueButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (currentStep < sections.length - 1) {
      currentStep++;
      showSection(currentStep);
    }
  });
});

// ------------------------------
// Handle Back buttons
// ------------------------------
backButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    currentStep = Math.max(0, currentStep - 1);
    showSection(currentStep);
  });
});

// ------------------------------
// Handle Payment Links properly
// ------------------------------
paymentLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.stopPropagation(); // Stop any inherited button behavior
    paymentClicked = true;

    // Open payment link in new tab
    window.open(link.href, "_blank");

    // DO NOT move to the next section automatically
    alert("✅ Your payment window has opened. Please complete the payment, then return here and click Submit to finish.");
  });
});

// ------------------------------
// Handle Submit button only
// ------------------------------
if (submitBtn) {
  submitBtn.addEventListener("click", async () => {
    if (!paymentClicked) {
      alert("Please complete your payment first.");
      return;
    }
    await handleSubmit();
  });
}

// ------------------------------
// Form submission to backend
// ------------------------------
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

// ------------------------------
// Certificate preview updates live
// ------------------------------
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
