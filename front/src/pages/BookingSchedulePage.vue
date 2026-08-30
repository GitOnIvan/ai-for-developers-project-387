<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { Booking, EventType, Slot } from "../api/generated";
import { api } from "../api/client";
import AvailabilityCalendar from "../components/AvailabilityCalendar.vue";
import BaseModal from "../components/BaseModal.vue";
import BookingConfirmation from "../components/BookingConfirmation.vue";
import BookingForm from "../components/BookingForm.vue";
import EventSummary from "../components/EventSummary.vue";
import SlotPicker from "../components/SlotPicker.vue";

const route = useRoute();
const router = useRouter();
const eventTypeId = route.params.eventTypeId as string;

const eventTypes = ref<EventType[]>([]);
const eventType = computed(
  () => eventTypes.value.find((et) => et.id === eventTypeId) ?? null,
);

const selectedDate = ref<string | null>(null);
const slots = ref<Slot[]>([]);
const slotsLoading = ref(false);
const selectedSlot = ref<Slot | null>(null);
const showConfirm = ref(false);
const confirmedBooking = ref<Booking | null>(null);

onMounted(async () => {
  const res = await api.eventTypesList();
  eventTypes.value = res.data;
});

async function onSelectDate(date: string) {
  selectedDate.value = date;
  selectedSlot.value = null;
  slotsLoading.value = true;
  try {
    const res = await api.slotsList({ eventTypeId, date });
    slots.value = res.data;
  } finally {
    slotsLoading.value = false;
  }
}

function onSelectSlot(slot: Slot) {
  selectedSlot.value = slot;
}

function goBack() {
  router.push({ name: "booking" });
}

function goConfirm() {
  if (!selectedSlot.value) return;
  confirmedBooking.value = null;
  showConfirm.value = true;
}

function onBooked(booking: Booking) {
  confirmedBooking.value = booking;
}

function closeConfirm() {
  showConfirm.value = false;
  confirmedBooking.value = null;
}
</script>

<template>
  <div class="booking-layout">
    <EventSummary
      :event-type="eventType"
      :selected-date="selectedDate"
      :selected-slot-start="selectedSlot?.start ?? null"
    />

    <AvailabilityCalendar
      :event-type-id="eventTypeId"
      @select-date="onSelectDate"
    />

    <section class="booking-card slot-card" aria-labelledby="slot-heading">
      <SlotPicker
        :slots="slots"
        :loading="slotsLoading"
        :selected-start="selectedSlot?.start"
        @select="onSelectSlot"
      />
      <div class="booking-actions">
        <button type="button" class="secondary" @click="goBack">Назад</button>
        <button
          type="button"
          class="primary"
          :disabled="!selectedSlot"
          @click="goConfirm"
        >
          Продолжить
        </button>
      </div>
    </section>

    <BaseModal
      v-if="showConfirm && selectedSlot"
      :aria-label="
        confirmedBooking ? 'Бронирование подтверждено' : 'Подтвердите запись'
      "
      @close="closeConfirm"
    >
      <EventSummary
        class="modal-summary"
        :event-type="eventType"
        :selected-date="selectedDate"
        :selected-slot-start="selectedSlot?.start ?? null"
      />

      <BookingConfirmation
        v-if="confirmedBooking"
        :booking="confirmedBooking"
      />
      <BookingForm
        v-else
        :event-type-id="eventTypeId"
        :slot="selectedSlot"
        @booked="onBooked"
      />
    </BaseModal>
  </div>
</template>
