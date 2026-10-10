const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, "Event title is required"], trim: true },
    description: { type: String, required: [true, "Event description is required"] },
    category: { type: String, required: [true, "Event category is required"], trim: true },
    image: { type: String, default: "" }, // path under /uploads
    date: { type: Date, required: [true, "Event date is required"] },
    startTime: { type: String, required: [true, "Start time is required"] },
    endTime: { type: String, required: [true, "End time is required"] },
    venue: { type: String, required: [true, "Venue is required"], trim: true },
    organizer: { type: String, required: [true, "Organizer is required"], trim: true },
    maxParticipants: { type: Number, required: true, min: 1 },
    registrationDeadline: { type: Date, required: true },
    rules: { type: String, default: "" },
    contact: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Upcoming", "Registration Open", "Registration Closed", "Completed", "Cancelled"],
      default: "Upcoming",
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Virtual: how many seats are already taken. Populated on demand by controllers.
eventSchema.virtual("registrationCount", {
  ref: "Registration",
  localField: "_id",
  foreignField: "event",
  count: true,
});
eventSchema.set("toJSON", { virtuals: true });
eventSchema.set("toObject", { virtuals: true });

eventSchema.index({ title: "text", description: "text", venue: "text" });

module.exports = mongoose.model("Event", eventSchema);
