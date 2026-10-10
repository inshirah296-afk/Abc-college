const Registration = require("../models/Registration");
const Event = require("../models/Event");
const { asyncHandler } = require("../middleware/errorHandler");

// @route  GET /api/registrations/my   (student only)
const getMyRegistrations = asyncHandler(async (req, res) => {
  const registrations = await Registration.find({ student: req.user._id })
    .populate("event")
    .sort({ createdAt: -1 });
  res.json({ registrations });
});

// @route  DELETE /api/registrations/:id   (student cancels own registration)
const cancelRegistration = asyncHandler(async (req, res) => {
  const registration = await Registration.findById(req.params.id);
  if (!registration) {
    res.statusCode = 404;
    throw new Error("Registration not found.");
  }
  if (
    req.user.role !== "admin" &&
    registration.student.toString() !== req.user._id.toString()
  ) {
    res.statusCode = 403;
    throw new Error("You can only cancel your own registration.");
  }
  registration.status = "Cancelled";
  await registration.save();
  res.json({ message: "Registration cancelled.", registration });
});

// @route  GET /api/admin/registrations   (admin only) - with filters
const getAllRegistrations = asyncHandler(async (req, res) => {
  const { event, department, status, search } = req.query;
  const query = {};
  if (event) query.event = event;
  if (status) query.status = status;

  let registrations = await Registration.find(query)
    .populate("student", "name studentId department year email")
    .populate("event", "title date category")
    .sort({ createdAt: -1 });

  if (department) {
    registrations = registrations.filter((r) => r.student?.department === department);
  }
  if (search) {
    const s = search.toLowerCase();
    registrations = registrations.filter(
      (r) =>
        r.student?.name?.toLowerCase().includes(s) ||
        r.student?.studentId?.toLowerCase().includes(s) ||
        r.event?.title?.toLowerCase().includes(s)
    );
  }

  res.json({ registrations });
});

// @route  PUT /api/admin/registrations/:id/status   (admin approves/rejects/cancels)
const updateRegistrationStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["Pending", "Approved", "Rejected", "Cancelled"].includes(status)) {
    res.statusCode = 400;
    throw new Error("Invalid status value.");
  }
  const registration = await Registration.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  ).populate("student", "name studentId").populate("event", "title");
  if (!registration) {
    res.statusCode = 404;
    throw new Error("Registration not found.");
  }
  res.json({ registration });
});

module.exports = {
  getMyRegistrations,
  cancelRegistration,
  getAllRegistrations,
  updateRegistrationStatus,
};
