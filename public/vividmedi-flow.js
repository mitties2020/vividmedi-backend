console.log("✅ vividmedi-flow.js loaded successfully (DEBUG)");

const sections = document.querySelectorAll(".form-section");
const progressBar = document.querySelector(".progress-bar");
const continueButtons = document.querySelectorAll(".continue-btn:not(#submitBtn)");
const backButtons = document.querySelectorAll(".back-btn");
const paymentButtons = document.querySelectorAll(".payment-btn");

let currentStep = 0;

const SUBMIT_URL = "https://vividmedi-backend.onrender.com/api/submit";
let submissionSent = false;

function showSection(index) {
  sections.forEach((sec, i) => sec.classList.toggle("active", i === index));
  progressBar.style.width = `${((index + 1) / sections.length) * 100}%`;
  console.log("➡️ showSection:", index, "of", sections.length);
}
showSection(currentStep);

// Overlay
const overlay = document.createElement("div");
overlay.style.cssText = `
  position: fixed; top:0;left:0;width:100%;height:100%;
  background:rgba(255,255,255,0.85);
  display:none; align-items:center; justify-content:center;
  font-size:1.1rem; color:#111; z-index:9999;
`;
overlay.textContent = "Working...";
document.body.appendChild(overlay);

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

async function sendSubmissionOnce() {
  if (submissionSent) {
    console.log("ℹ️ Submission already sent. Skipping.");
    return;
  }

  const payload = buildPayload();
  console.log("📦 Payload about to send:", payload);

  overlay.textContent = "Submitting details...";
  overlay.style.display = "flex";

  let res;
  let text = "";
  try {
    res = await fetch(SUBMIT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      mode: "cors",
    });

    text = await res.text(); // read raw so we can show errors cleanly
  } catch (err) {
    overlay.style.display = "none";
    console.error("❌ Fetch failed:", err);
    alert("❌ Could not reach backend. Check Network/CORS.");
    throw err;
  }

  overlay.style.display = "none";

  console.log("📡 Backend status:", res.status);
  console.log("📨 Backend response text:", text);

  let data = {};
  try { data = JSON.parse(text); } catch (_) {}

  if (!res.ok || !data.success) {
    alert("❌ Submit failed:\n" + (data.message || text || "Unknown error"));
    throw new Error(data.message || "Submit failed");
  }

  submissionSent = true;
  alert("✅ Details submitted. Cert number: " + (data.certificateNumber || "N/A"));
  console.log("✅ Submission OK:", data);
}

// Continue buttons
continueButtons.forEach((btn) => {
  btn.addEventListener("click", async () => {
    console.log("➡️ Continue clicked at step:", currentStep);

    // This is your “Step 7” trigger (0-based index 6)
    if (currentStep === 6) {
      console.log("✅ Step 7 detected — submitting now");
      try {
        await sendSubmissionOnce();
      } catch (e) {
        console.log("🛑 Blocking progression due to submit failure");
        return;
      }
    }

    if (currentStep < sections.length - 1) {
      currentStep++;
      showSection(currentStep);
    }
  });
});

// Back buttons
backButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    currentStep = Math.max(0, currentStep - 1);
    console.log("⬅️ Back clicked. Step now:", currentStep);
    showSection(currentStep);
  });
});

// Payment buttons
paymentButtons.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    const paymentUrl = btn.getAttribute("data-link");
    console.log("💳 Payment clicked:", paymentUrl);

    if (!paymentUrl) {
      alert("❌ Payment link missing.");
      return;
    }
    const popup = window.open(paymentUrl, "_blank");
    if (!popup) alert("⚠️ Please allow pop-ups for this site.");
  });
});
