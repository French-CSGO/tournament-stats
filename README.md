# Tournament Stats

Dashboard de statistiques pour tournois CS:GO et CS2, construit autour de la base de données [get5](https://github.com/French-CSGO/G5API).

## Fonctionnalités

- **Saisons & matchs** — navigation par saison, résultats de séries et de maps
- **Veto visuel** — affichage du ban/pick avec images de maps
- **Statistiques joueurs** — KD, ADR, KAST, multikills (K2–K5), classement dynamique par colonne
- **Détails de round** — timeline chronologique (CT/T, vainqueur, raison) avec kills en tooltip
- **Téléchargement de démos** — upload via token G5API, lien de téléchargement public
- **Page admin** — protégée par code d'accès, gestion des clés API
- **API publique documentée** — clé API + rate limiting par clé, doc interactive sur `/api/docs`

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

# Voir section "API — authentification par clé & rate limiting" ci-dessous.
# DOIT être identique à DBKEY / server.dbKey côté G5API : c'est ce qui permet
# de déchiffrer les clés API déjà stockées dans user.api_key (aucune écriture
# n'est faite dans cette base, qui peut être une réplique en lecture seule).
G5API_DB_KEY=

# Quota de requêtes/minute par clé API "utilisateur G5API"
API_KEY_RATE_LIMIT_PER_MIN=60

# Clé API "interne" utilisée par le frontend pour appeler /api/* — un simple
# secret partagé (pas une clé G5API), jamais stocké en base. Même valeur à
# définir sur le conteneur frontend.
INTERNAL_API_KEY=changeme
INTERNAL_API_KEY_RATE_LIMIT=6000
```

**frontend/.env** (optionnel)

```env
# URL de base de votre instance G5V (images de maps dans le veto)
# Laisser vide si G5V est servi sur le même hôte
VITE_G5V_URL=https://ebot.yourdomain.com

# Doit correspondre à INTERNAL_API_KEY du backend
INTERNAL_API_KEY=changeme
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
  -e INTERNAL_API_KEY=changeme \
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

| Méthode | Route | Description | Clé API requise |
|---------|-------|-------------|:---:|
| GET | `/api/seasons` | Liste des saisons | ✅ |
| GET | `/api/matches/:id` | Détail d'un match | ✅ |
| GET | `/api/teams` | Équipes | ✅ |
| GET | `/api/players/:steamId/avatar` | Avatar Steam | ✅ |
| GET | `/api/stats` | Statistiques agrégées | ✅ |
| GET | `/api/rounds/:map_id` | Timeline des rounds | ✅ |
| GET | `/api/tournaments/:slug` | Bracket Challonge | ✅ |
| GET | `/api/admin/*` | Admin (démos, comptes avec clé API) | ✅ + `x-admin-code` |
| POST | `/api/demos` | Upload de démo (token G5API requis) | ❌ |
| GET | `/api/demos/:filename` | Téléchargement public d'une démo | ❌ |
| GET | `/api/docs` | Documentation interactive (Swagger UI) | ❌ |
| GET | `/health` | Healthcheck | ❌ |

Liste complète, schémas et exemples : voir `/api/docs` (Swagger UI, générée depuis [`backend/docs/openapi.json`](backend/docs/openapi.json)).

## API — authentification par clé & rate limiting

Toutes les routes `/api/*` (à l'exception de `/api/demos`, qui garde son propre système de token pour G5API) exigent une clé API valide.

Ce backend **ne gère pas ses propres clés** : la base de données à laquelle il se connecte peut être une réplique en lecture seule (voir [Réplication MariaDB LAN → VPS](#réplication-mariadb-lan--vps)), donc aucune écriture (création de table, `INSERT`, `UPDATE`) n'y est jamais faite. À la place, il réutilise les clés déjà émises par **G5API** :

- **Format de la clé** : G5API stocke, pour chaque utilisateur, une clé API chiffrée (AES-OFB) dans `user.api_key`, et l'affiche à l'utilisateur sous la forme `<id>:<clé déchiffrée>` (son en-tête `user-api`). C'est exactement cette valeur qu'il faut envoyer ici.
- **Envoi de la clé** : en-tête `X-Api-Key: <id>:<clé>` ou `Authorization: Bearer <id>:<clé>`.
- **Déchiffrement** : le backend lit `user.api_key` (lecture seule) et le déchiffre avec `G5API_DB_KEY`, qui **doit être identique** à `DBKEY` / `server.dbKey` côté G5API. Sans cette valeur, ou si elle diffère, aucune clé ne peut être validée.
- **Création / révocation** : entièrement gérées côté G5API (page « Utilisateurs ») — cette application ne fait que vérifier une clé existante. La page Admin (onglet « Clés API ») liste, en lecture seule, les comptes G5API qui en disposent.
- **Rate limiting** : chaque clé a son propre quota de requêtes par minute (`API_KEY_RATE_LIMIT_PER_MIN`, 60 par défaut — un seul quota global, pas de configuration par clé). Les en-têtes `RateLimit-*` sont renvoyés sur chaque réponse ; un dépassement renvoie `429 Too Many Requests`.
- **Frontend** : le SPA appelle `/api/*` via le proxy Nginx (prod) ou Vite (dev), qui injecte automatiquement une clé « interne » (`INTERNAL_API_KEY`) côté serveur — le navigateur ne voit jamais cette clé. Il ne s'agit pas d'une clé G5API : c'est un simple secret partagé, comparé directement et jamais stocké en base, avec son propre quota (`INTERNAL_API_KEY_RATE_LIMIT`).

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
