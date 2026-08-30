import { createApp } from "vue";
import "@vuepic/vue-datepicker/dist/main.css";
import "./style.css";
import App from "./App.vue";
import { router } from "./router";

async function bootstrap() {
  // В dev-режиме бэка пока нет — поднимаем MSW worker (включается по умолчанию).
  // Отключить моки и ходить в реальный бэк: VITE_MOCK_API=false npm run dev
  const useMockApi = (import.meta.env.VITE_MOCK_API ?? "true") !== "false";
  if (import.meta.env.DEV && useMockApi) {
    const { worker } = await import("./mocks/browser");
    await worker.start({ onUnhandledRequest: "bypass" });
  }
  createApp(App).use(router).mount("#app");
}

bootstrap();
