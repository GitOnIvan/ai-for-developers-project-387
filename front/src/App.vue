<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
</script>

<template>
  <div class="app">
    <header class="app-header">
      <RouterLink to="/" class="brand">Meetly</RouterLink>
      <nav>
        <RouterLink to="/">Записаться</RouterLink>
        <RouterLink to="/admin">Владелец</RouterLink>
      </nav>
    </header>
    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>
