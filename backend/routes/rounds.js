const { Router } = require("express");
const db = require("../db");

const router = Router();

// GET /api/rounds/:map_id
// Primary source: map_round table (populated by G5API >= dev branch).
// Fallback: infer round winners from player_stat_extras (historical matches).
router.get("/:map_id", async (req, res) => {
  const { map_id } = req.params;

  // ── Primary: map_round ──────────────────────────────────────────────────
  const [rounds] = await db.query(
    `SELECT r.round_number, r.winner_team, r.winner_side,
            r.reason, r.t1_score, r.t2_score, r.team1_side,
            m.team1_id, m.team2_id
     FROM map_round r
     JOIN map_stats  ms ON ms.id = r.map_stats_id
     JOIN \`match\`  m  ON m.id  = ms.match_id
     WHERE r.map_stats_id = ?
     ORDER BY r.round_number ASC`,
    [map_id]
  );

  // ── Kills (used by both paths) ──────────────────────────────────────────
  const [killRows] = await db.query(
    `SELECT round_number, round_time,
            attacker_name, attacker_side,
            player_name,  player_side,
            weapon, headshot, bomb, suicide, friendly_fire
     FROM player_stat_extras
     WHERE map_id = ? AND suicide = 0
     ORDER BY round_number, round_time`,
    [map_id]
  );

  const killsByRound = {};
  for (const k of killRows) {
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

  // ── map_round has data → use it ─────────────────────────────────────────
  if (rounds.length) {
    const { team1_id, team2_id } = rounds[0];
    return res.json(rounds.map(r => ({
      round_num:      r.round_number,
      winner_team_id: r.winner_team === "team1" ? team1_id : team2_id,
      winner_side:    r.winner_side,
      reason:         r.reason,
      t1_score_after: r.t1_score,
      t2_score_after: r.t2_score,
      team1_side:     r.team1_side,
      kills:          killsByRound[r.round_number] || []
    })));
  }

  // ── Fallback: infer from player_stat_extras ────────────────────────────
  if (!killRows.length) return res.json([]);

  const [[mapInfo]] = await db.query(
    `SELECT ms.team1_first_side, m.team1_id, m.team2_id
     FROM map_stats ms
     JOIN \`match\` m ON m.id = ms.match_id
     WHERE ms.id = ?`,
    [map_id]
  );

  if (!mapInfo) return res.json([]);

  const team1FirstSide = (mapInfo.team1_first_side || "ct").toUpperCase();

  function team1SideForRound(rn) {
    if (rn <= 12) return team1FirstSide;
    if (rn <= 24) return team1FirstSide === "CT" ? "T" : "CT";
    const otHalf = Math.floor((rn - 25) / 3) % 2;
    const otStart = team1FirstSide === "CT" ? "T" : "CT";
    return otHalf === 0 ? otStart : (otStart === "CT" ? "T" : "CT");
  }

  // Group kill rows by round
  const byRound = {};
  for (const k of killRows) {
    const rn = k.round_number;
    if (!byRound[rn]) byRound[rn] = { ctDeaths: 0, tDeaths: 0, bombExploded: false };
    if (k.bomb && k.player_side === "CT") byRound[rn].bombExploded = true;
    if (!k.friendly_fire) {
      if (k.player_side === "CT") byRound[rn].ctDeaths++;
      else if (k.player_side === "T") byRound[rn].tDeaths++;
    }
  }

  const roundNums = Object.keys(byRound).map(Number).sort((a, b) => a - b);
  let t1Score = 0;
  let t2Score = 0;

  return res.json(roundNums.map(rn => {
    const r = byRound[rn];
    let winningSide = null;
    if (r.bombExploded || r.ctDeaths >= 5) winningSide = "T";
    else if (r.tDeaths >= 5)               winningSide = "CT";

    let winner_team_id = null;
    if (winningSide) {
      winner_team_id = winningSide === team1SideForRound(rn)
        ? mapInfo.team1_id
        : mapInfo.team2_id;
    }

    if (winner_team_id === mapInfo.team1_id) t1Score++;
    else if (winner_team_id === mapInfo.team2_id) t2Score++;

    return {
      round_num:      rn,
      winner_team_id,
      winner_side:    winningSide,
      reason:         null,
      t1_score_after: t1Score,
      t2_score_after: t2Score,
      team1_side:     team1SideForRound(rn),
      kills:          killsByRound[rn] || []
    };
  }));
});

module.exports = router;
