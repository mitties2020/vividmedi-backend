import express from "express";
import cors from "cors";
import fs from "fs";
import fetch from "node-fetch";
import path from "path";

// ================================
// INIT APP (MUST COME FIRST)
// ================================
const app = express();

// ================================
// ✅ FIX: DO NOT REDIRECT OPTIONS (CORS PREFLIGHT)
// ================================
app.use((req, res, next) => {
  if (req.method === "OPTIONS") return next();
  next();
});

// ================================
// ✅ CORS + PREFLIGHT
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

// ================================
// MIDDLEWARE
// ================================
app.use(express.json());

// ================================
// ENV VARS
// ================================
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "support@vividmedi.com";
const ADMIN_NAME = process.env.ADMIN_NAME || "VividMedi Support";
const BREVO_API_KEY = process.env.BREVO_API_KEY;

// ================================
// CONSTANTS
// ================================
const CERT_FILE = path.join(process.cwd(), "certificates.json");
const OVERRIDE_CODE = "MEDC199401"; // ✅ always valid

// ================================
// HELPERS
// ================================
function safeReadJsonArray(filePath) {
  try {
    if (!fs.existsSync(filePath)) return [];
    const raw = fs.readFileSync(filePath, "utf-8");
    if (!raw.trim()) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("❌ Failed reading JSON:", e.message);
    return [];
  }
}

function safeWriteJsonArray(filePath, arr) {
  fs.writeFileSync(filePath, JSON.stringify(arr, null, 2));
}

function normaliseCertCode(code) {
  return (code || "").trim().toUpperCase();
}

// ================================
// HELPER: UNIQUE CERT CODE
// ================================
function generateCertCode() {
  const existingCerts = safeReadJsonArray(CERT_FILE);
  const existingCodes = existingCerts.map((c) => normaliseCertCode(c.certificateNumber));

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
  res.send("✅ VividMedi backend running (CORS + preflight OK)");
});

// ================================
// TEST EMAIL
// ================================
app.get("/api/test-email", async (req, res) => {
  try {
    const testEmail = {
      sender: { name: "VividMedi System", email: ADMIN_EMAIL },
      to: [{ email: ADMIN_EMAIL, name: ADMIN_NAME }],
      subject: "✅ VividMedi Test Email",
      htmlContent: `<p>This is a test email from your VividMedi backend.</p>`,
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
      res.send("✅ Test email sent");
    } else {
      const text = await response.text();
      res.status(500).send(text);
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
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

  console.log("📩 New submission:", certData);

  const existingCerts = safeReadJsonArray(CERT_FILE);
  existingCerts.push(certData);
  safeWriteJsonArray(CERT_FILE, existingCerts);

  fs.appendFileSync(
    "submissions.log",
    `${new Date().toISOString()} | ${JSON.stringify(certData)}\n`
  );

  // Email admin (best-effort)
  try {
    const emailBody = {
      sender: { name: "VividMedi System", email: ADMIN_EMAIL },
      to: [{ email: ADMIN_EMAIL, name: ADMIN_NAME }],
      subject: `🩺 New Submission: ${data.firstName} ${data.lastName} (${certificateNumber})`,
      htmlContent: `
        <h2>New Patient Submission</h2>
        <p><strong>Certificate:</strong> ${certificateNumber}</p>
        <p><strong>Name:</strong> ${data.firstName} ${data.lastName}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Reason:</strong> ${data.reason}</p>
        <p><strong>Dates:</strong> ${data.fromDate} → ${data.toDate}</p>
        <p><strong>Symptoms:</strong> ${data.symptoms || "N/A"}</p>
        <hr />
        <p>
          Verify at:
          <a href="https://vividmedi.com/verify">
            https://vividmedi.com/verify
          </a>
          <br/>
          Certificate code: <strong>${certificateNumber}</strong>
        </p>
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
    console.error("❌ Email error:", err);
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
  const certCode = normaliseCertCode(req.params.certCode);

  // ✅ Permanent override FIRST
  if (certCode === OVERRIDE_CODE) {
    return res.status(200).json({
      valid: true,
      certificate: {
        certificateNumber: OVERRIDE_CODE,
        firstName: "Override",
        lastName: "Accepted",
        reason: "Administrative verification override",
        fromDate: "N/A",
        toDate: "N/A",
        issuedAt: new Date().toISOString(),
      },
    });
  }

  const certs = safeReadJsonArray(CERT_FILE);

  const cert = certs.find(
    (c) => normaliseCertCode(c.certificateNumber) === certCode
  );

  if (!cert) {
    return res.status(404).json({ valid: false });
  }

  return res.status(200).json({
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
