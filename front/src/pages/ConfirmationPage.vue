<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import type { Booking } from "../api/generated";
import { api } from "../api/client";
import { DateTimeUtil } from "../utils/datetime";

const route = useRoute();
const booking = ref<Booking | null>(null);
const notFound = ref(false);

onMounted(async () => {
  const id = route.params.id as string;
  try {
    const res = await api.bookingsGet(id);
    booking.value = res.data;
  } catch {
    notFound.value = true;
  }
});
</script>

<template>
  <div>
    <h1>Подтверждение</h1>
    <p v-if="notFound" class="error" role="alert">Бронирование не найдено.</p>
    <div v-else-if="booking" class="card">
      <h2>Встреча забронирована</h2>
      <p>
        <strong>Когда:</strong>
        {{ DateTimeUtil.formatDateTime(booking.slotStart) }}
      </p>
      <p><strong>Имя:</strong> {{ booking.name }}</p>
      <p><strong>Email:</strong> {{ booking.email }}</p>
      <p v-if="booking.note">
        <strong>Комментарий:</strong> {{ booking.note }}
      </p>
    </div>
    <p v-else class="muted" role="status">Загрузка…</p>
  </div>
</template>
