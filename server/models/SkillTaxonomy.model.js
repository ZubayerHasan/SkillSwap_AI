const mongoose = require("mongoose");

const skillTaxonomySchema = new mongoose.Schema(
  {
    canonicalName: { type: String, required: true, unique: true, lowercase: true, trim: true },
    displayName: { type: String, required: true, trim: true },
    aliases: [{ type: String, lowercase: true, trim: true }],
    category: {
      type: String,
      required: true,
      enum: ["Programming", "Design", "Music", "Languages", "Math/Science", "Video/Media", "Writing", "Business", "Other"],
    },
    slug: { type: String, required: true, unique: true, lowercase: true },
  },
  { timestamps: true }
);

skillTaxonomySchema.index({ canonicalName: "text", aliases: "text" });
skillTaxonomySchema.index({ category: 1 });

const SkillTaxonomy = mongoose.model("SkillTaxonomy", skillTaxonomySchema);
module.exports = SkillTaxonomy;
