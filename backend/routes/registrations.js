const express = require("express");
const router = express.Router();
const {
  getMyRegistrations,
  cancelRegistration,
} = require("../controllers/registrationController");
const { protect, authorize } = require("../middleware/auth");

router.get("/my", protect, authorize("student"), getMyRegistrations);
router.delete("/:id", protect, cancelRegistration);

module.exports = router;
