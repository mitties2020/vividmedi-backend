// ============================================
// VividMedi Backend – Minimal + Reliable
// ============================================

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fs from "fs";

console.log("🩺 Initializing Minimal VividMedi Backend...");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// -----------------------------------------------
// 🌐 HEALTH CHECK
// -----------------------------------------------
app.get("/", (req, res) => {
  res.send("✅ VividMedi backend running fine (manual mode)");
});

// -----------------------------------------------
// 📝 PATIENT DATA ENDPOINT
// -----------------------------------------------
app.post("/api/submit", (req, res) => {
  const data = req.body;

  console.log("📥 Received patient submission:");
  console.log(JSON.stringify(data, null, 2));

  // optional: save each submission to a file for later
  const logEntry = `${new Date().toISOString()} — ${JSON.stringify(data)}\n`;
  fs.appendFileSync("patient_submissions.log", logEntry);

  res.json({
    success: true,
    message:
      "✅ Patient details received successfully. (Manual processing on your side.)",
  });
});

// -----------------------------------------------
// 🚀 START SERVER
// -----------------------------------------------
const PORT = process.env.PORT || 3000;
const HOST = "0.0.0.0";
app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
