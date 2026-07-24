const { findActiveByRawKey, touchLastUsed } = require("../utils/apiKeys");

function extractKey(req) {
  const header = req.headers["x-api-key"];
  if (header) return Array.isArray(header) ? header[0] : header;

  const auth = req.headers["authorization"] || "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

async function apiKeyAuth(req, res, next) {
  const rawKey = extractKey(req);
  if (!rawKey) {
    return res.status(401).json({ error: "Missing API key. Provide it via the X-Api-Key header." });
  }

  try {
    const key = await findActiveByRawKey(rawKey);
    if (!key) {
      return res.status(401).json({ error: "Invalid or revoked API key." });
    }

    req.apiKey = key;
    touchLastUsed(key.id);
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = apiKeyAuth;
