const crypto = require("crypto");
const db = require("../db");

const KEY_PREFIX = "tsk";
const DEFAULT_RATE_LIMIT = 60; // requests per minute

function generateRawKey() {
  return `${KEY_PREFIX}_${crypto.randomBytes(24).toString("hex")}`;
}

function hashKey(rawKey) {
  return crypto.createHash("sha256").update(rawKey).digest("hex");
}

async function ensureTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id INT AUTO_INCREMENT PRIMARY KEY,
      key_hash CHAR(64) NOT NULL,
      key_preview VARCHAR(16) NOT NULL,
      label VARCHAR(255) NOT NULL,
      rate_limit_per_min INT NOT NULL DEFAULT ${DEFAULT_RATE_LIMIT},
      active TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      revoked_at DATETIME NULL,
      last_used_at DATETIME NULL,
      UNIQUE KEY uniq_key_hash (key_hash)
    )
  `);
}

// Creates a brand new key and returns the raw value (shown once, never stored).
async function createKey(label, rateLimitPerMin = DEFAULT_RATE_LIMIT) {
  const rawKey = generateRawKey();
  const hash = hashKey(rawKey);
  const preview = `${rawKey.slice(0, 11)}…${rawKey.slice(-4)}`;

  const [result] = await db.query(
    `INSERT INTO api_keys (key_hash, key_preview, label, rate_limit_per_min)
     VALUES (?, ?, ?, ?)`,
    [hash, preview, label, rateLimitPerMin]
  );

  return { id: result.insertId, rawKey, preview };
}

async function listKeys() {
  const [rows] = await db.query(
    `SELECT id, key_preview, label, rate_limit_per_min, active,
            created_at, revoked_at, last_used_at
     FROM api_keys
     ORDER BY created_at DESC`
  );
  return rows;
}

async function revokeKey(id) {
  const [result] = await db.query(
    `UPDATE api_keys SET active = 0, revoked_at = NOW() WHERE id = ?`,
    [id]
  );
  return result.affectedRows > 0;
}

async function findActiveByRawKey(rawKey) {
  const hash = hashKey(rawKey);
  const [[row]] = await db.query(
    `SELECT id, label, rate_limit_per_min, active
     FROM api_keys
     WHERE key_hash = ? AND active = 1
     LIMIT 1`,
    [hash]
  );
  return row || null;
}

function touchLastUsed(id) {
  // Fire-and-forget — never block the request on this bookkeeping write.
  db.query(`UPDATE api_keys SET last_used_at = NOW() WHERE id = ?`, [id]).catch(() => {});
}

// Ensures the INTERNAL_API_KEY from env always resolves to an active row,
// so the frontend (proxied server-side, never exposed to the browser) works
// out of the box while still going through the same key/rate-limit machinery.
async function seedInternalKey() {
  const rawKey = process.env.INTERNAL_API_KEY;
  if (!rawKey) return;

  const hash = hashKey(rawKey);
  const preview = `${rawKey.slice(0, Math.min(11, rawKey.length))}…`;
  const rateLimit = parseInt(process.env.INTERNAL_API_KEY_RATE_LIMIT) || 6000;

  await db.query(
    `INSERT INTO api_keys (key_hash, key_preview, label, rate_limit_per_min, active)
     VALUES (?, ?, 'Frontend (interne)', ?, 1)
     ON DUPLICATE KEY UPDATE
       label = 'Frontend (interne)',
       rate_limit_per_min = VALUES(rate_limit_per_min),
       active = 1,
       revoked_at = NULL`,
    [hash, preview, rateLimit]
  );
}

module.exports = {
  DEFAULT_RATE_LIMIT,
  ensureTable,
  createKey,
  listKeys,
  revokeKey,
  findActiveByRawKey,
  touchLastUsed,
  seedInternalKey,
};
