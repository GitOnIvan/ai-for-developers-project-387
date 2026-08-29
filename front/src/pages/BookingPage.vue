<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import type { Booking, EventType, Slot } from "../api/generated";
import { api } from "../api/client";
import EventTypeSelect from "../components/EventTypeSelect.vue";
import AvailabilityCalendar from "../components/AvailabilityCalendar.vue";
import SlotPicker from "../components/SlotPicker.vue";
import BookingForm from "../components/BookingForm.vue";

const router = useRouter();

const eventTypes = ref<EventType[]>([]);
const selectedEventType = ref<EventType | null>(null);
const selectedDate = ref<string | null>(null);
const slots = ref<Slot[]>([]);
const slotsLoading = ref(false);
const selectedSlot = ref<Slot | null>(null);

onMounted(async () => {
  const res = await api.eventTypesList();
  eventTypes.value = res.data;
});

function onSelectEventType(et: EventType) {
  selectedEventType.value = et;
  selectedDate.value = null;
  selectedSlot.value = null;
  slots.value = [];
}

async function onSelectDate(date: string) {
  if (!selectedEventType.value) return;
  selectedDate.value = date;
  selectedSlot.value = null;
  slotsLoading.value = true;
  try {
    const res = await api.slotsList({
      eventTypeId: selectedEventType.value.id,
      date,
    });
    slots.value = res.data;
  } finally {
    slotsLoading.value = false;
  }
}

function onSelectSlot(slot: Slot) {
  selectedSlot.value = slot;
}

function onBooked(booking: Booking) {
  router.push({ name: "confirmation", params: { id: booking.id } });
}
</script>

<template>
  <div>
    <h1>Записаться на встречу</h1>

    <EventTypeSelect
      :event-types="eventTypes"
      :selected-id="selectedEventType?.id"
      @select="onSelectEventType"
    />

    <AvailabilityCalendar
      v-if="selectedEventType"
      :key="selectedEventType.id"
      :event-type-id="selectedEventType.id"
      @select-date="onSelectDate"
    />

    <SlotPicker
      v-if="selectedEventType && selectedDate"
      :slots="slots"
      :loading="slotsLoading"
      :selected-start="selectedSlot?.start"
      @select="onSelectSlot"
    />

    <BookingForm
      v-if="selectedEventType && selectedSlot"
      :event-type-id="selectedEventType.id"
      :slot="selectedSlot"
      @booked="onBooked"
    />
  </div>
</template>
