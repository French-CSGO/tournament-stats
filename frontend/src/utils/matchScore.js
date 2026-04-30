/**
 * Returns the display scores for a match.
 * For BO1 (max_maps === 1), returns the actual map round scores.
 * For BO3/BO5, returns series scores.
 */
export function matchScore(m) {
  if (m.max_maps === 1 && m.map1_team1_score != null) {
    return { t1: m.map1_team1_score, t2: m.map1_team2_score };
  }
  return {
    t1: m.team1_series_score ?? m.team1_score ?? 0,
    t2: m.team2_series_score ?? m.team2_score ?? 0,
  };
}
