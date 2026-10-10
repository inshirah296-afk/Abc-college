const EventCategory = require("../models/EventCategory");
const { asyncHandler } = require("../middleware/errorHandler");

const getCategories = asyncHandler(async (req, res) => {
  const categories = await EventCategory.find().sort({ name: 1 });
  res.json({ categories });
});

const createCategory = asyncHandler(async (req, res) => {
  const { name, icon, description } = req.body;
  if (!name) {
    res.statusCode = 400;
    throw new Error("Category name is required.");
  }
  const category = await EventCategory.create({ name, icon, description });
  res.status(201).json({ category });
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await EventCategory.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!category) {
    res.statusCode = 404;
    throw new Error("Category not found.");
  }
  res.json({ category });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const category = await EventCategory.findByIdAndDelete(req.params.id);
  if (!category) {
    res.statusCode = 404;
    throw new Error("Category not found.");
  }
  res.json({ message: "Category deleted." });
});

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
