require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const path = require("path");
const swaggerUi = require("swagger-ui-express");

const seasonsRouter = require("./routes/seasons");
const matchesRouter = require("./routes/matches");
const teamsRouter = require("./routes/teams");
const demosRouter = require("./routes/demos");
const adminRouter = require("./routes/admin");
const statsRouter   = require("./routes/stats");
const playersRouter = require("./routes/players");
const roundsRouter       = require("./routes/rounds");
const tournamentsRouter  = require("./routes/tournaments");

const apiKeys = require("./utils/apiKeys");
const apiKeyAuth = require("./middleware/apiKeyAuth");
const apiRateLimiter = require("./middleware/rateLimiter");
const openapiSpec = require("./docs/openapi.json");

const app = express();

app.use(morgan("dev"));
app.use(cors());

app.use(express.json());

// Static demo files
app.use("/demos", express.static(path.join(__dirname, "public/demos")));

// Documentation interactive — publique, aucune clé requise pour la consulter
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));
app.get("/api/docs.json", (req, res) => res.json(openapiSpec));

// Toutes les routes /api/* (hors /api/demos, qui a sa propre auth par token)
// requièrent une clé API valide et sont soumises au rate limit de cette clé.
const protectedApi = [apiKeyAuth, apiRateLimiter];

app.use("/api/seasons", protectedApi, seasonsRouter);
app.use("/api/matches", protectedApi, matchesRouter);
app.use("/api/teams", protectedApi, teamsRouter);
app.use("/api/demos", demosRouter);
app.use("/api/admin", protectedApi, adminRouter);
app.use("/api/stats",   protectedApi, statsRouter);
app.use("/api/players", protectedApi, playersRouter);
app.use("/api/rounds",       protectedApi, roundsRouter);
app.use("/api/tournaments",  protectedApi, tournamentsRouter);

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 3001;

(async () => {
  await apiKeys.ensureTable();
  await apiKeys.seedInternalKey();
  app.listen(PORT, () => console.log(`[backend] listening on :${PORT}`));
})().catch((err) => {
  console.error("[backend] startup failed:", err);
  process.exit(1);
});
