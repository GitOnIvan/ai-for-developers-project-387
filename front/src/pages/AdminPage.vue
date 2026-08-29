<script setup lang="ts">
import BookingsTable from "../components/BookingsTable.vue";
import EventTypeManager from "../components/EventTypeManager.vue";
</script>

<template>
  <div>
    <h1>Календарь владельца</h1>
    <BookingsTable />
    <hr />
    <EventTypeManager />
  </div>
</template>
