// HLTV Rating 1.0
function calcRating(p) {
  const r = p.roundsplayed;
  if (!r) return 0;
  const kpr = p.kills / r;
  const dpr = p.deaths / r;
  const rmk = ((p.k2 || 0) + 4 * (p.k3 || 0) + 9 * (p.k4 || 0) + 16 * (p.k5 || 0)) / r;
  const rating = (kpr / 0.679 + 0.7 * (1 - dpr) / 0.317 + rmk / 1.277) / 2.7;
  return Math.round(rating * 100) / 100;
}

module.exports = { calcRating };
