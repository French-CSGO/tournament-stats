const { Router } = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = Router();

const DEMO_DIR = path.join(__dirname, "../public/demos");
fs.mkdirSync(DEMO_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: DEMO_DIR,
  filename: (req, file, cb) => {
    const safe = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, safe);
  },
});

const upload = multer({ storage });

function authDemo(req, res, next) {
  const token = (req.headers["authorization"] || "").replace(/^Bearer\s+/i, "");
  if (token !== process.env.DEMO_UPLOAD_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// POST /api/demos
// Headers: Authorization, Get5-MatchId, Get5-MapNumber, Get5-FileName
router.post("/", authDemo, upload.single("demo"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file received" });

  const url = `${process.env.PUBLIC_URL}/demos/${req.file.filename}`;
  console.log(
    `[demo] match=${req.headers["get5-matchid"]} map=${req.headers["get5-mapnumber"]} file=${req.file.filename}`
  );
  res.json({ message: "Success", url });
});

// GET /demos/:filename  (served statically — but also available as explicit route)
router.get("/:filename", (req, res) => {
  const safe = path.basename(req.params.filename).replace(/[^a-zA-Z0-9._-]/g, "_");
  const file = path.join(DEMO_DIR, safe);
  if (!fs.existsSync(file)) return res.status(404).json({ error: "Not found" });
  res.download(file);
});

module.exports = router;
