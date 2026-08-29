import { render, screen, waitFor } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createRouter, createMemoryHistory } from "vue-router";
import BookingPage from "./BookingPage.vue";
import { routes } from "../router";
import { resetData } from "../mocks/data";

beforeEach(() => resetData());
afterEach(() => resetData());

function makeRouter() {
  return createRouter({ history: createMemoryHistory(), routes });
}

async function renderPage() {
  const router = makeRouter();
  await router.push("/");
  await router.isReady();
  const utils = render(BookingPage, { global: { plugins: [router] } });
  return { ...utils, router };
}

describe("BookingPage (гостевой флоу)", () => {
  it("показывает типы встреч после загрузки", async () => {
    await renderPage();
    expect(await screen.findByText("Быстрый созвон")).toBeInTheDocument();
    expect(screen.getByText("Стандартная встреча")).toBeInTheDocument();
  });

  it("после выбора типа появляется календарь", async () => {
    await renderPage();
    await userEvent.click(
      await screen.findByRole("button", { name: /Стандартная встреча/ }),
    );
    expect(
      await screen.findByRole("heading", { name: "Выберите день" }),
    ).toBeInTheDocument();
  });

  it("после выбора дня показываются слоты этого дня", async () => {
    await renderPage();
    await userEvent.click(
      await screen.findByRole("button", { name: /Стандартная встреча/ }),
    );
    await screen.findByRole("heading", { name: "Выберите день" });

    // Выбираем ближайший рабочий понедельник (детерминированная будущая дата)
    await selectFirstAvailableDay();

    expect(
      await screen.findByRole("heading", { name: "Свободное время" }),
    ).toBeInTheDocument();
    // Есть хотя бы один слот (кнопка со временем формата HH:mm)
    const slotButtons = await screen.findAllByRole("button", {
      name: /^\d{2}:\d{2}$/,
    });
    expect(slotButtons.length).toBeGreaterThan(0);
  });

  it("полный путь: тип → день → слот → форма → подтверждение (навигация)", async () => {
    const { router } = await renderPage();
    await userEvent.click(
      await screen.findByRole("button", { name: /Стандартная встреча/ }),
    );
    await screen.findByRole("heading", { name: "Выберите день" });
    await selectFirstAvailableDay();

    const slotButtons = await screen.findAllByRole("button", {
      name: /^\d{2}:\d{2}$/,
    });
    await userEvent.click(slotButtons[0]);

    await screen.findByRole("heading", { name: "Ваши данные" });
    await userEvent.type(screen.getByLabelText("Имя"), "Мария");
    await userEvent.type(screen.getByLabelText("Email"), "maria@example.com");
    await userEvent.click(screen.getByRole("button", { name: /Записаться/ }));

    await waitFor(() => {
      expect(router.currentRoute.value.name).toBe("confirmation");
    });
    expect(router.currentRoute.value.params.id).toBeTruthy();
  });
});

/**
 * vue-datepicker не рендерит кликабельную сетку в jsdom, поэтому эмулируем
 * выбор дня, вызвав select-date у реального экземпляра AvailabilityCalendar
 * через глобальный поиск компонента в DOM невозможно — вместо этого находим
 * компонент по exposed API через vnode. Проще: вычисляем первый доступный
 * рабочий день и диспатчим кастомное событие невозможно.
 *
 * Используем публичное поведение: находим экземпляр через __vueParentComponent.
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
