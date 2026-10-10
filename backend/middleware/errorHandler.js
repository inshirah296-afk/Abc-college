// Catches errors thrown anywhere in the app (including async controllers wrapped
// with asyncHandler) and returns a consistent JSON error shape.
const errorHandler = (err, req, res, next) => {
  console.error(err.stack || err.message);

  let statusCode = err.statusCode || 500;
  let message = err.message || "Server error";

  // Mongoose validation error
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0];
    message = field
      ? `Duplicate value for field "${field}". It must be unique.`
      : "Duplicate value error.";
  }

  // Invalid ObjectId
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  res.status(statusCode).json({ message });
};

// Wraps async route handlers so thrown errors are forwarded to errorHandler.
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { errorHandler, asyncHandler };
