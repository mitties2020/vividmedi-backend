// vividmedi-flow.js
console.log("✅ vividmedi-flow.js loaded successfully");

// Select all the form sections
const sections = document.querySelectorAll(".form-section");
const progressBar = document.querySelector(".progress-bar");
const continueButtons = document.querySelectorAll(".continue-btn");
const backButtons = document.querySelectorAll(".back-btn");

let currentStep = 0;

// Function to update the visible form section
function showSection(index) {
  sections.forEach((sec, i) => {
    sec.classList.toggle("active", i === index);
  });
  progressBar.style.width = `${((index + 1) / sections.length) * 100}%`;
}

showSection(currentStep);

// Handle Continue button clicks
continueButtons.forEach((btn) => {
  btn.addEventListener("click", async () => {
    if (currentStep === sections.length - 2) {
      // Final submit step (Payment → Submit)
      handleSubmit();
      return;
    }
    currentStep++;
    showSection(currentStep);
  });
});

// Handle Back button clicks
backButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    currentStep = Math.max(0, currentStep - 1);
    showSection(currentStep);
  });
});

// Handle "Other" leave field visibility
const otherRadio = document.getElementById("other");
const otherLeaveField = document.getElementById("otherLeaveField");
if (otherRadio) {
  otherRadio.addEventListener("change", () => {
    otherLeaveField.style.display = "block";
  });
}
document.querySelectorAll("input[name='leaveFrom']").forEach((radio) => {
  if (radio.id !== "other") {
    radio.addEventListener("change", () => {
      otherLeaveField.style.display = "none";
    });
  }
});

// Validate leave dates
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

// Handle form submission
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

      // Optionally show MEDC code in console for verification testing
      console.log("🔢 Generated MEDC Code:", data.medcCode);
    } else {
      alert("❌ There was a problem submitting your request.");
    }
  } catch (err) {
    console.error("❌ Submission error:", err);
    alert("Network error: Unable to reach the server.");
  }
}

// Generate the live certificate preview
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

// Update preview dynamically when user edits fields
document.querySelectorAll("input, textarea, select").forEach((el) => {
  el.addEventListener("input", updateCertificatePreview);
});
