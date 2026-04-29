const { Router } = require("express");
const express = require("express");
const path = require("path");
const fs = require("fs");

const router = Router();

const DEMO_DIR = path.join(__dirname, "../public/demos");
fs.mkdirSync(DEMO_DIR, { recursive: true });

function authDemo(req, res, next) {
  const token = (req.headers["authorization"] || "").replace(/^Bearer\s+/i, "");
  const expected = process.env.DEMO_UPLOAD_TOKEN;
  console.log(`[demo] auth: received token length=${token.length} expected length=${expected?.length ?? 0} match=${token === expected}`);
  if (token !== expected) {
    console.warn(`[demo] auth FAILED — token mismatch`);
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// POST /api/demos — accepts raw octet-stream (sent by G5API vpsRelay)
router.post(
  "/",
  authDemo,
  express.raw({ type: "application/octet-stream", limit: "500mb" }),
  (req, res) => {
    const filename = req.headers["get5-filename"];
    const matchId  = req.headers["get5-matchid"];
    const mapNum   = req.headers["get5-mapnumber"];
    const ct       = req.headers["content-type"];
    console.log(`[demo] POST received — content-type=${ct} match=${matchId} map=${mapNum} file=${filename} body size=${req.body?.length ?? "empty"}`);

    if (!filename) {
      console.warn("[demo] missing Get5-FileName header");
      return res.status(400).json({ error: "Missing Get5-FileName header" });
    }

    const safe = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, "_");
    const dest = path.join(DEMO_DIR, safe);
    console.log(`[demo] writing to ${dest}`);

    fs.writeFile(dest, req.body, (err) => {
      if (err) {
        console.error("[demo] write error:", err);
        return res.status(500).json({ error: "Write failed" });
      }
      const stats = fs.statSync(dest);
      console.log(`[demo] saved ${safe} — ${stats.size} bytes`);
      res.json({ message: "Success", url: `${process.env.PUBLIC_URL}/demos/${safe}` });
    });
  }
);

// GET /demos/:filename
router.get("/:filename", (req, res) => {
  const safe = path.basename(req.params.filename).replace(/[^a-zA-Z0-9._-]/g, "_");
  const file = path.join(DEMO_DIR, safe);
  if (!fs.existsSync(file)) return res.status(404).json({ error: "Not found" });
  res.download(file);
});

module.exports = router;
