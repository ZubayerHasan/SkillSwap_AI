const { z } = require("zod");

const updateProfileSchema = z.object({
  bio: z.string().max(500).optional(),
  university: z.string().min(2).optional(),
  department: z.string().optional(),
  contactPreference: z.enum(["email", "in_app", "both"]).optional(),
  name: z.string().min(2).max(60).optional(),
  timezone: z.string().optional(),
  hasCompletedOnboarding: z.boolean().optional(),
  availability: z
    .array(
      z.object({
        dayOfWeek: z.number().int().min(0).max(6),
        startMinute: z.number().int().min(0).max(1439),
        endMinute: z.number().int().min(0).max(1439),
      })
    )
    .optional(),
});

module.exports = { updateProfileSchema };
