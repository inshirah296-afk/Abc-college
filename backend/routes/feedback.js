const express = require("express");
const router = express.Router();
const { submitFeedback, getFeedbackForEvent } = require("../controllers/feedbackController");
const { protect, authorize } = require("../middleware/auth");

router.post("/", protect, authorize("student"), submitFeedback);
router.get("/:eventId", protect, authorize("admin"), getFeedbackForEvent);

module.exports = router;
