import { render, screen, waitFor } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createRouter, createMemoryHistory } from "vue-router";
import BookingSelectPage from "./BookingSelectPage.vue";
import { routes } from "../router";
import { resetData } from "../mocks/data";

beforeEach(() => resetData());
afterEach(() => resetData());

function makeRouter() {
  return createRouter({ history: createMemoryHistory(), routes });
}

async function renderPage() {
  const router = makeRouter();
  await router.push("/booking");
  await router.isReady();
  const utils = render(BookingSelectPage, { global: { plugins: [router] } });
  return { ...utils, router };
}

describe("BookingSelectPage", () => {
  it("показывает организатора, заголовок выбора типа и скрывает старый тайтл", async () => {
    await renderPage();
    expect(await screen.findByText("Организатор")).toBeInTheDocument();
    expect(screen.getByText("admin")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Выберите тип встречи" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Записаться на встречу")).not.toBeInTheDocument();
  });

  it("показывает доступные типы встреч", async () => {
    await renderPage();
    expect(await screen.findByText("Быстрый созвон")).toBeInTheDocument();
    expect(screen.getByText("Стандартная встреча")).toBeInTheDocument();
  });

  it("после выбора типа переходит на шаг расписания", async () => {
    const { router } = await renderPage();
    await userEvent.click(
      await screen.findByRole("button", { name: /Стандартная встреча/ }),
    );
    await waitFor(
      () => {
        expect(router.currentRoute.value.name).toBe("bookingSchedule");
      },
      { timeout: 3000 },
    );
    expect(router.currentRoute.value.params.eventTypeId).toBe("et-30");
  });
});
