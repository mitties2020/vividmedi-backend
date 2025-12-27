import express from "express";
import cors from "cors";
import fs from "fs";
import fetch from "node-fetch";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Environment variables (loaded securely from Render)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "vividmedi.health@gmail.com";
const ADMIN_NAME = process.env.ADMIN_NAME || "VividMedi Admin";
const BREVO_API_KEY = process.env.BREVO_API_KEY;

// ---------- Helper: Generate Unique Certificate Code ----------
function generateCertCode() {
  const STORAGE_PATH = path.join(process.cwd(), "certificates.json");

  // Load existing codes
  let existingCodes = [];
  if (fs.existsSync(STORAGE_PATH)) {
    const fileData = fs.readFileSync(STORAGE_PATH, "utf-8");
    if (fileData.trim()) {
      existingCodes = JSON.parse(fileData).map(c => c.certificateNumber);
    }
  }

  // Generate a unique code
  let newCode;
  do {
    newCode = "MEDC" + Math.floor(100000 + Math.random() * 900000);
  } while (existingCodes.includes(newCode));

  return newCode;
}

// ---------- HEALTH CHECK ----------
app.get("/", (req, res) => {
  res.send("✅ VividMedi backend running fine (Brevo email + CORS enabled + Certificate Verification Active)");
});

// ---------- TEST EMAIL ----------
app.get("/api/test-email", async (req, res) => {
  try {
    const testEmail = {
      sender: { name: "VividMedi System", email: ADMIN_EMAIL },
      to: [{ email: ADMIN_EMAIL, name: ADMIN_NAME }],
      subject: "✅ VividMedi Test Email",
      htmlContent: `<p>This is a test email from your VividMedi backend — everything is working fine!</p>`,
    };

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify(testEmail),
    });

    if (response.ok) {
      console.log(`📧 Test email sent successfully to ${ADMIN_EMAIL}`);
      res.send("✅ Test email sent successfully!");
    } else {
      const text = await response.text();
      console.error("❌ Test email failed:", text);
      res.status(500).send("❌ Test email failed: " + text);
    }
  } catch (err) {
    console.error("❌ Error testing email:", err);
    res.status(500).send("❌ Error testing email: " + err.message);
  }
});

// ---------- API: SUBMIT ----------
app.post("/api/submit", async (req, res) => {
  const data = req.body;

  // ✅ Assign a unique certificate code
  const certificateNumber = generateCertCode();

  // ✅ Add metadata
  const certData = {
    ...data,
    certificateNumber,
    issuedAt: new Date().toISOString(),
  };

  console.log("📩 New patient submission received:");
  console.log(JSON.stringify(certData, null, 2));

  // ✅ Save locally for verification
  const certFile = path.join(process.cwd(), "certificates.json");
  let existingCerts = [];
  if (fs.existsSync(certFile)) {
    const fileData = fs.readFileSync(certFile, "utf-8");
    if (fileData.trim()) existingCerts = JSON.parse(fileData);
  }
  existingCerts.push(certData);
  fs.writeFileSync(certFile, JSON.stringify(existingCerts, null, 2));

  // ✅ Also save a text log
  fs.appendFile("submissions.log", `${new Date().toISOString()} | ${JSON.stringify(certData)}\n`, (err) => {
    if (err) console.error("❌ Error writing to log file:", err);
  });

  // ✅ Send admin email via Brevo
  try {
    const emailBody = {
      sender: { name: "VividMedi System", email: ADMIN_EMAIL },
      to: [{ email: ADMIN_EMAIL, name: ADMIN_NAME }],
      subject: `🩺 New VividMedi Submission: ${data.firstName} ${data.lastName} (${certificateNumber})`,
      htmlContent: `
        <h2>New Patient Submission</h2>
        <p><strong>Certificate Number:</strong> ${certificateNumber}</p>
        <p><strong>Name:</strong> ${data.firstName} ${data.lastName}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Reason:</strong> ${data.reason}</p>
        <p><strong>From:</strong> ${data.fromDate}</p>
        <p><strong>To:</strong> ${data.toDate}</p>
        <p><strong>Certificate Type:</strong> ${data.certType}</p>
        <p><strong>Symptoms:</strong> ${data.symptoms || "N/A"}</p>
        <p><strong>Doctor Note:</strong> ${data.doctorNote || "None"}</p>
        <hr />
        <p>This certificate can be verified at:</p>
        <p><a href="https://vividmedi.com/verify/${certificateNumber}">https://vividmedi.com/verify/${certificateNumber}</a></p>
        <hr />
        <pre>${JSON.stringify(certData, null, 2)}</pre>
      `,
    };

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify(emailBody),
    });

    if (response.ok) {
      console.log(`📧 Email sent successfully to ${ADMIN_EMAIL}`);
    } else {
      const text = await response.text();
      console.error("❌ Email sending failed:", text);
    }
  } catch (err) {
    console.error("❌ Error sending email:", err);
  }

  res.json({
    success: true,
    message: "✅ Patient details received, certificate generated, and stored for verification.",
    certificateNumber,
  });
});

// ---------- API: VERIFY CERTIFICATE ----------
app.get("/api/verify/:certCode", (req, res) => {
  const { certCode } = req.params;
  const certFile = path.join(process.cwd(), "certificates.json");

  if (!fs.existsSync(certFile)) {
    return res.status(404).json({ valid: false, message: "No certificates found in database." });
  }

  const certs = JSON.parse(fs.readFileSync(certFile, "utf-8"));
  const cert = certs.find(c => c.certificateNumber === certCode);

  if (!cert) {
    return res.status(404).json({ valid: false, message: "Certificate not found or invalid." });
  }

  res.json({
    valid: true,
    message: "✅ Verified Medical Certificate",
    certificate: {
      certificateNumber: cert.certificateNumber,
      issuedAt: cert.issuedAt,
      patient: `${cert.firstName} ${cert.lastName}`,
      reason: cert.reason,
      fromDate: cert.fromDate,
      toDate: cert.toDate,
      certType: cert.certType,
      clinic: "VividMedi Clinic",
      doctor: "Dr Michael",
      qualifications: "Medical Doctorate",
      ahpraNumber: "MED0002782709",
    },
  });
});

// ---------- START SERVER ----------
const PORT = process.env.PORT || 1000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
