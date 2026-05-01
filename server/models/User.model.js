const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8 },
    university: { type: String, required: true, trim: true },
    department: { type: String, trim: true, default: "" },
    bio: { type: String, default: "", maxlength: 500 },
    avatar: {
      cloudinaryPublicId: { type: String, default: "" },
      url: { type: String, default: "" },
    },
    contactPreference: {
      type: String,
      enum: ["email", "in_app", "both"],
      default: "in_app",
    },
    isVerified: { type: Boolean, default: false },
    role: { type: String, enum: ["student", "moderator", "admin"], default: "student" },
    trustScore: { type: Number, default: 20, min: 0, max: 100 },
    currentBalance: { type: Number, default: 5, min: 0 },
    profileCompleteness: { type: Number, default: 0 },

    // Email verification
    emailVerificationToken: { type: String, default: null },
    emailVerificationTokenExpiry: { type: Date, default: null },

    // Password reset
    passwordResetToken: { type: String, default: null },
    passwordResetTokenExpiry: { type: Date, default: null },

    timezone: { type: String, default: "Asia/Dhaka" },
    availability: [
      {
        dayOfWeek: { type: Number, min: 0, max: 6 },
        startMinute: { type: Number, min: 0, max: 1439 },
        endMinute: { type: Number, min: 0, max: 1439 },
      },
    ],
    availabilityBitfield: { type: Buffer, default: null },
  },
  { timestamps: true }
);

// Indexes
userSchema.index({ trustScore: -1 });

// Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Compute profile completeness
userSchema.methods.computeProfileCompleteness = function () {
  const fields = [
    !!this.name,
    !!this.bio,
    !!this.university,
    !!this.department,
    !!(this.avatar && this.avatar.url),
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
};

const User = mongoose.model("User", userSchema);
module.exports = User;
