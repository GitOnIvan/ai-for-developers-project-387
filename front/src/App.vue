<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
</script>

<template>
  <div class="app">
    <header class="app-header">
      <RouterLink to="/" class="brand">
        <svg
          class="brand-icon"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <rect
            x="3"
            y="4"
            width="18"
            height="17"
            rx="3"
            stroke="currentColor"
            stroke-width="2"
          />
          <path
            d="M3 9h18M8 2v4M16 2v4"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
        <span>Meetly</span>
      </RouterLink>
      <nav>
        <RouterLink to="/booking">Записаться</RouterLink>
        <RouterLink to="/admin">Админка</RouterLink>
      </nav>
    </header>
    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>
