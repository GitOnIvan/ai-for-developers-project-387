<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import type { EventType } from "../api/generated";
import { api } from "../api/client";
import EventTypeSelect from "../components/EventTypeSelect.vue";
import OrganizerSummary from "../components/OrganizerSummary.vue";

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
  <div class="booking-select">
    <section
      class="booking-card booking-select-block"
      aria-labelledby="select-heading"
    >
      <OrganizerSummary />
      <div class="summary-block">
        <h2 id="select-heading" class="booking-select-heading">
          Выберите тип встречи
        </h2>
      </div>
    </section>

    <EventTypeSelect :event-types="eventTypes" @select="onSelect" />
  </div>
</template>
