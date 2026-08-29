import { createApp } from "vue";
import "@vuepic/vue-datepicker/dist/main.css";
import "./style.css";
import App from "./App.vue";
import { router } from "./router";

async function bootstrap() {
  // В dev-режиме бэка пока нет — поднимаем MSW worker.
  if (import.meta.env.DEV) {
    const { worker } = await import("./mocks/browser");
    await worker.start({ onUnhandledRequest: "bypass" });
  }
  createApp(App).use(router).mount("#app");
}

bootstrap();
