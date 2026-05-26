<template>
  <th
    :class="[(num ? 'num ' : ''), (sortKey === k ? 'sorted' : '')]"
    @click="$emit('sort', k)"
  >
    {{ label }}
    <span class="arr">{{ sortKey === k ? (sortDir === 'asc' ? '▲' : '▼') : '·' }}</span>
  </th>
</template>

<script setup>
defineProps({
  k:       { type: String, required: true },
  label:   { type: String, required: true },
  sortKey: { type: String, default: "" },
  sortDir: { type: String, default: "desc" },
  num:     { type: Boolean, default: false },
});
defineEmits(["sort"]);
</script>
