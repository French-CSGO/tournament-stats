const { Router } = require("express");
const db = require("../db");

const router = Router();

// GET /api/rounds/:map_id
// Returns rounds derived from player_stat_extras with kills per round.
// Winner is inferred from which side lost 5 players.
router.get("/:map_id", async (req, res) => {
  const { map_id } = req.params;

  // Fetch map info needed to map CT/T sides to team IDs
  const [[mapInfo]] = await db.query(
    `SELECT ms.team1_first_side,
            m.team1_id, m.team2_id
     FROM map_stats ms
     JOIN \`match\` m ON m.id = ms.match_id
     WHERE ms.id = ?`,
    [map_id]
  );

  if (!mapInfo) return res.status(404).json({ error: "Map not found" });

  // All kill events for this map, ordered by round then time
  const [rows] = await db.query(
    `SELECT round_number, round_time,
            attacker_name, attacker_side,
            player_name,  player_side,
            weapon, headshot, bomb, suicide, friendly_fire
     FROM player_stat_extras
     WHERE map_id = ?
     ORDER BY round_number, round_time`,
    [map_id]
  );

  if (!rows.length) return res.json([]);

  // Group by round
  const byRound = {};
  for (const row of rows) {
    const rn = row.round_number;
    if (!byRound[rn]) byRound[rn] = { ctDeaths: 0, tDeaths: 0, kills: [] };
    const r = byRound[rn];

    // Count side deaths for winner inference (exclude team kills and suicides from death count)
    if (!row.suicide && !row.friendly_fire) {
      if (row.player_side === "CT") r.ctDeaths++;
      else if (row.player_side === "T")  r.tDeaths++;
    }

    // Only include non-suicide kills in the feed
    if (!row.suicide) {
      r.kills.push({
        killer_name:  row.attacker_name,
        victim_name:  row.player_name,
        killer_side:  row.attacker_side,
        victim_side:  row.player_side,
        weapon:       row.weapon,
        headshot:     !!row.headshot,
        friendly_fire: !!row.friendly_fire
      });
    }
  }

  const team1FirstSide = (mapInfo.team1_first_side || "ct").toUpperCase();

  // Determine which side team1 is on for a given round number
  function team1SideForRound(roundNum) {
    if (roundNum <= 12) return team1FirstSide;
    if (roundNum <= 24) return team1FirstSide === "CT" ? "T" : "CT";
    // Overtime: 3-round halves, sides swap every 3 rounds starting at round 25
    const otRound = roundNum - 25;
    const otHalf  = Math.floor(otRound / 3) % 2;
    const otStart = team1FirstSide === "CT" ? "T" : "CT";
    return otHalf === 0 ? otStart : (otStart === "CT" ? "T" : "CT");
  }

  // Build sorted round list with inferred winner and cumulative score
  const roundNums = Object.keys(byRound).map(Number).sort((a, b) => a - b);
  let t1Score = 0;
  let t2Score = 0;

  const result = roundNums.map(rn => {
    const r = byRound[rn];

    // Infer winning side from death counts (≥5 deaths on a side = that side lost)
    let winningSide = null;
    if (r.ctDeaths >= 5) winningSide = "T";
    if (r.tDeaths  >= 5) winningSide = "CT";

    // Map winning side → team ID
    let winner_team_id = null;
    if (winningSide) {
      const t1Side = team1SideForRound(rn);
      winner_team_id = winningSide === t1Side
        ? mapInfo.team1_id
        : mapInfo.team2_id;
    }

    if (winner_team_id === mapInfo.team1_id) t1Score++;
    else if (winner_team_id === mapInfo.team2_id) t2Score++;

    return {
      round_num:       rn,
      winner_team_id,
      t1_score_after:  t1Score,
      t2_score_after:  t2Score,
      kills:           r.kills
    };
  });

  res.json(result);
});

module.exports = router;
