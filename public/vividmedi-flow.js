// vividmedi-flow.js — Email on Step 7 Continue (one page earlier)
console.log("✅ vividmedi-flow.js loaded successfully");

const sections = document.querySelectorAll(".form-section");
const progressBar = document.querySelector(".progress-bar");
const continueButtons = document.querySelectorAll(".continue-btn:not(#submitBtn)");
const backButtons = document.querySelectorAll(".back-btn");

// Payment buttons in your HTML are .payment-btn with data-link
const paymentButtons = document.querySelectorAll(".payment-btn");

let currentStep = 0;
let paymentStarted = false;

// ✅ configure submit URL
// If frontend + backend are different domains, set this to your Render backend:
// const SUBMIT_URL = "https://YOUR-RENDER-APP.onrender.com/api/submit";
const SUBMIT_URL = "/api/submit";

// ✅ prevent duplicate submission emails
let submissionSent = false;
let submissionResult = null;

// ------------------------------
// Show section
// ------------------------------
function showSection(index) {
  sections.forEach((sec, i) => sec.classList.toggle("active", i === index));
  progressBar.style.width = `${((index + 1) / sections.length) * 100}%`;
}
showSection(currentStep);

// ------------------------------
// Payment overlay
// ------------------------------
const overlay = document.createElement("div");
overlay.style.cssText = `
  position: fixed;
  top:0;left:0;width:100%;height:100%;
  background:rgba(255,255,255,0.8);
  display:none;
  align-items:center;
  justify-content:center;
  font-size:1.2rem;
  color:#111;
  z-index:9999;
`;
overlay.innerHTML = "Processing... please wait";
document.body.appendChild(overlay);

// ------------------------------
// Build payload from form
// ------------------------------
function buildPayload() {
  return {
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
}

// ------------------------------
// Submit to backend (send email)
// ------------------------------
async function sendSubmissionOnce() {
  if (submissionSent) return submissionResult; // already sent successfully

  const payload = buildPayload();

  // (Optional) basic safety check so you don't email blanks
  if (!payload.email || !payload.firstName || !payload.lastName || !payload.fromDate || !payload.toDate) {
    throw new Error("Missing required fields (email/name/dates).");
  }

  overlay.innerHTML = "Submitting your details...";
  overlay.style.display = "flex";

  const res = await fetch(SUBMIT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  overlay.style.display = "none";

  if (!res.ok || !data?.success) {
    throw new Error(data?.message || "Submission failed.");
  }

  submissionSent = true;
  submissionResult = data; // contains certificateNumber etc.
  console.log("✅ Submission sent (Step 7):", data);
  return data;
}

// ------------------------------
// Continue buttons
// ------------------------------
continueButtons.forEach((btn) => {
  btn.addEventListener("click", async () => {
    // ✅ If we are on Step 7 (index 6), send submission before moving to Step 8
    // Steps are 0-based:
    // 0=Step1, 1=Step2, 2=Step3, 3=Step4, 4=Step5, 5=Step6, 6=Step7, 7=Step8, 8=Step9
    if (currentStep === 6) {
      try {
        await sendSubmissionOnce();
      } catch (err) {
        console.error("❌ Error submitting on Step 7:", err);
        alert("❌ Could not submit your details. Please check required fields and try again.");
        return; // stop progression
      }
    }

    if (currentStep < sections.length - 1) {
      currentStep++;
      showSection(currentStep);
    }
  });
});

// ------------------------------
// Back buttons
// ------------------------------
backButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    currentStep = Math.max(0, currentStep - 1);
    showSection(currentStep);
  });
});

// ------------------------------
// Payment button click (popup)
// ------------------------------
paymentButtons.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();

    const paymentUrl = btn.getAttribute("data-link");
    if (!paymentUrl) {
      alert("❌ Payment link missing.");
      return;
    }

    overlay.innerHTML = "Opening payment... please wait";
    overlay.style.display = "flex";

    try {
      const popup = window.open(paymentUrl, "_blank");
      if (popup) {
        paymentStarted = true;
        setTimeout(() => {
          overlay.style.display = "none";
          alert("✅ Payment window opened. Please complete payment and return here.");
        }, 900);
      } else {
        overlay.style.display = "none";
        alert("⚠️ Please allow pop-ups for this site to open the payment window.");
      }
    } catch (err) {
      overlay.style.display = "none";
      alert("❌ Error opening payment window. Please try again.");
      console.error(err);
    }
  });
});

// ------------------------------
// OPTIONAL: If you still have a #submitBtn somewhere, disable it
// (since submission is now Step 7)
// ------------------------------
const submitBtn = document.getElementById("submitBtn");
if (submitBtn) {
  submitBtn.style.display = "none";
}
