const crypto = require("crypto");
const db = require("../db");

const DEFAULT_RATE_LIMIT = parseInt(process.env.API_KEY_RATE_LIMIT_PER_MIN) || 60;
const INTERNAL_RATE_LIMIT = parseInt(process.env.INTERNAL_API_KEY_RATE_LIMIT) || 6000;

// This app has no database of its own for API keys — the DB it talks to is a
// read-only replica (see setup/README.md). Instead we reuse the API keys
// G5API already issues: every G5API `user` row has an `api_key` column,
// AES-OFB encrypted with `server.dbKey` (aes-js, see G5API's Utils.encrypt).
// G5API's own "user-api" header format is "<user.id>:<decryptedKey>" — the
// exact string a user copies from their G5API profile — so we accept that
// same format and never write anything back to the DB.

function decryptG5ApiKey(hexSource, dbKey) {
  if (!hexSource || hexSource.length <= 32) return null;
  try {
    const iv = Buffer.from(hexSource.slice(0, 32), "hex");
    const ciphertext = Buffer.from(hexSource.slice(32), "hex");
    const keyBuf = Buffer.from(dbKey, "utf8");
    const decipher = crypto.createDecipheriv(`aes-${keyBuf.length * 8}-ofb`, keyBuf, iv);
    decipher.setAutoPadding(false);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

// rawHeaderValue is expected to be "<userId>:<apiKey>" — read-only lookup,
// no INSERT/UPDATE ever happens here.
async function verifyUserKey(rawHeaderValue) {
  const sepIndex = rawHeaderValue.indexOf(":");
  if (sepIndex === -1) return null;

  const userId = rawHeaderValue.slice(0, sepIndex);
  const providedKey = rawHeaderValue.slice(sepIndex + 1);
  if (!/^\d+$/.test(userId) || !providedKey) return null;

  const dbKey = process.env.G5API_DB_KEY;
  if (!dbKey) return null;

  const [[row]] = await db.query(
    "SELECT id, name, steam_id, admin, super_admin, api_key FROM `user` WHERE id = ? AND api_key IS NOT NULL LIMIT 1",
    [userId]
  );
  if (!row) return null;

  const decrypted = decryptG5ApiKey(row.api_key, dbKey);
  if (decrypted === null || decrypted !== providedKey) return null;

  return {
    id: `user:${row.id}`,
    label: row.name || row.steam_id,
    rate_limit_per_min: DEFAULT_RATE_LIMIT,
  };
}

// Read-only visibility for the admin panel — never exposes key material.
async function listApiUsers() {
  const [rows] = await db.query(
    "SELECT id, name, steam_id, admin, super_admin FROM `user` WHERE api_key IS NOT NULL ORDER BY name"
  );
  return rows;
}

module.exports = {
  DEFAULT_RATE_LIMIT,
  INTERNAL_RATE_LIMIT,
  verifyUserKey,
  listApiUsers,
};
