const User = require("../models/User");
const Event = require("../models/Event");
const Registration = require("../models/Registration");
const Feedback = require("../models/Feedback");
const { asyncHandler } = require("../middleware/errorHandler");

// @route  GET /api/admin/students
const getStudents = asyncHandler(async (req, res) => {
  const { search, department, year } = req.query;
  const query = { role: "student" };
  if (department) query.department = department;
  if (year) query.year = year;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { studentId: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }
  const students = await User.find(query).sort({ createdAt: -1 });
  res.json({ students });
});

// @route  DELETE /api/admin/students/:id
const deleteStudent = asyncHandler(async (req, res) => {
  const student = await User.findOneAndDelete({ _id: req.params.id, role: "student" });
  if (!student) {
    res.statusCode = 404;
    throw new Error("Student not found.");
  }
  await Registration.deleteMany({ student: student._id });
  res.json({ message: "Student removed." });
});

// @route  GET /api/admin/dashboard-stats
const getDashboardStats = asyncHandler(async (req, res) => {
  const now = new Date();

  const [
    totalStudents,
    totalEvents,
    upcomingEvents,
    completedEvents,
    totalRegistrations,
    recentRegistrations,
    registrationsByCategory,
    monthlyRegistrations,
  ] = await Promise.all([
    User.countDocuments({ role: "student" }),
    Event.countDocuments(),
    Event.countDocuments({ date: { $gte: now }, status: { $ne: "Cancelled" } }),
    Event.countDocuments({ status: "Completed" }),
    Registration.countDocuments({ status: { $ne: "Cancelled" } }),
    Registration.find()
      .populate("student", "name studentId department")
      .populate("event", "title date")
      .sort({ createdAt: -1 })
      .limit(8),
    Event.aggregate([
      {
        $lookup: {
          from: "registrations",
          localField: "_id",
          foreignField: "event",
          as: "regs",
        },
      },
      { $group: { _id: "$category", count: { $sum: { $size: "$regs" } } } },
      { $sort: { count: -1 } },
    ]),
    Registration.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 12 },
    ]),
  ]);

  res.json({
    totalStudents,
    totalEvents,
    upcomingEvents,
    completedEvents,
    totalRegistrations,
    recentRegistrations,
    registrationsByCategory,
    monthlyRegistrations,
  });
});

// @route  GET /api/admin/reports
const getReports = asyncHandler(async (req, res) => {
  const events = await Event.find().sort({ date: -1 });
  const report = await Promise.all(
    events.map(async (event) => {
      const registeredCount = await Registration.countDocuments({
        event: event._id,
        status: { $ne: "Cancelled" },
      });
      const feedbacks = await Feedback.find({ event: event._id });
      const avgRating =
        feedbacks.length > 0
          ? (feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length).toFixed(1)
          : null;
      return {
        eventId: event._id,
        title: event.title,
        category: event.category,
        date: event.date,
        status: event.status,
        maxParticipants: event.maxParticipants,
        registeredCount,
        feedbackCount: feedbacks.length,
        averageRating: avgRating,
      };
    })
  );
  res.json({ report });
});

module.exports = { getStudents, deleteStudent, getDashboardStats, getReports };
