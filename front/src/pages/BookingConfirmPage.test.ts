import { render, screen, waitFor } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createRouter, createMemoryHistory } from "vue-router";
import BookingConfirmPage from "./BookingConfirmPage.vue";
import { routes } from "../router";
import { resetData } from "../mocks/data";

beforeEach(() => resetData());
afterEach(() => resetData());

function makeRouter() {
  return createRouter({ history: createMemoryHistory(), routes });
}

async function renderPage(
  eventTypeId = "et-15",
  slotStart = "2026-09-01T10:00:00.000Z",
  slotEnd = "2026-09-01T10:15:00.000Z",
) {
  const router = makeRouter();
  await router.push({
    path: `/booking/${eventTypeId}/confirm`,
    query: { slotStart, slotEnd },
  });
  await router.isReady();
  const utils = render(BookingConfirmPage, {
    global: { plugins: [router] },
  });
  return { ...utils, router };
}

describe("BookingConfirmPage", () => {
  it("показывает форму бронирования", async () => {
    await renderPage();
    expect(
      await screen.findByRole("heading", { name: "Ваши данные" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Имя")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("после заполнения формы переходит на страницу подтверждения", async () => {
    const { router } = await renderPage();
    await screen.findByLabelText("Имя");

    await userEvent.type(screen.getByLabelText("Имя"), "Мария");
    await userEvent.type(screen.getByLabelText("Email"), "maria@example.com");
    await userEvent.click(screen.getByRole("button", { name: /Записаться/ }));

    await waitFor(() => {
      expect(router.currentRoute.value.name).toBe("confirmation");
    });
    expect(router.currentRoute.value.params.id).toBeTruthy();
  });

  it("показывает ошибку при отсутствии параметров слота", async () => {
    await renderPage("et-15", "", "");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /Некорректные параметры/,
    );
  });
});
