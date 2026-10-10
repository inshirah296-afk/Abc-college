const Event = require("../models/Event");
const Registration = require("../models/Registration");
const { asyncHandler } = require("../middleware/errorHandler");

// @route  GET /api/events
// @desc   List events with search, category filter, date filter, sort and pagination
const getEvents = asyncHandler(async (req, res) => {
  const { search, category, status, date, sort, page = 1, limit = 9 } = req.query;

  const query = {};
  if (search) query.$text = { $search: search };
  if (category) query.category = category;
  if (status) query.status = status;
  if (date) {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    query.date = { $gte: start, $lt: end };
  }

  const sortMap = {
    dateAsc: { date: 1 },
    dateDesc: { date: -1 },
    newest: { createdAt: -1 },
  };
  const sortOption = sortMap[sort] || { date: 1 };

  const skip = (Number(page) - 1) * Number(limit);

  const [events, total] = await Promise.all([
    Event.find(query).sort(sortOption).skip(skip).limit(Number(limit)),
    Event.countDocuments(query),
  ]);

  // Attach live seat counts
  const eventIds = events.map((e) => e._id);
  const counts = await Registration.aggregate([
    { $match: { event: { $in: eventIds }, status: { $ne: "Cancelled" } } },
    { $group: { _id: "$event", count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(counts.map((c) => [c._id.toString(), c.count]));

  const withSeats = events.map((e) => {
    const obj = e.toObject();
    obj.registeredCount = countMap[e._id.toString()] || 0;
    obj.seatsAvailable = e.maxParticipants - obj.registeredCount;
    return obj;
  });

  res.json({
    events: withSeats,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
  });
});

// @route  GET /api/events/:id
const getEventById = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    res.statusCode = 404;
    throw new Error("Event not found.");
  }
  const registeredCount = await Registration.countDocuments({
    event: event._id,
    status: { $ne: "Cancelled" },
  });

  let alreadyRegistered = false;
  if (req.user) {
    alreadyRegistered = !!(await Registration.findOne({
      event: event._id,
      student: req.user._id,
      status: { $ne: "Cancelled" },
    }));
  }

  const obj = event.toObject();
  obj.registeredCount = registeredCount;
  obj.seatsAvailable = event.maxParticipants - registeredCount;
  obj.alreadyRegistered = alreadyRegistered;

  res.json({ event: obj });
});

// @route  POST /api/events   (admin only)
const createEvent = asyncHandler(async (req, res) => {
  const data = { ...req.body, createdBy: req.user._id };
  if (req.file) data.image = `/uploads/${req.file.filename}`;
  const event = await Event.create(data);
  res.status(201).json({ event });
});

// @route  PUT /api/events/:id   (admin only)
const updateEvent = asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  if (req.file) updates.image = `/uploads/${req.file.filename}`;

  const event = await Event.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!event) {
    res.statusCode = 404;
    throw new Error("Event not found.");
  }
  res.json({ event });
});

// @route  DELETE /api/events/:id   (admin only)
const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findByIdAndDelete(req.params.id);
  if (!event) {
    res.statusCode = 404;
    throw new Error("Event not found.");
  }
  await Registration.deleteMany({ event: event._id });
  res.json({ message: "Event deleted successfully." });
});

// @route  POST /api/events/:id/register   (student only)
const registerForEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    res.statusCode = 404;
    throw new Error("Event not found.");
  }

  if (event.status === "Cancelled" || event.status === "Completed") {
    res.statusCode = 400;
    throw new Error(`Registration is not available. This event is ${event.status.toLowerCase()}.`);
  }

  if (new Date() > new Date(event.registrationDeadline)) {
    res.statusCode = 400;
    throw new Error("Registration deadline has passed for this event.");
  }

  const existing = await Registration.findOne({
    event: event._id,
    student: req.user._id,
    status: { $ne: "Cancelled" },
  });
  if (existing) {
    res.statusCode = 400;
    throw new Error("You are already registered for this event.");
  }

  const registeredCount = await Registration.countDocuments({
    event: event._id,
    status: { $ne: "Cancelled" },
  });
  if (registeredCount >= event.maxParticipants) {
    res.statusCode = 400;
    throw new Error("This event has reached its maximum capacity.");
  }

  const registration = await Registration.create({
    event: event._id,
    student: req.user._id,
  });

  res.status(201).json({ message: "Registered successfully!", registration });
});

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
};
