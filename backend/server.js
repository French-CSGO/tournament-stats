require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const path = require("path");

const seasonsRouter = require("./routes/seasons");
const matchesRouter = require("./routes/matches");
const teamsRouter = require("./routes/teams");
const demosRouter = require("./routes/demos");
const adminRouter = require("./routes/admin");
const statsRouter = require("./routes/stats");

const app = express();

app.use(morgan("dev"));
app.use(cors());

// Raw binary body for demo uploads
app.use("/api/demos", (req, res, next) => {
  if (req.method === "POST") return next();
  express.json()(req, res, next);
});
app.use(express.json());

// Static demo files
app.use("/demos", express.static(path.join(__dirname, "public/demos")));

app.use("/api/seasons", seasonsRouter);
app.use("/api/matches", matchesRouter);
app.use("/api/teams", teamsRouter);
app.use("/api/demos", demosRouter);
app.use("/api/admin", adminRouter);
app.use("/api/stats", statsRouter);

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`[backend] listening on :${PORT}`));
