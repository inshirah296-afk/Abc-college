const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const { getStudents, deleteStudent, getDashboardStats, getReports } = require("../controllers/adminController");
const {
  getAllRegistrations,
  updateRegistrationStatus,
} = require("../controllers/registrationController");

// Every route in this file is admin-only
router.use(protect, authorize("admin"));

router.get("/dashboard-stats", getDashboardStats);
router.get("/students", getStudents);
router.delete("/students/:id", deleteStudent);
router.get("/registrations", getAllRegistrations);
router.put("/registrations/:id/status", updateRegistrationStatus);
router.get("/reports", getReports);

module.exports = router;
