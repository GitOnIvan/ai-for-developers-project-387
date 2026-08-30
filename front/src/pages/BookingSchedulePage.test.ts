import { render, screen, waitFor } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createRouter, createMemoryHistory } from "vue-router";
import BookingSchedulePage from "./BookingSchedulePage.vue";
import { routes } from "../router";
import { resetData } from "../mocks/data";

beforeEach(() => resetData());
afterEach(() => resetData());

function makeRouter() {
  return createRouter({ history: createMemoryHistory(), routes });
}

async function renderPage(eventTypeId = "et-30") {
  const router = makeRouter();
  await router.push(`/booking/${eventTypeId}`);
  await router.isReady();
  const utils = render(BookingSchedulePage, {
    global: { plugins: [router] },
  });
  return { ...utils, router };
}

describe("BookingSchedulePage", () => {
  it("показывает сводку с организатором и названием типа", async () => {
    await renderPage();
    expect(await screen.findByText("Сводка встречи")).toBeInTheDocument();
    expect(screen.getByText("admin")).toBeInTheDocument();
    expect(await screen.findByText("Стандартная встреча")).toBeInTheDocument();
  });

  it("показывает календарь и начальный статус без выбранных даты/времени", async () => {
    await renderPage();
    expect(
      await screen.findByRole("heading", { name: "Выберите день" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Дата не выбрана")).toBeInTheDocument();
    expect(screen.getByText("Время не выбрано")).toBeInTheDocument();
  });

  it("после выбора даты показывает слоты и блокирует кнопку продолжить", async () => {
    await renderPage();
    await screen.findByRole("heading", { name: "Выберите день" });
    await selectFirstAvailableDay();

    expect(
      await screen.findByRole("heading", { name: "Свободное время" }),
    ).toBeInTheDocument();
    const slotButtons = await screen.findAllByRole("button", {
      name: /^\d{2}:\d{2}$/,
    });
    expect(slotButtons.length).toBeGreaterThan(0);

    const continueButton = screen.getByRole("button", { name: /Продолжить/ });
    expect(continueButton).toBeDisabled();
  });

  it("после выбора слота активирует продолжить и переходит на форму", async () => {
    const { router } = await renderPage();
    await screen.findByRole("heading", { name: "Выберите день" });
    await selectFirstAvailableDay();

    const slotButtons = await screen.findAllByRole("button", {
      name: /^\d{2}:\d{2}$/,
    });
    await userEvent.click(slotButtons[0]);

    const continueButton = screen.getByRole("button", { name: /Продолжить/ });
    expect(continueButton).toBeEnabled();
    await userEvent.click(continueButton);

    await waitFor(() => {
      expect(router.currentRoute.value.name).toBe("bookingConfirm");
    });
    expect(router.currentRoute.value.query.slotStart).toBeTruthy();
    expect(router.currentRoute.value.query.slotEnd).toBeTruthy();
  });

  it("кнопка назад возвращает на выбор типа", async () => {
    const { router } = await renderPage();
    await screen.findByRole("heading", { name: "Выберите день" });
    await userEvent.click(screen.getByRole("button", { name: /Назад/ }));
    await waitFor(() => {
      expect(router.currentRoute.value.name).toBe("booking");
    });
  });
});

/**
 * vue-datepicker не рендерит кликабельную сетку в jsdom, поэтому эмулируем
 * выбор дня через публичный API компонента календаря.
 */
async function selectFirstAvailableDay() {
  const calendarSection = await screen.findByRole("heading", {
    name: "Выберите день",
  });
  const host = calendarSection.closest("section") as HTMLElement & {
    __vueParentComponent?: { exposed?: Record<string, unknown> };
  };
  await waitFor(() => {
    const exposed = host.__vueParentComponent?.exposed as
      { allowedDates?: { value: string[] } } | undefined;
    expect(exposed?.allowedDates?.value.length).toBeGreaterThan(0);
  });
  const exposed = host.__vueParentComponent!.exposed as {
    allowedDates: { value: string[] };
    onSelect: (d: Date) => void;
  };
  const first = exposed.allowedDates.value[0];
  const [y, m, d] = first.split("-").map(Number);
  exposed.onSelect(new Date(y, m - 1, d));
}
