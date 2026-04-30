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
const statsRouter   = require("./routes/stats");
const playersRouter = require("./routes/players");

const app = express();

app.use(morgan("dev"));
app.use(cors());

app.use(express.json());

// Static demo files
app.use("/demos", express.static(path.join(__dirname, "public/demos")));

app.use("/api/seasons", seasonsRouter);
app.use("/api/matches", matchesRouter);
app.use("/api/teams", teamsRouter);
app.use("/api/demos", demosRouter);
app.use("/api/admin", adminRouter);
app.use("/api/stats",   statsRouter);
app.use("/api/players", playersRouter);

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`[backend] listening on :${PORT}`));
