const mongoose = require("mongoose");

const skillOfferSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    skillName: { type: String, required: true, trim: true, lowercase: true },
    displayName: { type: String, required: true, trim: true },
    skillTaxonomyId: { type: mongoose.Schema.Types.ObjectId, ref: "SkillTaxonomy" },
    category: { type: String, required: true },
    proficiencyLevel: {
      type: Number,
      required: true,
      enum: [1, 2, 3],
      // 1: Beginner, 2: Intermediate, 3: Expert
    },
    description: { type: String, default: "", maxlength: 1000 },
    isActive: { type: Boolean, default: true },
    endorsementCount: { type: Number, default: 0 },
    portfolioItems: [
      {
        type: { type: String, enum: ["image", "link", "pdf"] },
        url: String,
        cloudinaryId: String,
        caption: String,
      },
    ],
  },
  { timestamps: true }
);

skillOfferSchema.index({ userId: 1 });
skillOfferSchema.index({ skillTaxonomyId: 1 });
skillOfferSchema.index({ category: 1 });
skillOfferSchema.index({ proficiencyLevel: 1 });
skillOfferSchema.index({ isActive: 1 });
skillOfferSchema.index({ skillName: "text", description: "text" });

const SkillOffer = mongoose.model("SkillOffer", skillOfferSchema);
module.exports = SkillOffer;
