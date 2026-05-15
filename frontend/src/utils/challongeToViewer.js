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
  if (parts.length === 1) return parts[0][side] ?? 0;
  // Multi-map series: show map win count rather than summed rounds
  return parts.reduce((acc, [s0, s1]) => {
    return acc + (side === 0 ? (s0 > s1 ? 1 : 0) : (s1 > s0 ? 1 : 0));
  }, 0);
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
  // Sort ascending (most negative last) so round -1 = first LB round gets the lowest round_id
  const lowerRounds = [...new Set(
    matches.filter((m) => m.round < 0).map((m) => m.round).sort((a, b) => b - a)
  )];

  const roundIdMap = {};
  upperRounds.forEach((r, i) => { roundIdMap[r] = roundOffset + i; });
  lowerRounds.forEach((r, i) => { roundIdMap[r] = roundOffset + upperRounds.length + i; });

  // For round robin, remap Challonge group_ids (large ints) to 0-based sequential viewer IDs
  const groupIdRemap = {};
  if (stageType === "round_robin") {
    const uniqueGroups = [...new Set(matches.map((m) => m.group_id).filter((g) => g != null))].sort((a, b) => a - b);
    uniqueGroups.forEach((g, i) => { groupIdRemap[g] = groupIdOffset + i; });
  }

  // Sort by suggested_play_order so adjacent pairs (1,2), (3,4)… feed the same next-round match
  const sortedMatches = [...matches].sort((a, b) => (a.suggested_play_order ?? 0) - (b.suggested_play_order ?? 0));

  const roundMatchCounter = {};
  const viewerMatches = sortedMatches.map((m) => {
    const isLower = m.round < 0;
    const roundId = roundIdMap[m.round];
    let groupId;
    if (stageType === "round_robin") {
      groupId = groupIdRemap[m.group_id] ?? groupIdOffset;
    } else {
      groupId = isLower ? 1 : 0;
    }

    const counterKey = `${groupId}-${roundId}`;
    roundMatchCounter[counterKey] = (roundMatchCounter[counterKey] ?? 0) + 1;

    return {
      id:          m.id,
      stage_id:    stageId,
      group_id:    groupId,
      round_id:    roundId,
      number:      roundMatchCounter[counterKey],
      child_count: 0,
      status:      challongeStatus(m),
      opponent1:   toOpponent(resolveId(m.player1_id), resolveId(m.winner_id), m.scores_csv, 0),
      opponent2:   toOpponent(resolveId(m.player2_id), resolveId(m.winner_id), m.scores_csv, 1),
    };
  });

  // For round robin, compute participants per group; for elimination use total count.
  const groupCount = Object.keys(groupIdRemap).length || 1;
  const stageSize = stageType === "round_robin"
    ? Math.ceil(tournament.participants_count / groupCount)
    : tournament.participants_count;

  const stage = {
    id:            stageId,
    tournament_id: 0,
    name:          stageName,
    type:          stageType,
    number:        stageId + 1,
    settings: {
      size:       stageSize,
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
// Group-stage: match has a group_id set, OR is_group_match === true.
// Bracket:     match has no group_id and is_group_match is not true.
export function hasGroupAndBracketStages(matches) {
  const hasGroup   = matches.some((m) => m.group_id != null || m.is_group_match === true);
  const hasBracket = matches.some((m) => m.group_id == null && !m.is_group_match);
  return hasGroup && hasBracket;
}

// Builds separate ViewerData for group stage and bracket stage of a mixed tournament.
export function challongeToViewerDataGroupBracket(challongeData) {
  const { tournament, participants, matches } = challongeData;

  // group_id present OR is_group_match true → round-robin group stage; otherwise → playoff bracket
  const groupMatches   = matches.filter((m) => m.group_id != null || m.is_group_match === true);
  const bracketMatches = matches.filter((m) => m.group_id == null && !m.is_group_match);

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
