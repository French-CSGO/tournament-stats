const { Router } = require("express");
const router = Router();

const avatarCache = new Map();
const DEFAULT_AVATAR = "https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg";

router.get("/:steamId/avatar", async (req, res) => {
  const { steamId } = req.params;
  if (!/^\d{17}$/.test(steamId)) return res.redirect(DEFAULT_AVATAR);

  if (avatarCache.has(steamId)) return res.redirect(avatarCache.get(steamId));

  try {
    const r = await fetch(`https://steamcommunity.com/profiles/${steamId}/?xml=1`, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(5000),
    });
    const xml = await r.text();
    const m = xml.match(/<avatarFull><!\[CDATA\[(.*?)\]\]><\/avatarFull>/);
    const url = m?.[1] || DEFAULT_AVATAR;
    avatarCache.set(steamId, url);
    res.redirect(url);
  } catch {
    res.redirect(DEFAULT_AVATAR);
  }
});

module.exports = router;
