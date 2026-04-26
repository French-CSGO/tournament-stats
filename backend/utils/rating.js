const AVG_KPR = 0.679;
const AVG_SPR = 0.317;
const AVG_RMK = 1.277;

function calcRating(p) {
  const r = p.roundsplayed;
  if (!r) return 0;

  const killRating   = (p.kills / r) / AVG_KPR;
  const survivalRating = ((r - p.deaths) / r) / AVG_SPR;
  const killcount    = (p.k1 || 0) + 4*(p.k2 || 0) + 9*(p.k3 || 0) + 16*(p.k4 || 0) + 25*(p.k5 || 0);
  const rmkRating    = (killcount / r) / AVG_RMK;

  const rating = (killRating + 0.7 * survivalRating + rmkRating) / 2.7;
  return Math.round(rating * 100) / 100;
}

module.exports = { calcRating };
