import { render, screen, waitFor, within } from "@testing-library/vue";
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

    const dialog = await screen.findByRole("dialog", {
      name: "Подтвердите запись",
    });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText("Стандартная встреча")).toBeInTheDocument();
    expect(within(dialog).getByText("Выбранная дата")).toBeInTheDocument();
    expect(within(dialog).getByText("Выбранное время")).toBeInTheDocument();
    expect(within(dialog).getByText("admin")).toBeInTheDocument();
    expect(screen.getByLabelText("Имя")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("после заполнения формы показывает подтверждение в той же модалке", async () => {
    const { router } = await renderPage();
    await screen.findByRole("region", { name: "Календарь" });
    await selectFirstAvailableDay();

    const slotButtons = await screen.findAllByRole("button", {
      name: /^\d{2}:\d{2}$/,
    });
    await userEvent.click(slotButtons[0]);
    await userEvent.click(screen.getByRole("button", { name: /Продолжить/ }));

    const dialog = await screen.findByRole("dialog");
    await userEvent.type(screen.getByLabelText("Имя"), "Мария");
    await userEvent.type(screen.getByLabelText("Email"), "maria@example.com");
    await userEvent.click(screen.getByRole("button", { name: /Записаться/ }));

    expect(
      await within(dialog).findByText("Встреча забронирована"),
    ).toBeInTheDocument();
    expect(within(dialog).getByText("Мария")).toBeInTheDocument();
    expect(within(dialog).getByText("maria@example.com")).toBeInTheDocument();
    // остаёмся на странице расписания, без перехода на отдельный роут
    expect(router.currentRoute.value.name).toBe("bookingSchedule");
  });

  it("после брони и закрытия модалки забронированный слот исчезает из списка", async () => {
    await renderPage();
    await screen.findByRole("region", { name: "Календарь" });
    await selectFirstAvailableDay();

    const slotButtons = await screen.findAllByRole("button", {
      name: /^\d{2}:\d{2}$/,
    });
    const bookedLabel = slotButtons[0].textContent?.trim() ?? "";
    const countBefore = slotButtons.length;
    await userEvent.click(slotButtons[0]);
    await userEvent.click(screen.getByRole("button", { name: /Продолжить/ }));

    await screen.findByRole("dialog");
    await userEvent.type(screen.getByLabelText("Имя"), "Мария");
    await userEvent.type(screen.getByLabelText("Email"), "maria@example.com");
    await userEvent.click(screen.getByRole("button", { name: /Записаться/ }));
    await screen.findByText("Встреча забронирована");

    await userEvent.click(screen.getByRole("button", { name: /Закрыть/ }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    await waitFor(() => {
      const after = screen.queryAllByRole("button", { name: /^\d{2}:\d{2}$/ });
      expect(after.length).toBeLessThan(countBefore);
      expect(after.some((b) => b.textContent?.trim() === bookedLabel)).toBe(
        false,
      );
    });
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
