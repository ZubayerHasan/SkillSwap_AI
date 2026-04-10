const { z } = require("zod");

const updateProfileSchema = z.object({
  bio: z.string().max(500).optional(),
  university: z.string().min(2).optional(),
  department: z.string().optional(),
  contactPreference: z.enum(["email", "in_app", "both"]).optional(),
  name: z.string().min(2).max(60).optional(),
  timezone: z.string().optional(),
});

module.exports = { updateProfileSchema };
