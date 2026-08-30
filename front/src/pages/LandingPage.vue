<script setup lang="ts">
import { RouterLink } from "vue-router";

const features = [
  "Выбор удобного времени из доступных слотов",
  "Быстрое бронирование с заметками",
  "Управление встречами в админке",
];
</script>

<template>
  <div class="landing">
    <div class="landing-offer">
      <span class="eyebrow">БЫСТРАЯ ЗАПИСЬ НА ЗВОНОК</span>
      <h1 class="landing-title">Meetly</h1>
      <p class="landing-subtitle">
        Забронируйте встречу за минуту: выберите тип события и удобное время.
      </p>
      <RouterLink to="/booking" class="cta">
        Записаться
        <span aria-hidden="true">→</span>
      </RouterLink>
    </div>

    <aside class="landing-card">
      <h2>Возможности</h2>
      <ul class="features">
        <li v-for="feature in features" :key="feature">{{ feature }}</li>
      </ul>
    </aside>
  </div>
</template>
