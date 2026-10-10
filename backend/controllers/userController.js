const User = require("../models/User");
const { asyncHandler } = require("../middleware/errorHandler");

// @route  PUT /api/users/profile   (logged-in user updates their own profile)
const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = ["name", "department", "year", "phone"];
  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });
  if (req.file) updates.profileImage = `/uploads/${req.file.filename}`;

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });
  res.json({ user: user.toSafeObject() });
});

// @route  PUT /api/users/password   (change password)
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select("+password");

  if (!(await user.comparePassword(currentPassword))) {
    res.statusCode = 400;
    throw new Error("Current password is incorrect.");
  }
  if (!newPassword || newPassword.length < 6) {
    res.statusCode = 400;
    throw new Error("New password must be at least 6 characters.");
  }
  user.password = newPassword;
  await user.save();
  res.json({ message: "Password updated successfully." });
});

module.exports = { updateProfile, changePassword };
