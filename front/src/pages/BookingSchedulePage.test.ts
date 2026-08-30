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
    expect(
      await screen.findByRole("region", { name: "Сводка встречи" }),
    ).toBeInTheDocument();
    expect(screen.getByText("admin")).toBeInTheDocument();
    expect(await screen.findByText("Стандартная встреча")).toBeInTheDocument();
  });

  it("показывает календарь и начальный статус без выбранных даты/времени", async () => {
    await renderPage();
    expect(
      await screen.findByRole("region", { name: "Календарь" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Дата не выбрана")).toBeInTheDocument();
    expect(screen.getByText("Время не выбрано")).toBeInTheDocument();
  });

  it("после выбора даты показывает слоты и блокирует кнопку продолжить", async () => {
    await renderPage();
    await screen.findByRole("region", { name: "Календарь" });
    await selectFirstAvailableDay();

    expect(
      await screen.findByRole("heading", { name: "Доступные слоты" }),
    ).toBeInTheDocument();
    const slotButtons = await screen.findAllByRole("button", {
      name: /^\d{2}:\d{2}$/,
    });
    expect(slotButtons.length).toBeGreaterThan(0);

    const continueButton = screen.getByRole("button", { name: /Продолжить/ });
    expect(continueButton).toBeDisabled();
  });

  it("после выбора слота активирует продолжить и открывает модалку с формой", async () => {
    await renderPage();
    await screen.findByRole("region", { name: "Календарь" });
    await selectFirstAvailableDay();

    const slotButtons = await screen.findAllByRole("button", {
      name: /^\d{2}:\d{2}$/,
    });
    await userEvent.click(slotButtons[0]);

    const continueButton = screen.getByRole("button", { name: /Продолжить/ });
    expect(continueButton).toBeEnabled();
    await userEvent.click(continueButton);

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: "Ваши данные" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Имя")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("после заполнения формы в модалке переходит на страницу подтверждения", async () => {
    const { router } = await renderPage();
    await screen.findByRole("region", { name: "Календарь" });
    await selectFirstAvailableDay();

    const slotButtons = await screen.findAllByRole("button", {
      name: /^\d{2}:\d{2}$/,
    });
    await userEvent.click(slotButtons[0]);
    await userEvent.click(screen.getByRole("button", { name: /Продолжить/ }));

    await screen.findByRole("dialog");
    await userEvent.type(screen.getByLabelText("Имя"), "Мария");
    await userEvent.type(screen.getByLabelText("Email"), "maria@example.com");
    await userEvent.click(screen.getByRole("button", { name: /Записаться/ }));

    await waitFor(() => {
      expect(router.currentRoute.value.name).toBe("confirmation");
    });
    expect(router.currentRoute.value.params.id).toBeTruthy();
  });

  it("модалку можно закрыть, оставаясь на странице выбора слота", async () => {
    const { router } = await renderPage();
    await screen.findByRole("region", { name: "Календарь" });
    await selectFirstAvailableDay();

    const slotButtons = await screen.findAllByRole("button", {
      name: /^\d{2}:\d{2}$/,
    });
    await userEvent.click(slotButtons[0]);
    await userEvent.click(screen.getByRole("button", { name: /Продолжить/ }));

    await screen.findByRole("dialog");
    await userEvent.click(screen.getByRole("button", { name: /Закрыть/ }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(router.currentRoute.value.name).toBe("bookingSchedule");
  });

  it("кнопка назад возвращает на выбор типа", async () => {
    const { router } = await renderPage();
    await screen.findByRole("region", { name: "Календарь" });
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
  const host = (await screen.findByRole("region", {
    name: "Календарь",
  })) as HTMLElement & {
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
