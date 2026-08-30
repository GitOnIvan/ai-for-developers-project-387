<script setup lang="ts">
import type { Booking } from "../api/generated";
import { DateTimeUtil } from "../utils/datetime";

defineProps<{
  booking: Booking;
}>();
</script>

<template>
  <section class="booking-confirmation" aria-label="Бронирование подтверждено">
    <h2 class="booking-confirmation-title">Встреча забронирована</h2>
    <dl class="booking-confirmation-details">
      <div class="booking-confirmation-row">
        <dt class="muted">Когда</dt>
        <dd>{{ DateTimeUtil.formatDateTime(booking.slotStart) }}</dd>
      </div>
      <div class="booking-confirmation-row">
        <dt class="muted">Имя</dt>
        <dd>{{ booking.name }}</dd>
      </div>
      <div class="booking-confirmation-row">
        <dt class="muted">Email</dt>
        <dd>{{ booking.email }}</dd>
      </div>
      <div v-if="booking.note" class="booking-confirmation-row">
        <dt class="muted">Комментарий</dt>
        <dd>{{ booking.note }}</dd>
      </div>
    </dl>
  </section>
</template>
