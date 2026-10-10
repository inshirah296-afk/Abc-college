const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    registrationDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Cancelled"],
      default: "Approved", // auto-approved by default; admin can still moderate
    },
    attendance: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// A student can never register for the same event twice.
registrationSchema.index({ student: 1, event: 1 }, { unique: true });

module.exports = mongoose.model("Registration", registrationSchema);
