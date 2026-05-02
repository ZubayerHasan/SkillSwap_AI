const mongoose = require("mongoose");

const adminAuditLogSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true }, // e.g. "role_change", "suspend", "unsuspend"
    targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reason: { type: String, default: "" },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} }, // extra data (old/new role, etc.)
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

adminAuditLogSchema.index({ adminId: 1, createdAt: -1 });
adminAuditLogSchema.index({ targetUserId: 1 });

const AdminAuditLog = mongoose.model("AdminAuditLog", adminAuditLogSchema);
module.exports = AdminAuditLog;
