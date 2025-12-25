// ============================================
// VividMedi Backend — Stable Railway Version
// ============================================

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fs from "fs";
import PDFDocument from "pdfkit";
import nodemailer from "nodemailer";

console.log("🩺 Initializing Express server...");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// -----------------------------------------------
// 💌 Brevo SMTP Transport Configuration
// -----------------------------------------------
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false, // STARTTLS auto-upgrade
  auth: {
    user: process.env.EMAIL_USER, // your Brevo login email
    pass: process.env.EMAIL_PASS, // your Brevo SMTP key
  },
});

// -----------------------------------------------
// 🧪 TEST ROUTE — verifies email setup
// -----------------------------------------------
app.get("/api/test", async (req, res) => {
  try {
    console.log("🧪 /api/test route hit");

    const testPDF = new PDFDocument();
    const filename = `vividmedi_test_certificate_${Date.now()}.pdf`;
    const filepath = `./${filename}`;
    const stream = fs.createWriteStream(filepath);
    testPDF.pipe(stream);

    testPDF.fontSize(18).text("VividMedi Test Medical Certificate", { align: "center" });
    testPDF.moveDown();
    testPDF.fontSize(12).text("This is a test email from your VividMedi backend.");
    testPDF.text("If you received this, your Brevo SMTP configuration works correctly.");
    testPDF.moveDown();
    testPDF.fontSize(10).text("Issued automatically by the VividMedi backend.");
    testPDF.end();

    stream.on("finish", async () => {
      try {
        const info = await transporter.sendMail({
          from: `"VividMedi" <${process.env.EMAIL_USER}>`,
          to: process.env.EMAIL_USER,
          subject: "✅ VividMedi Test Certificate",
          text: "This is a test certificate email sent via Brevo SMTP.",
          attachments: [{ filename, path: filepath }],
        });
        console.log("📤 Test email sent:", info.response);
        res.json({ success: true, message: "✅ Test email sent successfully", info });
      } catch (err) {
        console.error("❌ Email send error:", err);
        res.status(500).json({ success: false, message: "Email failed", error: err.message });
      }
    });
  } catch (err) {
    console.error("❌ Error in /api/test:", err);
    res.status(500).json({ success: false, message: "Test route error", error: err.message });
  }
});

// -----------------------------------------------
// 🩺 MAIN SUBMIT ROUTE — sends real certificates
// -----------------------------------------------
app.post("/api/submit", async (req, res) => {
  try {
    const data = req.body;
    console.log("📥 Received patient data:", data);

    const doc = new PDFDocument();
    const filename = `medical_certificate_${Date.now()}.pdf`;
    const filepath = `./${filename}`;
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // ---------- PDF CONTENT ----------
    doc.fontSize(18).text("VividMedi Medical Certificate", { align: "center" });
    doc.moveDown();
    doc.fontSize(12);
    doc.text(`Name: ${data.firstName} ${data.lastName}`);
    doc.text(`Date of Birth: ${data.dob}`);
    doc.text(`Email: ${data.email}`);
    doc.text(`Mobile: ${data.mobile}`);
    doc.moveDown();
    doc.text(`Type of Leave: ${data.certType}`);
    doc.text(`Leave From: ${data.fromDate}`);
    doc.text(`Leave To: ${data.toDate}`);
    doc.moveDown();
    doc.text(`Reason: ${data.reason}`);
    doc.moveDown();
    doc.text(`Symptoms: ${data.symptoms || "N/A"}`);
    doc.moveDown();
    doc.text(`Doctor Notes: ${data.doctorNote || "N/A"}`);
    doc.moveDown(2);
    doc.fontSize(10).text(
      "This certificate was issued by an AHPRA-registered Australian medical doctor."
    );
    doc.end();

    stream.on("finish", async () => {
      await transporter.sendMail({
        from: `"VividMedi" <${process.env.EMAIL_USER}>`,
        to: data.email,
        subject: "Your VividMedi Medical Certificate",
        text: `Dear ${data.firstName},\n\nAttached is your VividMedi medical certificate.\n\nKind regards,\nVividMedi Medical Team`,
        attachments: [{ filename, path: filepath }],
      });

      console.log("📤 Certificate sent successfully to", data.email);
      res.json({ success: true, message: "Certificate sent successfully" });
    });
  } catch (err) {
    console.error("❌ Error processing certificate:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

// -----------------------------------------------
// 🌐 HEALTH CHECK ROUTE
// -----------------------------------------------
app.get("/", (req, res) => {
  res.send("✅ VividMedi Backend Running");
});

// -----------------------------------------------
// 🚀 START SERVER (keep-alive + bind fix)
// -----------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  setInterval(() => console.log("⏱️ Keep-alive ping... still running"), 1000 * 60 * 5);
});
