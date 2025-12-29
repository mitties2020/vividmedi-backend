// vividmedi-flow.js — Send patient info on Step 7 Continue (LIVE vividmedi.com)
console.log("✅ vividmedi-flow.js loaded successfully (LIVE)");

const sections = document.querySelectorAll(".form-section");
const progressBar = document.querySelector(".progress-bar");
const continueButtons = document.querySelectorAll(".continue-btn:not(#submitBtn)");
const backButtons = document.querySelectorAll(".back-btn");

// Your payment buttons in index.html are: <button class="payment-btn" data-link="...">
const paymentButtons = document.querySelectorAll(".payment-btn");

// ✅ Your Render backend
const SUBMIT_URL = "https://vividmedi-backend.onrender.com/api/submit";

let currentStep = 0;

// Prevent duplicate emails if user goes back/forward
let submissionSent = false;
let submissionResponse = null;

// ------------------------------
// Overlay (simple user feedback)
// ------------------------------
const overlay = document.createElement("div");
overlay.style.cssText = `
  position: fixed;
  top:0;left:0;width:100%;height:100%;
  background:rgba(255,255,255,0.85);
  display:none;
  align-items:center;
  justify-content:center;
  font-size:1.1rem;
  color:#111;
  z-index:9999;
  text-align:center;
  padding:20px;
`;
overlay.textContent = "Working...";
document.body.appendChild(overlay);

// ------------------------------
// Show section
// ------------------------------
function showSection(index) {
  sections.forEach((sec, i) => sec.classList.toggle("active", i === index));
  if (progressBar) progressBar.style.width = `${((index + 1) / sections.length) * 100}%`;
}
showSection(currentStep);

// ------------------------------
// Optional: show/hide “Other” field for leaveFrom
// ------------------------------
function updateOtherLeaveField() {
  const otherRadio = document.getElementById("other");
  const field = document.getElementById("otherLeaveField");
  if (!otherRadio || !field) return;
  field.style.display = otherRadio.checked ? "block" : "none";
}
document.querySelectorAll("input[name='leaveFrom']").forEach((r) => {
  r.addEventListener("change", updateOtherLeaveField);
});
updateOtherLeaveField();

// ------------------------------
// Build payload from form
// ------------------------------
function buildPayload() {
  return {
    certType: document.querySelector("input[name='certType']:checked")?.value || "",
    leaveFrom: document.querySelector("input[name='leaveFrom']:checked")?.value || "",
    otherLeave: document.getElementById("otherLeave")?.value || "",
    reason: document.querySelector("input[name='reason']:checked")?.value || "",
    email: document.getElementById("email")?.value || "",
    firstName: document.getElementById("firstName")?.value || "",
    lastName: document.getElementById("lastName")?.value || "",
    dob: document.getElementById("dob")?.value || "",
    mobile: document.getElementById("mobile")?.value || "",
    gender: document.querySelector("input[name='gender']:checked")?.value || "",
    address: document.getElementById("address")?.value || "",
    city: document.getElementById("city")?.value || "",
    state: document.getElementById("state")?.value || "",
    postcode: document.getElementById("postcode")?.value || "",
    fromDate: document.getElementById("fromDate")?.value || "",
    toDate: document.getElementById("toDate")?.value || "",
    symptoms: document.getElementById("symptoms")?.value || "",
    doctorNote: document.getElementById("doctorNote")?.value || "
