import express from "express";
import cors from "cors";
import fs from "fs";

const app = express();
app.use(cors());
app.use(express.json());

// ---------- Health Check ----------
app.get("/", (req, res) => res.send("✅ VividMedi backend running fine (Brevo email + CORS enabled)"));

// ---------- Submission Endpoint ----------
app.post("/api/submit", async (req, res) => {
  const data = req.body;
  console.log("📩 Received patient submission:", data);

  // Append to local file
  const logLine = `${new Date().toISOString()} | ${JSON.stringify(data)}\n`;
  fs.appendFile("submissions.log", logLine, (err) => {
    if (err) console.error("❌ Error writing log file:", err);
  });

  // Respond to frontend
  res.json({
    success: true,
    message: "✅ Patient details received successfully and logged for review.",
  });
});

// ---------- Start Server ----------
const PORT = process.env.PORT || 1000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
