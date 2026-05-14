// Transforms Challonge API response into brackets-viewer ViewerData format.
// Status enum: 0=Locked, 1=Waiting, 2=Ready, 3=Running, 4=Completed, 5=Archived

const TYPE_MAP = {
  "single elimination": "single_elimination",
  "double elimination": "double_elimination",
  "round robin":        "round_robin",
  "swiss":              "round_robin",
};

function challongeStatus(m) {
  if (m.state === "complete") return 4;
  if (m.state === "open")     return 3;
  if (m.player1_id && m.player2_id) return 2;
  if (m.player1_id || m.player2_id) return 1;
  return 0;
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

// Build a single-stage ViewerData from a subset of matches.
// stageId and roundOffset allow composing multiple stages with unique IDs.
function buildStage({ stageId, stageName, stageType, tournament, matches, resolveId, roundOffset = 0, groupIdOffset = 0 }) {
  const upperRounds = [...new Set(
    matches.filter((m) => m.round > 0).map((m) => m.round).sort((a, b) => a - b)
  )];
  const lowerRounds = [...new Set(
    matches.filter((m) => m.round < 0).map((m) => m.round).sort((a, b) => a - b)
  )];

  const roundIdMap = {};
  upperRounds.forEach((r, i) => { roundIdMap[r] = roundOffset + i; });
  lowerRounds.forEach((r, i) => { roundIdMap[r] = roundOffset + upperRounds.length + i; });

  // For round robin, remap group_ids to 0-based sequential values
  const groupIdRemap = {};
  if (stageType === "round_robin") {
    const uniqueGroups = [...new Set(matches.map((m) => m.group_id).filter((g) => g != null))].sort();
    uniqueGroups.forEach((g, i) => { groupIdRemap[g] = groupIdOffset + i; });
  }

  const roundMatchCounter = {};
  const viewerMatches = matches.map((m) => {
    const isLower = m.round < 0;
    const roundId = roundIdMap[m.round];
    let groupId;
    if (stageType === "round_robin") {
      groupId = groupIdRemap[m.group_id] ?? groupIdOffset;
    } else {
      groupId = isLower ? 1 : 0;
    }

    roundMatchCounter[roundId] = (roundMatchCounter[roundId] ?? 0) + 1;

    return {
      id:          m.id,
      stage_id:    stageId,
      group_id:    groupId,
      round_id:    roundId,
      number:      roundMatchCounter[roundId],
      child_count: 0,
      status:      challongeStatus(m),
      opponent1:   toOpponent(resolveId(m.player1_id), resolveId(m.winner_id), m.scores_csv, 0),
      opponent2:   toOpponent(resolveId(m.player2_id), resolveId(m.winner_id), m.scores_csv, 1),
    };
  });

  const stage = {
    id:            stageId,
    tournament_id: 0,
    name:          stageName,
    type:          stageType,
    number:        stageId + 1,
    settings: {
      size:       tournament.participants_count,
      grandFinal: stageType === "double_elimination" ? "simple" : undefined,
    },
  };

  return {
    stage,
    matches:     viewerMatches,
    roundCount:  upperRounds.length + lowerRounds.length,
  };
}

export function challongeToViewerData(challongeData, { matchFilter, overrideType } = {}) {
  const { tournament, participants } = challongeData;
  let matches = matchFilter ? challongeData.matches.filter(matchFilter) : challongeData.matches;

  // Build group_player_id → participant_id mapping
  const groupPlayerMap = {};
  for (const p of participants) {
    for (const gpId of (p.group_player_ids ?? [])) {
      groupPlayerMap[gpId] = p.id;
    }
  }
  const resolveId = (id) => (id == null ? null : (groupPlayerMap[id] ?? id));

  const viewerParticipants = participants.map((p) => ({
    id:            p.id,
    tournament_id: 0,
    name:          p.name,
  }));

  const stageType = overrideType ?? TYPE_MAP[tournament.tournament_type] ?? "single_elimination";

  const built = buildStage({
    stageId:   0,
    stageName: tournament.name,
    stageType,
    tournament,
    matches,
    resolveId,
  });

  return {
    stages:       [built.stage],
    matches:      built.matches,
    matchGames:   [],
    participants: viewerParticipants,
  };
}

// Returns true if this tournament has separate group-stage matches AND bracket matches.
// Group-stage: no prereq match id (players pre-assigned to groups).
// Bracket:     player comes from the winner/loser of a previous match.
export function hasGroupAndBracketStages(matches) {
  const hasGroup   = matches.some((m) => !m.player1_prereq_match_id && !m.player2_prereq_match_id && (m.player1_id || m.player2_id));
  const hasBracket = matches.some((m) => m.player1_prereq_match_id != null || m.player2_prereq_match_id != null);
  return hasGroup && hasBracket;
}

// Builds separate ViewerData for group stage and bracket stage of a mixed tournament.
export function challongeToViewerDataGroupBracket(challongeData) {
  const { tournament, participants, matches } = challongeData;

  const isGroupMatch   = (m) => !m.player1_prereq_match_id && !m.player2_prereq_match_id;
  const isBracketMatch = (m) => m.player1_prereq_match_id != null || m.player2_prereq_match_id != null;

  const groupMatches   = matches.filter(isGroupMatch);
  const bracketMatches = matches.filter(isBracketMatch);

  const groupPlayerMap = {};
  for (const p of participants) {
    for (const gpId of (p.group_player_ids ?? [])) {
      groupPlayerMap[gpId] = p.id;
    }
  }
  const resolveId = (id) => (id == null ? null : (groupPlayerMap[id] ?? id));

  const viewerParticipants = participants.map((p) => ({
    id: p.id, tournament_id: 0, name: p.name,
  }));

  // Group stage: round_robin
  const groupBuilt = buildStage({
    stageId:   0,
    stageName: `${tournament.name} — Groupes`,
    stageType: "round_robin",
    tournament,
    matches:   groupMatches,
    resolveId,
  });

  // Bracket stage: single or double elimination based on presence of negative rounds
  const bracketType = bracketMatches.some((m) => m.round < 0) ? "double_elimination" : "single_elimination";
  const bracketBuilt = buildStage({
    stageId:      1,
    stageName:    `${tournament.name} — Bracket`,
    stageType:    bracketType,
    tournament,
    matches:      bracketMatches,
    resolveId,
    roundOffset:  groupBuilt.roundCount,
  });

  return {
    groupData: {
      stages: [groupBuilt.stage], matches: groupBuilt.matches, matchGames: [], participants: viewerParticipants,
    },
    bracketData: {
      stages: [bracketBuilt.stage], matches: bracketBuilt.matches, matchGames: [], participants: viewerParticipants,
    },
  };
}
