const mongoose = require("mongoose");

const portfolioItemSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    caption: { type: String, default: "", maxlength: 300 },
    type: { type: String, enum: ["image", "pdf", "link"], required: true },
    url: { type: String, required: true },
    cloudinaryPublicId: { type: String, default: "" },
    sourceFileName: { type: String, default: "" },
    mimeType: { type: String, default: "" },
  },
  { timestamps: true }
);

portfolioItemSchema.index({ userId: 1, createdAt: -1 });

const PortfolioItem = mongoose.model("PortfolioItem", portfolioItemSchema);

module.exports = PortfolioItem;