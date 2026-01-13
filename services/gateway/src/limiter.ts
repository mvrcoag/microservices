import rateLimit from "express-rate-limit";

export const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: { error: "Max requests per minute reached" },
  standardHeaders: true,
  legacyHeaders: false,
});
