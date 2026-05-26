export const MAP_DATA = {
  de_mirage:   { name: "MIRAGE",   hue: 38  },
  de_inferno:  { name: "INFERNO",  hue: 16  },
  de_nuke:     { name: "NUKE",     hue: 200 },
  de_overpass: { name: "OVERPASS", hue: 86  },
  de_ancient:  { name: "ANCIENT",  hue: 140 },
  de_anubis:   { name: "ANUBIS",   hue: 48  },
  de_vertigo:  { name: "VERTIGO",  hue: 220 },
  de_dust2:    { name: "DUST II",  hue: 32  },
  de_train:    { name: "TRAIN",    hue: 24  },
  de_cache:    { name: "CACHE",    hue: 82  },
  de_cobblestone: { name: "CBBLE", hue: 28  },
};

export function getMapName(mapId) {
  if (!mapId) return "UNKNOWN";
  const key = mapId.toLowerCase();
  return MAP_DATA[key]?.name || key.replace("de_", "").toUpperCase();
}

export function getMapHue(mapId) {
  if (!mapId) return 200;
  const key = mapId.toLowerCase();
  return MAP_DATA[key]?.hue ?? 200;
}

const TEAM_COLORS = [
  "#e6ff4d", "#7dd3fc", "#fb923c", "#a78bfa",
  "#f87171", "#c084fc", "#facc15", "#34d399",
  "#f472b6", "#60a5fa", "#4ade80", "#fbbf24",
];

export function getTeamColor(teamName) {
  if (!teamName) return "#8a8a82";
  let hash = 0;
  for (let i = 0; i < teamName.length; i++) {
    hash = teamName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TEAM_COLORS[Math.abs(hash) % TEAM_COLORS.length];
}

export function getTeamTag(teamName) {
  if (!teamName) return "??";
  const clean = teamName.trim();
  const words = clean.split(/[\s/_\-·]+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  if (clean.length <= 4) return clean.toUpperCase();
  return clean.slice(0, 3).toUpperCase();
}

const REASON_LABELS = {
  target_bombed:          "BOMB DETONATED",
  bomb_defused:           "BOMB DEFUSED",
  ct_win:                 "CT WIN",
  t_win:                  "T WIN",
  target_saved:           "TIME SAVED",
  draw:                   "DRAW",
  hostages_rescued:       "RESCUE",
  terrorists_neutralized: "CT WINS",
  game_commencing:        "GAME START",
  unknown:                "UNKNOWN",
};

export function formatReason(reason) {
  if (!reason) return "—";
  return REASON_LABELS[reason] || reason.replace(/_/g, " ").toUpperCase();
}

export function reasonGlyph(reason) {
  if (!reason) return "?";
  if (reason.includes("bomb") && !reason.includes("defuse")) return "X";
  if (reason.includes("defuse")) return "D";
  if (reason.includes("time") || reason.includes("saved")) return "T";
  return "K";
}

export function ratingClass(r) {
  const v = parseFloat(r);
  if (v >= 1.25) return "s";
  if (v >= 1.10) return "a";
  if (v >= 0.95) return "b";
  return "c";
}
