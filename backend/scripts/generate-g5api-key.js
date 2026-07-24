#!/usr/bin/env node
// Génère une clé API au même format que G5API (Utils.encrypt / AES-OFB) pour
// créer un compte `user` manuellement en SQL. N'a besoin d'aucune dépendance
// (crypto natif) et n'écrit rien en base — affiche juste ce qu'il faut coller.
//
// Usage:
//   DBKEY="votre_vraie_dbkey_g5api" node generate-g5api-key.js
//
// La DBKEY ne doit jamais quitter votre serveur (ne la collez pas ailleurs).

const crypto = require("crypto");

const dbKey = process.env.DBKEY;
if (!dbKey) {
  console.error("Erreur: variable d'environnement DBKEY manquante.");
  console.error('Usage: DBKEY="votre_dbkey" node generate-g5api-key.js');
  process.exit(1);
}

const keyBuf = Buffer.from(dbKey, "utf8");
if (![16, 24, 32].includes(keyBuf.length)) {
  console.error(`Erreur: DBKEY fait ${keyBuf.length} octets, il en faut 16, 24 ou 32 (AES-128/192/256).`);
  process.exit(1);
}

// Même charset que randomstring({ length: 64, capitalization: "uppercase" })
// utilisé par G5API pour générer ses clés.
const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
function generateRawKey(length = 64) {
  return Array.from(crypto.randomBytes(length))
    .map((b) => CHARSET[b % CHARSET.length])
    .join("");
}

// Reproduit exactement Utils.encrypt de G5API (aes-js, AES-OFB).
function encrypt(plaintext, dbKey) {
  const iv = crypto.randomBytes(16);
  const key = Buffer.from(dbKey, "utf8");
  const cipher = crypto.createCipheriv(`aes-${key.length * 8}-ofb`, key, iv);
  cipher.setAutoPadding(false);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return iv.toString("hex") + ciphertext.toString("hex");
}

const rawKey = generateRawKey();
const encrypted = encrypt(rawKey, dbKey);

console.log("Clé brute (à donner à l'utilisateur, format id:clé une fois inséré) :");
console.log("  " + rawKey);
console.log();
console.log("Valeur chiffrée à insérer dans user.api_key :");
console.log("  " + encrypted);
console.log();
console.log("Exemple d'INSERT (adaptez steam_id / name) :");
console.log(`
INSERT INTO \`user\` (steam_id, name, admin, super_admin, created_at, api_key)
VALUES ('76561198000000000', 'Nom Affiché', 0, 0, NOW(), '${encrypted}');
`);
console.log("Récupérez ensuite l'id auto-incrémenté (SELECT id FROM \`user\` WHERE steam_id = '76561198000000000')");
console.log(`pour construire l'en-tête final : X-Api-Key: <id>:${rawKey}`);
