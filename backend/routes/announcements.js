const express = require("express");
const router = express.Router();
const {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
} = require("../controllers/announcementController");
const { protect, authorize } = require("../middleware/auth");

router.get("/", getAnnouncements);
router.post("/", protect, authorize("admin"), createAnnouncement);
router.delete("/:id", protect, authorize("admin"), deleteAnnouncement);

module.exports = router;
