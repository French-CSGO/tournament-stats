const { Router } = require("express");
const express = require("express");
const path = require("path");
const fs = require("fs");

const router = Router();

const DEMO_DIR = path.join(__dirname, "../public/demos");
fs.mkdirSync(DEMO_DIR, { recursive: true });

function authDemo(req, res, next) {
  const token = (req.headers["authorization"] || "").replace(/^Bearer\s+/i, "");
  if (token !== process.env.DEMO_UPLOAD_TOKEN) {
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
    if (!filename) return res.status(400).json({ error: "Missing Get5-FileName header" });

    const safe = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, "_");
    const dest = path.join(DEMO_DIR, safe);

    fs.writeFile(dest, req.body, (err) => {
      if (err) {
        console.error("[demo] write error:", err);
        return res.status(500).json({ error: "Write failed" });
      }
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
