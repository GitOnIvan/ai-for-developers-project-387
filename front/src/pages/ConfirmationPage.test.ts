import { render, screen } from "@testing-library/vue";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createRouter, createMemoryHistory } from "vue-router";
import ConfirmationPage from "./ConfirmationPage.vue";
import { routes } from "../router";
import { resetData, state } from "../mocks/data";

beforeEach(() => resetData());
afterEach(() => resetData());

async function renderAt(id: string) {
  const router = createRouter({ history: createMemoryHistory(), routes });
  await router.push(`/confirmation/${id}`);
  await router.isReady();
  return render(ConfirmationPage, { global: { plugins: [router] } });
}

describe("ConfirmationPage", () => {
  it("показывает детали существующего бронирования", async () => {
    state.bookings.push({
      id: "bk-1",
      eventTypeId: "et-15",
      slotStart: "2026-09-01T10:00:00.000Z",
      slotEnd: "2026-09-01T10:15:00.000Z",
      name: "Пётр",
      email: "petr@example.com",
      note: "Обсудить проект",
      createdAt: "2026-08-01T00:00:00.000Z",
    });
    await renderAt("bk-1");
    expect(
      await screen.findByText("Встреча забронирована"),
    ).toBeInTheDocument();
    expect(screen.getByText("Пётр")).toBeInTheDocument();
    expect(screen.getByText("petr@example.com")).toBeInTheDocument();
    expect(screen.getByText("Обсудить проект")).toBeInTheDocument();
  });

  it("показывает сообщение, если бронь не найдена", async () => {
    await renderAt("missing");
    expect(await screen.findByRole("alert")).toHaveTextContent(/не найдено/i);
  });
});
