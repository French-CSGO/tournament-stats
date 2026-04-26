<template>
  <div>
    <h1 class="text-h5 mb-6">Saisons</h1>

    <v-row v-if="loading">
      <v-col v-for="n in 4" :key="n" cols="12" sm="6" md="3">
        <v-skeleton-loader type="card" />
      </v-col>
    </v-row>

    <v-row v-else>
      <v-col
        v-for="season in seasons"
        :key="season.id"
        cols="12" sm="6" md="3"
      >
        <v-card
          :to="`/season/${season.id}`"
          hover
          class="h-100"
          color="surface"
        >
          <v-card-title>{{ season.name }}</v-card-title>
          <v-card-text>
            <div class="text-caption text-medium-emphasis">
              {{ formatDate(season.start_date) }}
              <span v-if="season.end_date"> — {{ formatDate(season.end_date) }}</span>
            </div>
            <v-chip class="mt-2" size="small" color="primary" variant="tonal">
              {{ season.match_count }} matchs
            </v-chip>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { getSeasons } from "../api/index.js";

const seasons = ref([]);
const loading = ref(true);

onMounted(async () => {
  const { data } = await getSeasons();
  seasons.value = data;
  loading.value = false;
});

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "";
</script>
