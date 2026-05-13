const { Router } = require("express");
const db = require("../db");
const { fetchTournament, clearCache } = require("../utils/challonge");

const router = Router();

// GET /api/tournaments/season/:id — list tournaments linked to a season
router.get("/season/:id", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, season_id, challonge_url, name
       FROM season_challonge_tournament
       WHERE season_id = ?
       ORDER BY id`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error("[tournaments]", err.message);
    res.status(500).json({ error: "DB error" });
  }
});

// GET /api/tournaments/:slug — fetch bracket data from Challonge (cached 30 min)
router.get("/:slug", async (req, res) => {
  if (!process.env.CHALLONGE_API_KEY) {
    return res.status(503).json({ error: "CHALLONGE_API_KEY non configuré" });
  }
  try {
    const data = await fetchTournament(req.params.slug);
    res.json(data);
  } catch (err) {
    console.error("[challonge]", err.response?.status, err.message);
    const status = err.response?.status === 404 ? 404 : 502;
    res.status(status).json({ error: "Challonge API error", detail: err.message });
  }
});

// DELETE /api/tournaments/:slug/cache — vide le cache pour un tournoi
router.delete("/:slug/cache", (req, res) => {
  clearCache(req.params.slug === "_all" ? null : req.params.slug);
  res.json({ ok: true });
});

module.exports = router;
