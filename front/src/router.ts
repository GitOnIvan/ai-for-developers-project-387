import { createRouter, createWebHistory } from "vue-router";
import BookingPage from "./pages/BookingPage.vue";

export const routes = [
  { path: "/", name: "booking", component: BookingPage },
  {
    path: "/confirmation/:id",
    name: "confirmation",
    component: () => import("./pages/ConfirmationPage.vue"),
  },
  {
    path: "/admin",
    name: "admin",
    component: () => import("./pages/AdminPage.vue"),
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
