const Announcement = require("../models/Announcement");
const { asyncHandler } = require("../middleware/errorHandler");

// @route  GET /api/announcements
const getAnnouncements = asyncHandler(async (req, res) => {
  const announcements = await Announcement.find().sort({ createdAt: -1 }).limit(20);
  res.json({ announcements });
});

// @route  POST /api/announcements   (admin only)
const createAnnouncement = asyncHandler(async (req, res) => {
  const { title, description, priority } = req.body;
  if (!title || !description) {
    res.statusCode = 400;
    throw new Error("Title and description are required.");
  }
  const announcement = await Announcement.create({
    title,
    description,
    priority: priority || "Normal",
    createdBy: req.user._id,
  });
  res.status(201).json({ announcement });
});

// @route  DELETE /api/announcements/:id   (admin only)
const deleteAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findByIdAndDelete(req.params.id);
  if (!announcement) {
    res.statusCode = 404;
    throw new Error("Announcement not found.");
  }
  res.json({ message: "Announcement deleted." });
});

module.exports = { getAnnouncements, createAnnouncement, deleteAnnouncement };
