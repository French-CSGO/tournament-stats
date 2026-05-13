# Tournament Stats

Dashboard de statistiques pour tournois CS:GO et CS2, construit autour de la base de données [get5](https://github.com/French-CSGO/G5API).

## Fonctionnalités

- **Saisons & matchs** — navigation par saison, résultats de séries et de maps
- **Veto visuel** — affichage du ban/pick avec images de maps
- **Statistiques joueurs** — KD, ADR, KAST, multikills (K2–K5), classement dynamique par colonne
- **Détails de round** — timeline chronologique (CT/T, vainqueur, raison) avec kills en tooltip
- **Téléchargement de démos** — upload via token G5API, lien de téléchargement public
- **Page admin** — protégée par code d'accès

## Stack

| Couche | Technologie |
|--------|-------------|
| Frontend | Vue 3 · Vuetify 3 · Chart.js · Vite |
| Backend | Node.js · Express · mysql2 |
| Base de données | MariaDB (schéma get5) |
| Conteneurs | Docker · GHCR |

## Structure du dépôt

```
tournament-stats/
├── backend/          # API Express (Node 20)
├── frontend/         # SPA Vue 3 (Nginx)
└── setup/            # Scripts de réplication MariaDB LAN → VPS
```

## Démarrage rapide (Docker)

### 1. Variables d'environnement

**backend/.env**

```env
PORT=3001

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=get5
DB_PASS=yourpassword
DB_NAME=get5

# Token attendu par G5API pour l'upload de démos
DEMO_UPLOAD_TOKEN=changeme

# URL publique utilisée dans les liens de téléchargement
PUBLIC_URL=https://stats.yourdomain.com

# Code d'accès à la page admin
ADMIN_CODE=changeme
```

**frontend/.env** (optionnel)

```env
# URL de base de votre instance G5V (images de maps dans le veto)
# Laisser vide si G5V est servi sur le même hôte
VITE_G5V_URL=https://ebot.yourdomain.com
```

### 2. Lancer les conteneurs

```bash
# Backend
docker run -d \
  --env-file backend/.env \
  -p 3001:3001 \
  ghcr.io/french-csgo/tournament-stats-backend:latest

# Frontend (proxy vers le backend via variables Nginx)
docker run -d \
  -e BACKEND_HOST=127.0.0.1 \
  -e BACKEND_PORT=3001 \
  -p 80:80 \
  ghcr.io/french-csgo/tournament-stats-frontend:latest
```

## Développement local

```bash
# Backend
cd backend
cp .env.example .env   # adapter les valeurs
npm install
npm run dev            # nodemon sur :3001

# Frontend
cd frontend
cp .env.example .env   # optionnel
npm install
npm run dev            # Vite sur :5173
```

## API – routes principales

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/seasons` | Liste des saisons |
| GET | `/api/matches` | Résultats des matchs |
| GET | `/api/teams` | Équipes |
| GET | `/api/players` | Joueurs |
| GET | `/api/stats` | Statistiques agrégées |
| GET | `/api/rounds/:matchId/:mapNumber` | Timeline des rounds |
| POST | `/api/demos/upload` | Upload de démo (token requis) |
| GET | `/health` | Healthcheck |

## CI / Images Docker

Les images sont publiées automatiquement sur GHCR à chaque push sur `master` ou `dev` :

| Image | Tag `master` | Tag `dev` |
|-------|-------------|-----------|
| `ghcr.io/french-csgo/tournament-stats-backend` | `latest` | `dev` |
| `ghcr.io/french-csgo/tournament-stats-frontend` | `latest` | `dev` |

## Réplication MariaDB LAN → VPS

Voir [`setup/README.md`](setup/README.md) pour la procédure complète (WireGuard + scripts de réplication).

## Changelog

Voir [`CHANGELOG.md`](CHANGELOG.md).
