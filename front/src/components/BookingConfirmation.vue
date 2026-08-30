<script setup lang="ts">
import type { Booking } from "../api/generated";

defineProps<{
  booking: Booking;
}>();
</script>

<template>
  <section class="booking-confirmation" aria-label="Бронирование подтверждено">
    <h2 class="booking-confirmation-title">Встреча забронирована</h2>
    <dl class="booking-confirmation-details">
      <div class="booking-confirmation-row">
        <dt class="muted">Имя</dt>
        <dd>{{ booking.name }}</dd>
      </div>
      <div class="booking-confirmation-row">
        <dt class="muted">Email</dt>
        <dd>{{ booking.email }}</dd>
      </div>
    </dl>
  </section>
</template>
