// Transforms Challonge API response into brackets-viewer ViewerData format.
// Status enum: 0=Locked, 1=Waiting, 2=Ready, 3=Running, 4=Completed, 5=Archived

const TYPE_MAP = {
  "single elimination": "single_elimination",
  "double elimination": "double_elimination",
  "round robin":        "round_robin",
  "swiss":              "round_robin", // viewer has no swiss type, round_robin is closest
};

function challongeStatus(m) {
  if (m.state === "complete") return 4; // Completed
  if (m.state === "open")     return 3; // Running
  if (m.player1_id && m.player2_id) return 2; // Ready
  if (m.player1_id || m.player2_id) return 1; // Waiting
  return 0; // Locked
}

function parseScore(scoresCSV, side) {
  if (!scoresCSV) return undefined;
  const parts = scoresCSV.split(",").map((s) => s.split("-").map(Number));
  return parts.reduce((acc, p) => acc + (p[side] ?? 0), 0);
}

function toOpponent(participantId, winnerId, scoresCSV, side) {
  if (!participantId) return null;
  const score = parseScore(scoresCSV, side === 0 ? 0 : 1);
  return {
    id:     participantId,
    score,
    result: winnerId
      ? participantId === winnerId ? "win" : "loss"
      : undefined,
  };
}

export function challongeToViewerData(challongeData) {
  const { tournament, participants, matches } = challongeData;

  const stageType = TYPE_MAP[tournament.tournament_type] ?? "single_elimination";

  // Participants
  const viewerParticipants = participants.map((p) => ({
    id:            p.id,
    tournament_id: 0,
    name:          p.name,
  }));

  // Build rounds mapping
  const upperRounds = [...new Set(
    matches.filter((m) => m.round > 0).map((m) => m.round).sort((a, b) => a - b)
  )];
  const lowerRounds = [...new Set(
    matches.filter((m) => m.round < 0).map((m) => m.round).sort((a, b) => a - b)
  )];

  // round_id map: challonge round number → viewer round_id
  const roundIdMap = {};
  upperRounds.forEach((r, i) => { roundIdMap[r] = i; });
  lowerRounds.forEach((r, i) => { roundIdMap[r] = upperRounds.length + i; });

  // match number within each round (1-indexed)
  const roundMatchCounter = {};

  const viewerMatches = matches.map((m) => {
    const round  = m.round;
    const isLower = round < 0;
    const groupId = isLower ? 1 : 0;
    const roundId = roundIdMap[round];

    roundMatchCounter[roundId] = (roundMatchCounter[roundId] ?? 0) + 1;

    return {
      id:         m.id,
      stage_id:   0,
      group_id:   groupId,
      round_id:   roundId,
      number:     roundMatchCounter[roundId],
      child_count: 0,
      status:     challongeStatus(m),
      opponent1:  toOpponent(m.player1_id, m.winner_id, m.scores_csv, 0),
      opponent2:  toOpponent(m.player2_id, m.winner_id, m.scores_csv, 1),
    };
  });

  const stage = {
    id:            0,
    tournament_id: 0,
    name:          tournament.name,
    type:          stageType,
    number:        1,
    settings: {
      size:          tournament.participants_count,
      grandFinal:    stageType === "double_elimination" ? "simple" : undefined,
    },
  };

  return {
    stages:      [stage],
    matches:     viewerMatches,
    matchGames:  [],
    participants: viewerParticipants,
  };
}
