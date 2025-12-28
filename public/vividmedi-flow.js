// vividmedi-flow.js — Square Payment + Step 9 FIX
console.log("✅ vividmedi-flow.js loaded successfully");

const sections = document.querySelectorAll(".form-section");
const progressBar = document.querySelector(".progress-bar");
const continueButtons = document.querySelectorAll(".continue-btn:not(#submitBtn)");
const backButtons = document.querySelectorAll(".back-btn");
const submitBtn = document.getElementById("submitBtn");
const paymentLinks = document.querySelectorAll(".payment-option");

let currentStep = 0;
let paymentStarted = false;

// ------------------------------
// Show section
// ------------------------------
function showSection(index) {
  sections.forEach((sec, i) => sec.classList.toggle("active", i === index));
  progressBar.style.width = `${((index + 1) / sections.length) * 100}%`;
}
showSection(currentStep);

// ------------------------------
// Continue buttons
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
// Back buttons
// ------------------------------
backButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    currentStep = Math.max(0, currentStep - 1);
    showSection(currentStep);
  });
});

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
overlay.innerHTML = "Processing payment... please wait";
document.body.appendChild(overlay);

// ------------------------------
// Payment link click
// ------------------------------
paymentLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();

    overlay.style.display = "flex";
    const paymentUrl = link.getAttribute("href");

    try {
      const popup = window.open(paymentUrl, "_blank");
      if (popup) {
        paymentStarted = true;
        setTimeout(() => {
          overlay.style.display = "none";
          alert("✅ Payment window opened. Please complete payment and return here to click Submit.");
        }, 1000);
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
// Submit handler
// ------------------------------
if (submitBtn) {
  submitBtn.addEventListener("click", async () => {
    if (!paymentStarted) {
      alert("⚠️ Please complete payment before submitting.");
      return;
    }
    await handleSubmit();
  });
}

// ------------------------------
// Submit to backend
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

  try {
    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (data.success) {
      currentStep++;
      showSection(currentStep);
      console.log("✅ Submission success:", data);
    } else {
      alert("❌ Submission failed. Please retry.");
    }
  } catch (err) {
    console.error("❌ Error submitting form:", err);
    alert("❌ Network issue. Please retry.");
  }
}
