import express from "express";
import cors from "cors";
import fs from "fs";
import fetch from "node-fetch";
import path from "path";

// ================================
// INIT APP
// ================================
const app = express();

// ================================
// ✅ DO NOT REDIRECT OPTIONS (CORS PREFLIGHT)
// ================================
app.use((req, res, next) => {
  if (req.method === "OPTIONS") return next();
  next();
});

// ================================
// ✅ CORS CONFIG
// ================================
const allowedOrigins = [
  "https://vividmedi.com",
  "https://www.vividmedi.com",
  "https://vividmedi.onrender.com",
];

app.use(
  cors({
    origin: function (origin, cb) {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("CORS blocked: " + origin));
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

app.options("*", cors());
app.use(express.json());

// ================================
// ENV VARS
// ================================
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "support@vividmedi.com";
const ADMIN_NAME = process.env.ADMIN_NAME || "VividMedi Support";
const BREVO_API_KEY = process.env.BREVO_API_KEY;

// ================================
// HELPER: UNIQUE CERT CODE
// ================================
function generateCertCode() {
  const STORAGE_PATH = path.join(process.cwd(), "certificates.json");

  let existingCodes = [];
  if (fs.existsSync(STORAGE_PATH)) {
    const fileData = fs.readFileSync(STORAGE_PATH, "utf-8");
    if (fileData.trim()) {
      existingCodes = JSON.parse(fileData).map(c => c.certificateNumber);
    }
  }

  let newCode;
  do {
    newCode = "MEDC" + Math.floor(100000 + Math.random() * 900000);
  } while (existingCodes.includes(newCode));

  return newCode;
}

// ================================
// HEALTH CHECK
// ================================
app.get("/", (req, res) => {
  res.send("✅ VividMedi backend running (CORS + email OK)");
});

// ================================
// SUBMIT PATIENT DATA
// ================================
app.post("/api/submit", async (req, res) => {
  const data = req.body;

  const certificateNumber = generateCertCode();

  const certData = {
    ...data,
    certificateNumber,
    issuedAt: new Date().toISOString(),
  };

  console.log("📩 New patient submission:");
  console.log(certData);

  // ----------------
  // SAVE LOCALLY
  // ----------------
  const certFile = path.join(process.cwd(), "certificates.json");
  let existingCerts = [];
  if (fs.existsSync(certFile)) {
    const fileData = fs.readFileSync(certFile, "utf-8");
    if (fileData.trim()) existingCerts = JSON.parse(fileData);
  }
  existingCerts.push(certData);
  fs.writeFileSync(certFile, JSON.stringify(existingCerts, null, 2));

  fs.appendFileSync(
    "submissions.log",
    `${new Date().toISOString()} | ${JSON.stringify(certData)}\n`
  );

  // ----------------
  // SEND EMAIL
  // ----------------
  try {
    const age = data.dob
      ? Math.floor(
          (Date.now() - new Date(data.dob).getTime()) /
            (365.25 * 24 * 60 * 60 * 1000)
        )
      : "N/A";

    const emailBody = {
      sender: { name: "VividMedi System", email: ADMIN_EMAIL },
      to: [{ email: ADMIN_EMAIL, name: ADMIN_NAME }],
      subject: `🩺 New VividMedi Submission – ${data.firstName} ${data.lastName} (${certificateNumber})`,
      htmlContent: `
        <h2>New Medical Certificate Request</h2>

        <h3>Patient Details</h3>
        <p><strong>Name:</strong> ${data.firstName} ${data.lastName}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Mobile:</strong> ${data.mobile || "N/A"}</p>
        <p><strong>DOB:</strong> ${data.dob || "N/A"}</p>
        <p><strong>Age:</strong> ${age}</p>
        <p><strong>Gender:</strong> ${data.gender || "N/A"}</p>

        <h3>Address</h3>
        <p>${data.address || "N/A"}</p>
        <p>${data.city || ""} ${data.state || ""} ${data.postcode || ""}</p>

        <h3>Certificate Request</h3>
        <p><strong>Certificate Type:</strong> ${data.certType}</p>
        <p><strong>Leave From:</strong> ${data.leaveFrom}
          ${data.leaveFrom === "Other" && data.otherLeave ? `(${data.otherLeave})` : ""}
        </p>
        <p><strong>Reason:</strong> ${data.reason}</p>
        <p><strong>Dates:</strong> ${data.fromDate} → ${data.toDate}</p>
        <p><strong>Symptoms:</strong> ${data.symptoms || "N/A"}</p>
        <p><strong>Doctor Note:</strong> ${data.doctorNote || "None"}</p>

        <hr />
        <p><strong>Certificate Number:</strong> ${certificateNumber}</p>
        <p>
          Verify:
          <a href="https://vividmedi.com/verify/${certificateNumber}">
            https://vividmedi.com/verify/${certificateNumber}
          </a>
        </p>

        <hr />
        <details>
          <summary>Raw submission data</summary>
          <pre style="white-space:pre-wrap">${JSON.stringify(certData, null, 2)}</pre>
        </details>
      `,
    };

    await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify(emailBody),
    });
  } catch (err) {
    console.error("❌ Email send error:", err);
  }

  res.json({
    success: true,
    certificateNumber,
  });
});

// ================================
// VERIFY CERTIFICATE
// ================================
app.get("/api/verify/:certCode", (req, res) => {
  const certFile = path.join(process.cwd(), "certificates.json");

  if (!fs.existsSync(certFile)) {
    return res.status(404).json({ valid: false });
  }

  const certs = JSON.parse(fs.readFileSync(certFile, "utf-8"));
  const cert = certs.find(c => c.certificateNumber === req.params.certCode);

  if (!cert) {
    return res.status(404).json({ valid: false });
  }

  res.json({
    valid: true,
    certificate: cert,
  });
});

// ================================
// START SERVER
// ================================
const PORT = process.env.PORT || 1000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
