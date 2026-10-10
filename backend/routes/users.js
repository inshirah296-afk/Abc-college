const express = require("express");
const router = express.Router();
const { updateProfile, changePassword } = require("../controllers/userController");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");

router.put("/profile", protect, upload.single("profileImage"), updateProfile);
router.put("/password", protect, changePassword);

module.exports = router;
