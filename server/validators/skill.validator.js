const { z } = require("zod");

const skillOfferSchema = z.object({
  skillName: z.string().min(1, "Skill name is required").max(100),
  category: z.string().min(1, "Category is required"),
  proficiencyLevel: z.number().int().min(1).max(3),
  description: z.string().max(1000).optional().default(""),
  skillTaxonomyId: z.string().optional(),
});

const skillNeedSchema = z.object({
  skillName: z.string().min(1, "Skill name is required").max(100),
  category: z.string().min(1, "Category is required"),
  urgency: z.number().int().min(1).max(3),
  description: z.string().max(1000).optional().default(""),
  skillTaxonomyId: z.string().optional(),
});

const availabilitySchema = z.object({
  slots: z
    .array(
      z.object({
        dayOfWeek: z.number().int().min(0).max(6),
        startMinute: z.number().int().min(0).max(1439),
        endMinute: z.number().int().min(0).max(1439),
      })
    )
    .max(100),
  timezone: z.string().optional(),
});

const exchangeRequestSchema = z.object({
  receiverId: z.string().min(1),
  offeredSkillId: z.string().min(1),
  requestedSkillId: z.string().min(1),
  proposedTime: z.string().datetime(),
  message: z.string().max(300).optional().default(""),
});

module.exports = { skillOfferSchema, skillNeedSchema, availabilitySchema, exchangeRequestSchema };
