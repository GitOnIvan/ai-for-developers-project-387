import { createRouter, createWebHistory } from "vue-router";
import LandingPage from "./pages/LandingPage.vue";

export const routes = [
  { path: "/", name: "landing", component: LandingPage },
  {
    path: "/booking",
    name: "booking",
    component: () => import("./pages/BookingSelectPage.vue"),
  },
  {
    path: "/booking/:eventTypeId",
    name: "bookingSchedule",
    component: () => import("./pages/BookingSchedulePage.vue"),
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
