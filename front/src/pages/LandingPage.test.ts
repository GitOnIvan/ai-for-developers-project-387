import { render, screen, waitFor } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { createRouter, createMemoryHistory } from "vue-router";
import LandingPage from "./LandingPage.vue";
import { routes } from "../router";

function makeRouter() {
  return createRouter({ history: createMemoryHistory(), routes });
}

async function renderPage() {
  const router = makeRouter();
  await router.push("/");
  await router.isReady();
  const utils = render(LandingPage, { global: { plugins: [router] } });
  return { ...utils, router };
}

describe("LandingPage", () => {
  it("показывает главный заголовок и подзаголовок оффера", async () => {
    await renderPage();
    expect(
      screen.getByRole("heading", { level: 1, name: "Calendar" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Забронируйте встречу за минуту/),
    ).toBeInTheDocument();
    expect(screen.getByText("БЫСТРАЯ ЗАПИСЬ НА ЗВОНОК")).toBeInTheDocument();
  });

  it("показывает карточку возможностей со списком", async () => {
    await renderPage();
    expect(
      screen.getByRole("heading", { name: "Возможности" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("listitem").length).toBe(3);
  });

  it("по клику на CTA переходит к выбору типа встречи (/booking)", async () => {
    const { router } = await renderPage();
    await userEvent.click(screen.getByRole("link", { name: /Записаться/ }));
    await waitFor(
      () => {
        expect(router.currentRoute.value.name).toBe("booking");
      },
      { timeout: 3000 },
    );
  });
});
