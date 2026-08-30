<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import type { EventType } from "../api/generated";
import { api } from "../api/client";
import EventTypeSelect from "../components/EventTypeSelect.vue";

const router = useRouter();
const eventTypes = ref<EventType[]>([]);

onMounted(async () => {
  const res = await api.eventTypesList();
  eventTypes.value = res.data;
});

function onSelect(eventType: EventType) {
  router.push({
    name: "bookingSchedule",
    params: { eventTypeId: eventType.id },
  });
}
</script>

<template>
  <div>
    <h1>Записаться на встречу</h1>
    <EventTypeSelect :event-types="eventTypes" @select="onSelect" />
  </div>
</template>
