// HLTV Rating 2.0 approximation
// Uses kast if available, falls back to 0.7 average
function calcRating(p) {
  const r = p.roundsplayed;
  if (!r) return 0;
  const kpr    = p.kills / r;
  const dpr    = p.deaths / r;
  const adr    = (p.damage || 0) / r;
  const kast   = p.kast != null ? p.kast / r : 0.7;
  const impact = 2.13 * kpr + 0.42 * ((p.assists || 0) / r) - 0.41;
  const rating = 0.0073 * kast + 0.3591 * kpr - 0.5329 * dpr + 0.2372 * impact + 0.0032 * adr + 0.1587;
  return Math.round(rating * 100) / 100;
}

module.exports = { calcRating };
