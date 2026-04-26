const AVG_KPR = 0.679;
const AVG_SPR = 0.317;
const AVG_RMK = 1.277;

function calcRating(p) {
  const r = +p.roundsplayed;
  if (!r) return 0;

  const kills  = +p.kills  || 0;
  const deaths = +p.deaths || 0;
  const k1 = +p.k1 || 0;
  const k2 = +p.k2 || 0;
  const k3 = +p.k3 || 0;
  const k4 = +p.k4 || 0;
  const k5 = +p.k5 || 0;

  const killRating     = (kills / r) / AVG_KPR;
  const survivalRating = ((r - deaths) / r) / AVG_SPR;
  const killcount      = k1 + 4*k2 + 9*k3 + 16*k4 + 25*k5;
  const rmkRating      = (killcount / r) / AVG_RMK;

  const rating = (killRating + 0.7 * survivalRating + rmkRating) / 2.7;
  return Math.round(rating * 100) / 100;
}

module.exports = { calcRating };
