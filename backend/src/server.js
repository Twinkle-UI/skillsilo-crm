import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";

// Routes
import dashboardRoutes from "./routes/dashboardRoutes.js";
import leadRoutes from "./routes/leadRoutes.js";
import followUpRoutes from "./routes/followUpRoutes.js";
import settingRoutes from "./routes/settingRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import permissionRoutes from "./routes/permissionRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";

// Load .env variables
dotenv.config();

// Connect to MongoDB Atlas
connectDB();

const app = express();

// ============ Middleware ============
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev")); // request logger

// ============ Routes ============
app.get("/", (req, res) => {
  res.json({
    message: "🚀 Skills E-Learnings CRM API",
    status: "running",
    endpoints: {
      auth: "/api/auth/login",
      dashboard: "/api/dashboard/stats",
      leads: "/api/leads",
      leadFilters: "/api/leads/filters/counts",
      followups: "/api/followups",
      followupFilters: "/api/followups/filters/counts",
      settings: "/api/settings/:type",
      webhooks: "/api/webhooks/meta-leads",
    },
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/followups", followUpRoutes);
app.use("/api/settings", settingRoutes);
app.use("/api/users", userRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/webhooks", webhookRoutes);

// ============ 404 Handler ============
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ============ Error Handler ============
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.stack);
  res.status(500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// ============ Start Server ============
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});