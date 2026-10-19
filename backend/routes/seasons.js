const { Router } = require("express");
const db = require("../db");
const path = require("path");
const fs = require("fs");
const archiver = require("archiver");
const { calcRating } = require("../utils/rating");

const router = Router();

const DEMO_DIR = path.join(__dirname, "../public/demos");

// Même normalisation que l'upload (routes/demos.js) pour retrouver le fichier sur disque
const safeDemoName = (name) => path.basename(name).replace(/[^a-zA-Z0-9._-]/g, "_");
const slug = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "x";

// Démos (maps terminées avec un fichier présent sur disque) d'une saison,
// éventuellement restreintes aux matchs d'une équipe
async function listSeasonDemos(seasonId, teamId) {
  const params = [seasonId];
  let teamFilter = "";
  if (teamId) {
    teamFilter = "AND (m.team1_id = ? OR m.team2_id = ?)";
    params.push(teamId, teamId);
  }
  const [rows] = await db.query(
    `SELECT ms.id AS map_id, ms.match_id, ms.map_number, ms.map_name, ms.demoFile,
            ms.team1_score, ms.team2_score, ms.end_time,
            m.max_maps,
            t1.id AS team1_id, t1.name AS team1_name,
            t2.id AS team2_id, t2.name AS team2_name
     FROM map_stats ms
     JOIN \`match\` m  ON m.id = ms.match_id
     LEFT JOIN team t1 ON t1.id = m.team1_id
     LEFT JOIN team t2 ON t2.id = m.team2_id
     WHERE m.season_id = ? AND m.cancelled = 0
       AND ms.demoFile IS NOT NULL AND ms.demoFile != ''
       ${teamFilter}
     ORDER BY ms.end_time DESC, ms.match_id DESC, ms.map_number ASC`,
    params
  );
  const demos = [];
  for (const r of rows) {
    const file = safeDemoName(r.demoFile);
    try {
      const { size } = fs.statSync(path.join(DEMO_DIR, file));
      demos.push({ ...r, demoFile: file, size });
    } catch {
      // fichier référencé en base mais absent du disque : ignoré
    }
  }
  return demos;
}

// GET /api/seasons
router.get("/", async (req, res) => {
  const [rows] = await db.query(
    `SELECT s.id, s.name, s.start_date, s.end_date,
            COUNT(DISTINCT m.id) AS match_count
     FROM season s
     LEFT JOIN \`match\` m ON m.season_id = s.id AND m.cancelled = 0
     GROUP BY s.id
     ORDER BY s.start_date DESC`
  );
  res.json(rows);
});

// GET /api/seasons/:id/demos?team_id= — liste des démos téléchargeables
router.get("/:id/demos", async (req, res) => {
  const { id } = req.params;
  const teamId = req.query.team_id || null;

  const [[season]] = await db.query(
    `SELECT id, name, start_date, end_date FROM season WHERE id = ?`,
    [id]
  );
  if (!season) return res.status(404).json({ error: "Season not found" });

  const demos = await listSeasonDemos(id, teamId);

  // Équipes ayant au moins une démo dans la saison (pour le filtre)
  const allDemos = teamId ? await listSeasonDemos(id, null) : demos;
  const teams = new Map();
  for (const d of allDemos) {
    if (d.team1_id) teams.set(d.team1_id, d.team1_name);
    if (d.team2_id) teams.set(d.team2_id, d.team2_name);
  }

  res.json({
    season,
    teams: [...teams].map(([tid, name]) => ({ id: tid, name }))
      .sort((a, b) => String(a.name).localeCompare(String(b.name))),
    demos,
    total_size: demos.reduce((acc, d) => acc + d.size, 0),
  });
});

// GET /api/seasons/:id/demos/archive?team_id= — ZIP de toutes les démos
// de la saison (ou d'une équipe dans la saison), streamé sans recompression
router.get("/:id/demos/archive", async (req, res) => {
  const { id } = req.params;
  const teamId = req.query.team_id || null;

  const [[season]] = await db.query(`SELECT id, name FROM season WHERE id = ?`, [id]);
  if (!season) return res.status(404).json({ error: "Season not found" });

  let teamName = null;
  if (teamId) {
    const [[team]] = await db.query(`SELECT id, name FROM team WHERE id = ?`, [teamId]);
    if (!team) return res.status(404).json({ error: "Team not found" });
    teamName = team.name;
  }

  const demos = await listSeasonDemos(id, teamId);
  if (!demos.length) return res.status(404).json({ error: "No demos available" });

  const zipName = ["demos", slug(season.name), teamName && slug(teamName)]
    .filter(Boolean).join("_") + ".zip";

  res.attachment(zipName);
  res.setHeader("Content-Type", "application/zip");

  // Les démos sont déjà compressées (.dem.zip / .dem.bz2) : stockage seul
  const archive = archiver("zip", { store: true });
  archive.on("warning", (err) => console.warn("[demos-archive]", err));
  archive.on("error", (err) => {
    console.error("[demos-archive]", err);
    res.destroy(err);
  });
  req.on("close", () => { if (!res.writableFinished) archive.abort(); });

  archive.pipe(res);
  for (const d of demos) {
    const folder = `match_${d.match_id}_${slug(d.team1_name)}_vs_${slug(d.team2_name)}`;
    archive.file(path.join(DEMO_DIR, d.demoFile), { name: `${folder}/${d.demoFile}` });
  }
  archive.finalize();
});

// GET /api/seasons/:id — matches + aggregated player stats
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  const [[season]] = await db.query(
    `SELECT id, name, start_date, end_date FROM season WHERE id = ?`,
    [id]
  );
  if (!season) return res.status(404).json({ error: "Season not found" });

  const [brackets] = await db.query(
    `SELECT id, challonge_slug, label, display_order
     FROM season_challonge_tournament
     WHERE season_id = ?
     ORDER BY display_order, id`,
    [id]
  );

  const [matches] = await db.query(
    `SELECT m.id, m.start_time, m.end_time, m.team1_score, m.team2_score,
            m.team1_series_score, m.team2_series_score,
            m.cancelled, m.forfeit, m.max_maps, m.challonge_id, m.challonge_slug,
            t1.id AS team1_id, t1.name AS team1_name, t1.logo AS team1_logo,
            t2.id AS team2_id, t2.name AS team2_name, t2.logo AS team2_logo,
            w.id  AS winner_id,
            (SELECT ms.team1_score FROM map_stats ms WHERE ms.match_id = m.id ORDER BY ms.map_number ASC LIMIT 1) AS map1_team1_score,
            (SELECT ms.team2_score FROM map_stats ms WHERE ms.match_id = m.id ORDER BY ms.map_number ASC LIMIT 1) AS map1_team2_score
     FROM \`match\` m
     LEFT JOIN team t1 ON t1.id = m.team1_id
     LEFT JOIN team t2 ON t2.id = m.team2_id
     LEFT JOIN team w  ON w.id  = m.winner
     WHERE m.season_id = ? AND m.cancelled = 0
     ORDER BY m.start_time DESC`,
    [id]
  );

  const [players] = await db.query(
    `SELECT ps.steam_id, MAX(ps.name) AS name,
            SUM(ps.kills)          AS kills,
            SUM(ps.deaths)         AS deaths,
            SUM(ps.assists)        AS assists,
            SUM(ps.headshot_kills) AS headshot_kills,
            SUM(ps.damage)         AS damage,
            SUM(ps.roundsplayed)   AS roundsplayed,
            GREATEST(0, SUM(ps.roundsplayed) - SUM(ps.k2) - SUM(ps.k3) - SUM(ps.k4) - SUM(ps.k5)) AS k1,
            SUM(ps.k2)             AS k2,
            SUM(ps.k3)             AS k3,
            SUM(ps.k4)             AS k4,
            SUM(ps.k5)             AS k5,
            SUM(ps.v1)             AS v1,
            SUM(ps.v2)             AS v2,
            SUM(ps.v3)             AS v3,
            SUM(ps.v4)             AS v4,
            SUM(ps.v5)             AS v5,
            SUM(ps.kast)           AS kast,
            COUNT(DISTINCT ps.map_id)   AS maps_played
     FROM player_stats ps
     JOIN map_stats ms ON ms.id = ps.map_id AND ms.end_time IS NOT NULL
     JOIN \`match\` m  ON m.id = ps.match_id
     WHERE m.season_id = ? AND m.cancelled = 0 AND ps.roundsplayed > 0
     GROUP BY ps.steam_id
     ORDER BY kills DESC`,
    [id]
  );

  const playersWithRating = players
    .map((p) => ({ ...p, rating: calcRating(p) }))
    .sort((a, b) => b.rating - a.rating);

  res.json({ season, brackets, matches, players: playersWithRating });
});

module.exports = router;
