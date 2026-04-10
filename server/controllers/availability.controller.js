const User = require("../models/User.model");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

// Compute 10080-bit availability bitfield
const computeBitfield = (slots) => {
  const bits = Buffer.alloc(1260, 0); // 10080 bits / 8 = 1260 bytes
  slots.forEach(({ dayOfWeek, startMinute, endMinute }) => {
    for (let m = startMinute; m < endMinute; m++) {
      const bitIndex = dayOfWeek * 1440 + m;
      const byteIndex = Math.floor(bitIndex / 8);
      const bitOffset = bitIndex % 8;
      bits[byteIndex] |= 1 << bitOffset;
    }
  });
  return bits;
};

// PUT /api/availability
const updateAvailability = asyncHandler(async (req, res) => {
  const { slots, timezone } = req.body;
  const bitfield = computeBitfield(slots);

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { availability: slots, availabilityBitfield: bitfield, ...(timezone && { timezone }) },
    { new: true }
  ).select("availability timezone availabilityBitfield");

  if (!user) throw new ApiError(404, "User not found");

  const totalHours = slots.reduce((sum, s) => sum + (s.endMinute - s.startMinute) / 60, 0);

  res.status(200).json(new ApiResponse(200, { availability: user.availability, timezone: user.timezone, totalHoursPerWeek: totalHours }, "Availability updated"));
});

// GET /api/availability/me
const getMyAvailability = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("availability timezone");
  if (!user) throw new ApiError(404, "User not found");

  const totalHours = user.availability.reduce((sum, s) => sum + (s.endMinute - s.startMinute) / 60, 0);
  res.status(200).json(new ApiResponse(200, { availability: user.availability, timezone: user.timezone, totalHoursPerWeek: totalHours }, "Availability fetched"));
});

module.exports = { updateAvailability, getMyAvailability };
