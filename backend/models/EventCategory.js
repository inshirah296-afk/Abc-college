const mongoose = require("mongoose");

const eventCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    icon: { type: String, default: "bi-calendar-event" }, // Bootstrap Icon class
    description: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("EventCategory", eventCategorySchema);
