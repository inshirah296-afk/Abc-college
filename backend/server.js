require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const connectDB = require("./config/db");
const { errorHandler } = require("./middleware/errorHandler");

// Route files
const authRoutes = require("./routes/auth");
const eventRoutes = require("./routes/events");
const registrationRoutes = require("./routes/registrations");
const announcementRoutes = require("./routes/announcements");
const feedbackRoutes = require("./routes/feedback");
const categoryRoutes = require("./routes/categories");
const userRoutes = require("./routes/users");
const adminRoutes = require("./routes/admin");
const statsRoutes = require("./routes/stats");

connectDB();

const app = express();

// Allow the frontend (served from a different origin/port) to call this API
const allowedOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like local file:// pages or curl/postman)
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Serve uploaded event/profile images statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/stats", statsRoutes);

app.get("/api/health", (req, res) => res.json({ status: "ABC College API is running" }));

// 404 handler for unknown API routes
app.use("/api", (req, res) => res.status(404).json({ message: "API route not found." }));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`ABC College API server running on port ${PORT}`));
