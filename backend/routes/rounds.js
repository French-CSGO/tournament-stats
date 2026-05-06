const { Router } = require("express");
const db = require("../db");

const router = Router();

// GET /api/rounds/:map_id
// Returns rounds from map_round (populated by G5API on round_end events),
// enriched with kills from player_stat_extras.
router.get("/:map_id", async (req, res) => {
  const { map_id } = req.params;

  // Fetch rounds from map_round (source of truth for winner/score)
  const [rounds] = await db.query(
    `SELECT r.round_number, r.winner_team, r.winner_side,
            r.reason, r.t1_score, r.t2_score, r.team1_side,
            m.team1_id, m.team2_id
     FROM map_round r
     JOIN map_stats  ms ON ms.id        = r.map_stats_id
     JOIN \`match\`  m  ON m.id         = ms.match_id
     WHERE r.map_stats_id = ?
     ORDER BY r.round_number ASC`,
    [map_id]
  );

  if (!rounds.length) return res.json([]);

  // Fetch kills for these rounds from player_stat_extras
  const [kills] = await db.query(
    `SELECT round_number, round_time,
            attacker_name, attacker_side,
            player_name,  player_side,
            weapon, headshot, suicide, friendly_fire
     FROM player_stat_extras
     WHERE map_id = ? AND suicide = 0
     ORDER BY round_number, round_time`,
    [map_id]
  );

  // Index kills by round_number
  const killsByRound = {};
  for (const k of kills) {
    if (!killsByRound[k.round_number]) killsByRound[k.round_number] = [];
    killsByRound[k.round_number].push({
      killer_name:   k.attacker_name,
      victim_name:   k.player_name,
      killer_side:   k.attacker_side,
      victim_side:   k.player_side,
      weapon:        k.weapon,
      headshot:      !!k.headshot,
      friendly_fire: !!k.friendly_fire
    });
  }

  const { team1_id, team2_id } = rounds[0];

  const result = rounds.map(r => ({
    round_num:      r.round_number,
    winner_team_id: r.winner_team === "team1" ? team1_id : team2_id,
    winner_side:    r.winner_side,
    reason:         r.reason,
    t1_score_after: r.t1_score,
    t2_score_after: r.t2_score,
    team1_side:     r.team1_side,
    kills:          killsByRound[r.round_number] || []
  }));

  res.json(result);
});

module.exports = router;
