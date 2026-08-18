const rateLimit = require("express-rate-limit");

// Must run after apiKeyAuth — relies on req.apiKey being populated.
// Each key gets its own bucket (keyed by key id) sized to its own
// rate_limit_per_min, so one consumer can never eat into another's quota.
const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `key:${req.apiKey.id}`,
  max: (req) => req.apiKey.rate_limit_per_min,
  message: { error: "Rate limit exceeded. Please slow down and retry later." },
});

module.exports = apiRateLimiter;
