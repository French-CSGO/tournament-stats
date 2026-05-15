const { Router } = require("express");
const db = require("../db");
const { fetchTournament, clearCache } = require("../utils/challonge");

const router = Router();

// GET /api/tournaments/season/:id — list tournaments linked to a season
// Fallback: if no rows in season_challonge_tournament, use season.challonge_url
router.get("/season/:id", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, season_id, challonge_slug, label
       FROM season_challonge_tournament
       WHERE season_id = ?
       ORDER BY display_order, id`,
      [req.params.id]
    );

    if (rows.length > 0) return res.json(rows);

    const [[season]] = await db.query(
      `SELECT challonge_url FROM season WHERE id = ? AND challonge_url IS NOT NULL AND challonge_url != ''`,
      [req.params.id]
    );
    if (season?.challonge_url) {
      return res.json([{ id: null, season_id: req.params.id, challonge_slug: season.challonge_url, label: "Main" }]);
    }

    res.json([]);
  } catch (err) {
    console.error("[tournaments]", err.message);
    res.status(500).json({ error: "DB error" });
  }
});

// GET /api/tournaments/:slug — fetch bracket data from Challonge (cached 30 min)
router.get("/:slug", async (req, res) => {
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
