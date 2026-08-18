const { Router } = require("express");
const db = require("../db");
const fs = require("fs");
const path = require("path");
const apiKeys = require("../utils/apiKeys");

const router = Router();
const DEMOS_DIR = path.resolve("public/demos");

function auth(req, res) {
  if (req.headers["x-admin-code"] !== process.env.ADMIN_CODE) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

// Map stats sans démo
router.get("/demos/missing", async (req, res) => {
  if (!auth(req, res)) return;
  const [rows] = await db.query(`
    SELECT ms.id, ms.match_id, ms.map_number, ms.map_name, ms.end_time,
           t1.name AS team1_name, t2.name AS team2_name,
           ms.team1_score, ms.team2_score
    FROM map_stats ms
    JOIN \`match\` m  ON m.id = ms.match_id
    LEFT JOIN team t1 ON t1.id = m.team1_id
    LEFT JOIN team t2 ON t2.id = m.team2_id
    WHERE (ms.demoFile IS NULL OR ms.demoFile = '')
      AND ms.end_time IS NOT NULL
    ORDER BY ms.end_time DESC
  `);
  res.json(rows);
});

// Map stats avec démo en DB mais fichier absent sur disque
router.get("/demos/broken", async (req, res) => {
  if (!auth(req, res)) return;
  const [rows] = await db.query(`
    SELECT ms.id, ms.match_id, ms.map_number, ms.map_name, ms.end_time, ms.demoFile,
           t1.name AS team1_name, t2.name AS team2_name,
           ms.team1_score, ms.team2_score
    FROM map_stats ms
    JOIN \`match\` m  ON m.id = ms.match_id
    LEFT JOIN team t1 ON t1.id = m.team1_id
    LEFT JOIN team t2 ON t2.id = m.team2_id
    WHERE ms.demoFile IS NOT NULL AND ms.demoFile != ''
    ORDER BY ms.end_time DESC
  `);
  const broken = rows.filter(r => !fs.existsSync(path.join(DEMOS_DIR, r.demoFile)));
  res.json(broken);
});

// ── Clés API ─────────────────────────────────────────────────────────────
// Les clés API sont celles déjà émises par G5API (colonne user.api_key,
// chiffrée) — cette base étant une réplique en lecture seule, on ne peut
// ni en créer ni en révoquer ici. Cette route liste, en lecture seule,
// les comptes G5API disposant d'une clé (gestion réelle : page
// "Utilisateurs" de G5API).

// GET /api/admin/keys — comptes G5API avec une clé API active
router.get("/keys", async (req, res) => {
  if (!auth(req, res)) return;
  const users = await apiKeys.listApiUsers();
  res.json(users);
});

module.exports = router;
