// ---------- VividMedi Backend (Brevo Email + CORS Enabled) ----------

import express from "express";
import bodyParser from "body-parser";
import nodemailer from "nodemailer";
import fs from "fs";
import cors from "cors";

const app = express();

// ✅ Restrict to your frontend domains only
app.use(cors({
  origin: ["https://vividmedi.onrender.com", "https://www.vividmedi.com", "https://vividmedi.com"],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(bodyParser.json());

// ---------- Health Check ----------
app.get("/", (req, res) => {
  res.send("✅ VividMedi backend running fine (Brevo email + CORS enabled)");
});

// ---------- Patient Form Submission ----------
app.post("/api/submit", async (req, res) => {
  const data = req.body;
  const timestamp = new Date().toISOString();

  console.log("📩 Patient submission received:");
  console.log(JSON.stringify(data, null, 2));

  try {
    fs.appendFileSync("submissions.log", `${timestamp} ${JSON.stringify(data)}\n`);
  } catch (e) {
    console.warn("⚠️ Could not write to log file:", e.message);
  }

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.ADMIN_EMAIL,
        pass: process.env.BREVO_API_KEY
      }
    });

    // ---------- Email to Admin ----------
    const adminMail = {
      from: `"${process.env.ADMIN_NAME}" <${process.env.ADMIN_EMAIL}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `🩺 New VividMedi Submission - ${data.firstName} ${data.lastName}`,
      html: `
        <h2 style="color:#005bab;">🩺 New Medical Certificate Request</h2>
        <p><strong>Name:</strong> ${data.firstName} ${data.lastName}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Reason:</strong> ${data.reason}</p>
        <p><strong>Dates:</strong> ${data.fromDate} → ${data.toDate}</p>
        <hr>
        <pre>${JSON.stringify(data, null, 2)}</pre>
        <p style="font-size:12px;color:#777;">Sent automatically by the VividMedi backend on ${new Date().toLocaleString()}</p>
      `
    };

    await transporter.sendMail(adminMail);
    console.log("📤 Brevo email notification sent to admin!");

    // ---------- Confirmation to Patient ----------
    if (data.email) {
      const patientMail = {
        from: `"${process.env.ADMIN_NAME}" <${process.env.ADMIN_EMAIL}>`,
        to: data.email,
        subject: "✅ VividMedi medical certificate request received",
        html: `
          <h2 style="color:#005bab;">Hi ${data.firstName},</h2>
          <p>Your medical certificate request has been received and is being reviewed by a registered doctor.</p>
          <p>You’ll be notified shortly if any further details are needed.</p>
          <p><strong>Requested Dates:</strong> ${data.fromDate} → ${data.toDate}</p>
          <hr>
          <p style="font-size:12px;color:#777;">Sent by VividMedi Health | ${new Date().toLocaleString()}</p>
        `
      };

      await transporter.sendMail(patientMail);
      console.log(`📧 Confirmation sent to patient: ${data.email}`);
    }

  } catch (error) {
    console.error("⚠️ Email send failed via Brevo:", error.message);
  }

  res.json({
    success: true,
    message: "✅ Patient details received successfully and emails sent."
  });
});

// ---------- Start Server ----------
const PORT = process.env.PORT || 1000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
