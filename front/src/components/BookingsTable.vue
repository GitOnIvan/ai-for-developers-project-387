<script setup lang="ts">
import { onMounted, ref } from "vue";
import type { BookingWithEventType } from "../api/generated";
import { api } from "../api/client";
import { DateTimeUtil } from "../utils/datetime";

const bookings = ref<BookingWithEventType[]>([]);
const loading = ref(true);

onMounted(async () => {
  const today = new Date();
  const to = DateTimeUtil.addDays(today, 60);
  try {
    const res = await api.adminBookingsList({
      from: DateTimeUtil.toLocalDateString(today),
      to: DateTimeUtil.toLocalDateString(to),
    });
    bookings.value = res.data;
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <section aria-labelledby="bookings-heading">
    <h2 id="bookings-heading" class="admin-heading">Предстоящие встречи</h2>
    <p v-if="loading" class="muted" role="status">Загрузка…</p>
    <p v-else-if="bookings.length === 0" class="muted">
      Пока нет запланированных встреч.
    </p>
    <div
      v-else
      class="bookings-scroll"
      role="region"
      aria-label="Список предстоящих встреч"
    >
      <table>
        <thead>
          <tr>
            <th>Когда</th>
            <th>Тип</th>
            <th>Гость</th>
            <th>Email</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="b in bookings" :key="b.id">
            <td>{{ DateTimeUtil.formatDateTime(b.slotStart) }}</td>
            <td>{{ b.eventType.name }}</td>
            <td>{{ b.name }}</td>
            <td>{{ b.email }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
