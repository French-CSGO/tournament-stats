const crypto = require("crypto");
const { verifyUserKey, INTERNAL_RATE_LIMIT } = require("../utils/apiKeys");

function extractKey(req) {
  const header = req.headers["x-api-key"];
  if (header) return Array.isArray(header) ? header[0] : header;

  const auth = req.headers["authorization"] || "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

function timingSafeEqual(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

async function apiKeyAuth(req, res, next) {
  const rawKey = extractKey(req);
  if (!rawKey) {
    return res.status(401).json({ error: "Missing API key. Provide it via the X-Api-Key header." });
  }

  // Internal frontend key — a plain shared secret, never stored in the DB.
  if (process.env.INTERNAL_API_KEY && timingSafeEqual(rawKey, process.env.INTERNAL_API_KEY)) {
    req.apiKey = { id: "internal", label: "internal", rate_limit_per_min: INTERNAL_RATE_LIMIT };
    return next();
  }

  try {
    const key = await verifyUserKey(rawKey);
    if (!key) {
      return res.status(401).json({ error: "Invalid API key." });
    }
    req.apiKey = key;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = apiKeyAuth;
