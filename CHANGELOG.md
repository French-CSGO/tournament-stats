# Changelog

## [0.6.0] - 2026-05-26

### Ajouté
- **Redesign complet** — thème éditorial broadcast : fond très sombre (`#0a0a0b`), accent lime `#e6ff4d`, typographie Antonio / JetBrains Mono / Manrope
- **Système de design** — `broadcast.css` : tokens CSS, composants (boutons, chips, tables, cards), breakpoints responsive
- **MapPanel** — bannière procédurale HSL par map, grille de KPIs, scoreboards et timeline intégrés
- **BroadcastTimeline** — barres de rounds par demi-temps, score en temps réel, tooltip interactif avec détail des kills (nom, victime, HS)
- **StatsView** — podium top 3 avec `PodiumCard`, filtre équipe + seuil de rounds (slider), leaderboard triable par toutes les colonnes
- **AdminView** — portail d'accès broadcast (mot de passe), compteurs démos manquantes / fichiers brisés, tableaux avec liens matchs
- **SortTH** — composant de colonne de tableau triable réutilisable
- **PodiumCard** — carte joueur podium avec rang, stats (RATING / K/D / ADR / HS) et couleur d'équipe
- **Pagination** — liste des matchs d'une saison limitée à 10 par page avec contrôles PRÉC / SUIV et indicateur de page

### Modifié
- `App.vue` — barre broadcast avec horloge UTC live, dot ON AIR animé, navigation restructurée
- `MatchView.vue` — hero versus complet, grille veto avec fond map procédural, onglets de maps
- `SeasonsView.vue` — hero avec KPIs globaux, season strip, match live mis en avant, top frags + map pool

### Technique
- `utils/mapData.js` : `MAP_DATA`, `getTeamColor` (hash déterministe), `getTeamTag`, `getMapHue`, `ratingClass`, `formatReason`, `reasonGlyph`
- Polices Google Fonts chargées dans `index.html` : Antonio, JetBrains Mono, Manrope, Newsreader

---

## [0.5.0] - 2026-05-11

### Ajouté
- **Classement dynamique** : colonne `#` dans les tableaux de stats joueurs (vue globale et par saison) — le rang se recalcule en temps réel selon le critère de tri actif choisi par l'utilisateur
- **Timeline des rounds** : visualisation chronologique de chaque round d'une map avec affichage coloré côté CT/T, vainqueur du round et raison de fin (élimination, bombe, temps)
- **Détails des rounds** : kills par round en tooltip sur la timeline (arme, headshot, kill à travers le mur)
- **Fallback round winner** : inférence automatique du vainqueur depuis `player_stat_extras` quand la table `map_round` est vide

### Corrigé
- Calcul des K1 corrigé dans toutes les requêtes stats (`k1 = roundsplayed - k2 - k3 - k4 - k5`)
- Timeline toujours visible avec état de chargement même avant la réponse API
- Détection correcte des rounds gagnés par explosion de bombe
- Gestion d'erreur sur la route rounds (try/catch, logs backend)
- Configuration Nginx : URL backend depuis les variables `BACKEND_HOST` / `BACKEND_PORT`
- Proxy Vite : port backend lu depuis `BACKEND_PORT` / `PORT`

---

## [0.4.0] - 2026-04-29

- Affichage du veto avec images de maps
- Avatars joueurs, multikills
- Score de round (map) au lieu du score de série en BO1
- Vue veto visuelle avec images locales
