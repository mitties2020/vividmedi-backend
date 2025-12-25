app.get("/api/test", async (req, res) => {
  console.log("🧪 /api/test route triggered");

  try {
    const testPDF = new PDFDocument();
    const filename = `vividmedi_test_certificate_${Date.now()}.pdf`;
    const filepath = `./${filename}`;
    const stream = fs.createWriteStream(filepath);
    testPDF.pipe(stream);

    testPDF.fontSize(18).text("VividMedi Test Medical Certificate", { align: "center" });
    testPDF.moveDown();
    testPDF.fontSize(12).text("This is a test email from your VividMedi backend.");
    testPDF.text("If you received this email, your Brevo SMTP configuration works.");
    testPDF.moveDown();
    testPDF.fontSize(10).text("Issued automatically by the VividMedi backend.");
    testPDF.end();

    stream.on("finish", async () => {
      try {
        console.log("📦 Attempting to send test email...");
        const info = await transporter.sendMail({
          from: `"VividMedi" <${process.env.EMAIL_USER}>`,
          to: process.env.EMAIL_USER,
          subject: "✅ VividMedi Test Certificate",
          text: "This is a test certificate email sent via Brevo SMTP.",
          attachments: [{ filename, path: filepath }],
        });
        console.log("📤 Brevo response:", info);
        res.json({ success: true, message: "✅ Test email sent successfully", info });
      } catch (err) {
        console.error("❌ SMTP Send Error:", err);
        res.status(500).json({ success: false, error: err.message });
      }
    });
  } catch (err) {
    console.error("❌ Route Error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});
