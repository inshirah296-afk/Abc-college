const Feedback = require("../models/Feedback");
const Registration = require("../models/Registration");
const Event = require("../models/Event");
const { asyncHandler } = require("../middleware/errorHandler");

// @route  POST /api/feedback   (student only, must have attended a completed event)
const submitFeedback = asyncHandler(async (req, res) => {
  const { event, rating, comment, suggestions } = req.body;

  if (!event || !rating) {
    res.statusCode = 400;
    throw new Error("Event and rating are required.");
  }

  const eventDoc = await Event.findById(event);
  if (!eventDoc) {
    res.statusCode = 404;
    throw new Error("Event not found.");
  }
  if (eventDoc.status !== "Completed") {
    res.statusCode = 400;
    throw new Error("Feedback can only be submitted after the event is completed.");
  }

  const registered = await Registration.findOne({
    event,
    student: req.user._id,
    status: { $ne: "Cancelled" },
  });
  if (!registered) {
    res.statusCode = 403;
    throw new Error("Only students registered for this event can submit feedback.");
  }

  const existing = await Feedback.findOne({ event, student: req.user._id });
  if (existing) {
    res.statusCode = 400;
    throw new Error("You have already submitted feedback for this event.");
  }

  const feedback = await Feedback.create({
    event,
    student: req.user._id,
    rating,
    comment,
    suggestions,
  });
  res.status(201).json({ feedback });
});

// @route  GET /api/feedback/:eventId   (admin only) - all feedback + average rating
const getFeedbackForEvent = asyncHandler(async (req, res) => {
  const feedbacks = await Feedback.find({ event: req.params.eventId }).populate(
    "student",
    "name studentId department"
  );
  const average =
    feedbacks.length > 0
      ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
      : 0;
  res.json({ feedbacks, average: Number(average), count: feedbacks.length });
});

module.exports = { submitFeedback, getFeedbackForEvent };
