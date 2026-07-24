<template>
  <div>
    <!-- ACCESS GATE -->
    <template v-if="!authenticated">
      <section class="section" style="min-height:80vh;display:flex;align-items:center;justify-content:center">
        <div style="width:480px;max-width:100%">
          <div style="font-family:var(--font-mono);font-size:11px;letter-spacing:0.14em;color:var(--ink-3);margin-bottom:18px">
            DOC.999 — ACCÈS RESTREINT
          </div>
          <h1 style="font-family:var(--font-display);font-size:64px;font-weight:600;line-height:0.9;margin:0 0 24px;text-transform:uppercase">
            Accès<br /><span style="color:var(--accent)">Restreint</span>
          </h1>
          <p style="font-family:var(--font-mono);font-size:12px;color:var(--ink-3);letter-spacing:0.08em;margin-bottom:32px;text-transform:uppercase;line-height:1.6">
            Cette zone est réservée aux administrateurs.<br />Entrez votre code d'accès pour continuer.
          </p>
          <div style="display:flex;flex-direction:column;gap:16px">
            <div style="font-family:var(--font-mono);font-size:10px;letter-spacing:0.14em;color:var(--ink-3)">
              CODE D'ACCÈS
            </div>
            <input
              type="password"
              v-model="codeInput"
              class="admin-input"
              placeholder="••••••••••••"
              autofocus
              @keydown.enter="login"
            />
            <div v-if="loginError" style="font-family:var(--font-mono);font-size:11px;color:var(--danger);letter-spacing:0.12em">
              CODE INCORRECT
            </div>
            <div style="display:flex;gap:8px">
              <button class="btn primary" @click="login">↳ ACCÉDER</button>
              <router-link to="/" class="btn ghost">ANNULER</router-link>
            </div>
          </div>
        </div>
      </section>
    </template>

    <!-- ADMIN PANEL -->
    <template v-else>
      <section class="hero">
        <div>
          <div class="eyebrow">
            <span style="color:var(--accent)">● DÉVERROUILLÉ · ADMIN</span>
          </div>
          <h1>
            <div>CONTROL<span class="accent">/</span></div>
            <div style="margin-top:0.18em">ROOM<span class="sub">— ops, démos, ingestion</span></div>
          </h1>
        </div>
        <div class="meta-grid">
          <div class="cell">
            <div class="k">Démos manquantes</div>
            <div class="v" :style="{ color: missing.length ? 'var(--warn)' : 'var(--good)' }">
              {{ String(missing.length).padStart(2, "0") }}
            </div>
          </div>
          <div class="cell">
            <div class="k">Fichiers brisés</div>
            <div class="v" :style="{ color: broken.length ? 'var(--danger)' : 'var(--good)' }">
              {{ String(broken.length).padStart(2, "0") }}
            </div>
          </div>
        </div>
      </section>

      <!-- TABS -->
      <div class="season-strip">
        <div class="item" :class="{ on: activeTab === 'missing' }" @click="activeTab = 'missing'">
          <div class="sub">MANQUANTES</div>
          <div class="label" style="font-size:18px">DÉMOS</div>
          <div class="stat">{{ missing.length }} MAPS SANS DÉMO</div>
        </div>
        <div class="item" :class="{ on: activeTab === 'broken' }" @click="activeTab = 'broken'">
          <div class="sub">INTROUVABLES</div>
          <div class="label" style="font-size:18px">FICHIERS</div>
          <div class="stat">{{ broken.length }} RÉFÉRENCES BRISÉES</div>
        </div>
        <div class="item" :class="{ on: activeTab === 'keys' }" @click="activeTab = 'keys'; loadKeys()">
          <div class="sub">ACCÈS</div>
          <div class="label" style="font-size:18px">CLÉS API</div>
          <div class="stat">{{ apiUsers.length }} COMPTE(S) AVEC CLÉ</div>
        </div>
      </div>

      <div v-if="loading" class="section">
        <div style="font-family:var(--font-mono);font-size:11px;letter-spacing:0.14em;color:var(--ink-3)">
          CHARGEMENT…
        </div>
      </div>

      <section v-else-if="activeTab === 'keys'" class="section">
        <div class="section-head">
          <h2>Clés API</h2>
          <div class="right">
            <span class="index">— PG. 03</span>
          </div>
        </div>

        <p style="font-family:var(--font-mono);font-size:11px;color:var(--ink-3);letter-spacing:0.06em;margin-bottom:20px">
          Toutes les routes <code>/api/*</code> (hors upload de démos) exigent une clé API envoyée
          via l'en-tête <code>X-Api-Key</code>, avec un quota de requêtes/minute par clé.
          Les clés sont celles déjà émises par <strong>G5API</strong> (page « Utilisateurs »),
          au format <code>&lt;id&gt;:&lt;clé&gt;</code> — cette page se contente de lister,
          en lecture seule, les comptes qui en disposent. Voir
          <a href="/api/docs" target="_blank" style="color:var(--accent)">/api/docs</a> pour la documentation complète.
        </p>

        <table class="table">
          <thead>
            <tr>
              <th>NOM</th>
              <th>STEAM ID</th>
              <th>RÔLE</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in apiUsers" :key="u.id">
              <td style="font-family:var(--font-display);letter-spacing:0.02em">{{ u.name || '—' }}</td>
              <td><span style="font-family:var(--font-mono);font-size:11px;color:var(--ink-3)">{{ u.steam_id }}</span></td>
              <td class="dim">{{ u.super_admin ? 'SUPER ADMIN' : (u.admin ? 'ADMIN' : '—') }}</td>
            </tr>
            <tr v-if="!apiUsers.length">
              <td colspan="3" style="text-align:center;padding:48px;font-family:var(--font-mono);color:var(--ink-4);letter-spacing:0.12em">
                <div style="font-family:var(--font-display);font-size:56px;color:var(--ink-4);margin-bottom:12px">—</div>
                AUCUN COMPTE AVEC CLÉ API
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section v-else class="section">
        <div class="section-head">
          <h2>{{ activeTab === 'missing' ? 'Démos manquantes' : 'Fichiers introuvables' }}</h2>
          <div class="right">
            <span class="index">— PG. 02</span>
          </div>
        </div>
        <table class="table">
          <thead>
            <tr>
              <th>MATCH</th>
              <th>MAP</th>
              <th class="num">SCORE</th>
              <th class="num">DATE</th>
              <th v-if="activeTab === 'broken'">FICHIER</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="activeTab === 'missing' && missing.length">
              <tr v-for="row in missing" :key="row.match_id + '-' + row.map_name">
                <td>
                  <router-link :to="`/match/${row.match_id}`" style="color:var(--accent)">
                    #{{ row.match_id }}
                  </router-link>
                </td>
                <td style="font-family:var(--font-display);letter-spacing:0.02em;text-transform:uppercase">{{ row.map_name }}</td>
                <td class="num dim">{{ row.team1_name }} {{ row.team1_score }}–{{ row.team2_score }} {{ row.team2_name }}</td>
                <td class="num dim">{{ fmtDate(row.end_time) }}</td>
              </tr>
            </template>
            <template v-else-if="activeTab === 'broken' && broken.length">
              <tr v-for="row in broken" :key="row.match_id + '-' + row.map_name">
                <td>
                  <router-link :to="`/match/${row.match_id}`" style="color:var(--accent)">
                    #{{ row.match_id }}
                  </router-link>
                </td>
                <td style="font-family:var(--font-display);letter-spacing:0.02em;text-transform:uppercase">{{ row.map_name }}</td>
                <td class="num dim">{{ row.team1_name }} {{ row.team1_score }}–{{ row.team2_score }} {{ row.team2_name }}</td>
                <td class="num dim">{{ fmtDate(row.end_time) }}</td>
                <td><span style="font-family:var(--font-mono);font-size:10px;color:var(--ink-3)">{{ row.demoFile }}</span></td>
              </tr>
            </template>
            <tr v-else>
              <td colspan="5" style="text-align:center;padding:48px;font-family:var(--font-mono);color:var(--ink-4);letter-spacing:0.12em">
                <div style="font-family:var(--font-display);font-size:56px;color:var(--ink-4);margin-bottom:12px">—</div>
                AUCUNE ENTRÉE
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- Logout -->
      <div class="section" style="padding-top:0;border-bottom:none">
        <button class="btn ghost" @click="logout">↳ SE DÉCONNECTER</button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref } from "vue";
import {
  getAdminDemosMissing,
  getAdminDemosBroken,
  getAdminApiKeys,
} from "../api/index.js";

const codeInput    = ref("");
const loginError   = ref(false);
const authenticated = ref(false);
const activeTab    = ref("missing");
const loading      = ref(false);
const missing      = ref([]);
const broken       = ref([]);

const apiUsers = ref([]);

const STORAGE_KEY = "admin_code";

function login() {
  loginError.value = false;
  loadData(codeInput.value);
}

function logout() {
  authenticated.value = false;
  localStorage.removeItem(STORAGE_KEY);
  codeInput.value = "";
}

async function loadData(code) {
  loading.value = true;
  try {
    const [m, b] = await Promise.all([
      getAdminDemosMissing(code),
      getAdminDemosBroken(code),
    ]);
    missing.value = m.data;
    broken.value  = b.data;
    localStorage.setItem(STORAGE_KEY, code);
    authenticated.value = true;
  } catch {
    loginError.value = true;
  } finally {
    loading.value = false;
  }
}

async function loadKeys() {
  const code = localStorage.getItem(STORAGE_KEY);
  const { data } = await getAdminApiKeys(code);
  apiUsers.value = data;
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

const saved = localStorage.getItem(STORAGE_KEY);
if (saved) loadData(saved);
</script>
