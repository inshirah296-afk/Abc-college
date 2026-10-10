const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// A single collection holds both students and admins, distinguished by `role`.
// Student-only fields are simply left blank for admin accounts.
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Enter a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    role: { type: String, enum: ["student", "admin"], default: "student" },

    // Student-specific profile fields
    studentId: { type: String, unique: true, sparse: true, trim: true },
    department: { type: String, trim: true },
    year: { type: String, enum: ["1", "2", "3", "4", ""], default: "" },
    phone: { type: String, trim: true },
    profileImage: { type: String, default: "" },
  },
  { timestamps: true }
);

// Hash the password automatically whenever it is set or changed.
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
