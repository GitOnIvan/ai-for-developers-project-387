<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { Booking, EventType, Slot } from "../api/generated";
import { api } from "../api/client";
import BookingForm from "../components/BookingForm.vue";

const route = useRoute();
const router = useRouter();
const eventTypeId = route.params.eventTypeId as string;
const slotStart = route.query.slotStart as string;
const slotEnd = route.query.slotEnd as string;

const eventTypes = ref<EventType[]>([]);
const eventType = computed(
  () => eventTypes.value.find((et) => et.id === eventTypeId) ?? null,
);

const slot = computed<Slot | null>(() => {
  if (!slotStart || !slotEnd) return null;
  return { start: slotStart, end: slotEnd };
});

onMounted(async () => {
  const res = await api.eventTypesList();
  eventTypes.value = res.data;
});

function onBooked(booking: Booking) {
  router.push({ name: "confirmation", params: { id: booking.id } });
}
</script>

<template>
  <div>
    <h1>Подтвердите запись</h1>
    <p v-if="!eventType || !slot" class="error" role="alert">
      Некорректные параметры бронирования.
    </p>
    <BookingForm
      v-else
      :event-type-id="eventTypeId"
      :slot="slot"
      @booked="onBooked"
    />
  </div>
</template>
