const express = require("express");
const router = express.Router();
const {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
} = require("../controllers/eventController");
const { protect, authorize, optionalAuth } = require("../middleware/auth");
const upload = require("../middleware/upload");

// Public browsing
router.get("/", getEvents);
router.get("/:id", optionalAuth, getEventById);

// Admin-only management
router.post("/", protect, authorize("admin"), upload.single("image"), createEvent);
router.put("/:id", protect, authorize("admin"), upload.single("image"), updateEvent);
router.delete("/:id", protect, authorize("admin"), deleteEvent);

// Student-only registration
router.post("/:id/register", protect, authorize("student"), registerForEvent);

module.exports = router;
