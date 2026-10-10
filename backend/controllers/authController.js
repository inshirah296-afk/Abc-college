const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { asyncHandler } = require("../middleware/errorHandler");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// @route  POST /api/auth/register
// @desc   Register a new student account (admins are created via the seed script only)
const register = asyncHandler(async (req, res) => {
  const { name, email, password, studentId, department, year, phone } = req.body;

  if (!name || !email || !password || !studentId || !department) {
    res.statusCode = 400;
    throw new Error("Name, email, password, student ID and department are required.");
  }

  const existing = await User.findOne({ $or: [{ email }, { studentId }] });
  if (existing) {
    res.statusCode = 400;
    throw new Error("A user with this email or student ID already exists.");
  }

  const user = await User.create({
    name,
    email,
    password,
    studentId,
    department,
    year: year || "",
    phone: phone || "",
    role: "student",
  });

  const token = signToken(user._id);
  res.status(201).json({ token, user: user.toSafeObject() });
});

// @route  POST /api/auth/login
// @desc   Login for both students and admins
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.statusCode = 400;
    throw new Error("Email and password are required.");
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    res.statusCode = 401;
    throw new Error("Invalid email or password.");
  }

  const token = signToken(user._id);
  res.json({ token, user: user.toSafeObject() });
});

// @route  GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  res.json({ user: req.user.toSafeObject() });
});

module.exports = { register, login, getMe };
