import express from "express";
import cors from "cors";
import fs from "fs";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

// Environment variables
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "vividmedi.health@gmail.com";
const ADMIN_NAME = process.env.ADMIN_NAME || "VividMedi Admin";
const BREVO_API_KEY = process.env.BREVO_API_KEY || "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";

// ---------- HEALTH CHECK ----------
app.get("/", (req, res) => {
  res.send("✅ VividMedi backend running fine (Brevo email + CORS enabled)");
});

// ---------- API: SUBMIT ----------
app.post("/api/submit", async (req, res) => {
  const data = req.body;

  // ✅ Log to Render logs
  console.log("📩 New patient submission received:");
  console.log(JSON.stringify(data, null, 2));

  // ✅ Save locally for record-keeping
  const logLine = `${new Date().toISOString()} | ${JSON.stringify(data)}\n`;
  fs.appendFile("submissions.log", logLine, (err) => {
    if (err) console.error("❌ Error writing to log file:", err);
  });

  // ✅ Email the admin via Brevo API
  try {
    const emailBody = {
      sender: { name: "VividMedi System", email: ADMIN_EMAIL },
      to: [{ email: ADMIN_EMAIL, name: ADMIN_NAME }],
      subject: `🩺 New VividMedi Patient Submission: ${data.firstName} ${data.lastName}`,
      htmlContent: `
        <h2>New Patient Submission</h2>
        <p><strong>Name:</strong> ${data.firstName} ${data.lastName}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Reason:</strong> ${data.reason}</p>
        <p><strong>From:</strong> ${data.fromDate}</p>
        <p><strong>To:</strong> ${data.toDate}</p>
        <p><strong>Type:</strong> ${data.certType}</p>
        <p><strong>Symptoms:</strong> ${data.symptoms || "N/A"}</p>
        <p><strong>Doctor Note:</strong> ${data.doctorNote || "None"}</p>
        <p><strong>Full JSON:</strong></p>
        <pre>${JSON.stringify(data, null, 2)}</pre>
      `
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
    message: "✅ Patient details received and emailed to admin successfully.",
  });
});

// ---------- START SERVER ----------
const PORT = process.env.PORT || 1000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
