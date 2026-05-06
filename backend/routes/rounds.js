const { Router } = require("express");
const db = require("../db");

const router = Router();

// GET /api/rounds/:map_id — round history for a map
router.get("/:map_id", async (req, res) => {
  const { map_id } = req.params;

  const [rounds] = await db.query(
    `SELECT r.id, r.round_num, r.winner_team_id,
            r.t1_score_after, r.t2_score_after,
            r.kills
     FROM map_round r
     WHERE r.map_id = ?
     ORDER BY r.round_num ASC`,
    [map_id]
  );

  res.json(rounds);
});

// POST /api/rounds/:map_id — upsert a round (used by import scripts)
router.post("/:map_id", async (req, res) => {
  const { map_id } = req.params;
  const { round_num, winner_team_id, t1_score_after, t2_score_after, kills } = req.body;

  await db.query(
    `INSERT INTO map_round (map_id, round_num, winner_team_id, t1_score_after, t2_score_after, kills)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       winner_team_id  = VALUES(winner_team_id),
       t1_score_after  = VALUES(t1_score_after),
       t2_score_after  = VALUES(t2_score_after),
       kills           = VALUES(kills)`,
    [map_id, round_num, winner_team_id ?? null, t1_score_after ?? 0, t2_score_after ?? 0,
     kills ? JSON.stringify(kills) : null]
  );

  res.json({ ok: true });
});

module.exports = router;
