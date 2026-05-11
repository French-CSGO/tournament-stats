# Changelog

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
