const mongoose = require("mongoose");

const skillNeedSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    skillName: { type: String, required: true, trim: true, lowercase: true },
    displayName: { type: String, required: true, trim: true },
    skillTaxonomyId: { type: mongoose.Schema.Types.ObjectId, ref: "SkillTaxonomy" },
    category: { type: String, required: true },
    urgency: {
      type: Number,
      required: true,
      enum: [1, 2, 3],
      // 1: Low, 2: Medium, 3: High
    },
    description: { type: String, default: "", maxlength: 1000 },
    isActive: { type: Boolean, default: true },

    // Broadcast fields (F10)
    isBroadcast: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["open", "fulfilled", "expired"],
      default: "open",
    },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

skillNeedSchema.index({ userId: 1 });
skillNeedSchema.index({ skillTaxonomyId: 1 });
skillNeedSchema.index({ category: 1 });
skillNeedSchema.index({ isBroadcast: 1, status: 1, urgency: -1, createdAt: -1 });

const SkillNeed = mongoose.model("SkillNeed", skillNeedSchema);
module.exports = SkillNeed;
