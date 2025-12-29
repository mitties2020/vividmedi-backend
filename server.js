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
// 🔐 FORCE CANONICAL DOMAIN
// onrender.com → vividmedi.com
// ================================
app.use((req, res, next) => {
  const host = (req.headers.host || "").toLowerCase();

  if (host.includes("onrender.com")) {
    return res.redirect(301, "https://vividmedi.com" + req.originalUrl);
  }

  next();
});

// ================================
// ✅ FIX: CORS + PREFLIGHT (IMPORTANT)
// Allows calls from vividmedi.com + www + onrender + local dev
// ================================
const allowedOrigins = [
  "https://vividmedi.com",
  "https://www.vividmedi.com",
  "https://vividmedi.onrender.com",
  "http://localhost:3000",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: function (origin, cb) {
      // allow server-to-server / curl / same-origin with no Origin header
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("CORS blocked: " + origin));
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

// ✅ answer preflight requests (this is what was hanging you)
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
// HELPER: UNIQUE CERT CODE
// ================================
function generateCertCode() {
  const STORAGE_PATH = path.join(process.cwd(), "certificates.json");

  let existingCodes = [];
  if (fs.existsSync(STORAGE_PATH)) {
    const fileData = fs.readFileSync(STORAGE_PATH, "utf-8");
    if (fileData.trim()) {
      existingCodes = JSON.parse(fileData).map((c) => c.certificateNumber);
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
  res.send("✅ VividMedi backend running (canonical redirect active)");
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

  console.log("📩 New submission:");
  console.log(certData);

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
          <a href="https://vividmedi.com/verify/${certificateNumber}">
            https://vividmedi.com/verify/${certificateNumber}
          </a>
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
  const certFile = path.join(process.cwd(), "certificates.json");

  if (!fs.existsSync(certFile)) {
    return res.status(404).json({ valid: false });
  }

  const certs = JSON.parse(fs.readFileSync(certFile, "utf-8"));
  const cert = certs.find((c) => c.certificateNumber === req.params.certCode);

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
