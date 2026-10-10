const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Event = require("../models/Event");
const { asyncHandler } = require("../middleware/errorHandler");

// @route GET /api/stats  (public) - numbers shown on the homepage
router.get("/", asyncHandler(async (req, res) => {
  const now = new Date();
  const [totalEvents, totalStudents, upcomingEvents, completedEvents] = await Promise.all([
    Event.countDocuments(),
    User.countDocuments({ role: "student" }),
    Event.countDocuments({ date: { $gte: now }, status: { $ne: "Cancelled" } }),
    Event.countDocuments({ status: "Completed" }),
  ]);
  res.json({ totalEvents, totalStudents, upcomingEvents, completedEvents });
}));

module.exports = router;
