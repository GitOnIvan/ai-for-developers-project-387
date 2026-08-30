import { render, screen, waitFor, within } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import EventTypeManager from "./EventTypeManager.vue";
import { resetData, state } from "../mocks/data";

beforeEach(() => resetData());
afterEach(() => resetData());

describe("EventTypeManager", () => {
  it("показывает существующие типы встреч", async () => {
    render(EventTypeManager);
    expect(await screen.findByText("Быстрый созвон")).toBeInTheDocument();
    expect(screen.getByText("Стандартная встреча")).toBeInTheDocument();
  });

  it("список типов оформлен карточками как в /booking, с описанием, по одной на строку", async () => {
    render(EventTypeManager);
    const item = (await screen.findByText("Быстрый созвон")).closest("li")!;
    expect(item).toHaveClass("event-type-card");
    expect(item.closest("ul")).toHaveClass("event-type-list");
    expect(within(item).getByText("15 мин")).toBeInTheDocument();
    expect(
      screen.getByText(/Короткий 15-минутный разговор/),
    ).toBeInTheDocument();

    const row = item.querySelector(".event-type-row")!;
    expect(row).toContainElement(screen.getByText("Быстрый созвон"));
    expect(row).toContainElement(
      screen.getByText(/Короткий 15-минутный разговор/),
    );
    expect(row).toContainElement(
      within(item).getByRole("button", { name: "Деактивировать" }),
    );
    expect(row).toContainElement(
      within(item).getByRole("button", { name: "Удалить" }),
    );
  });

  it("заголовки 'Типы встреч' и 'Добавить тип' одного размера", () => {
    render(EventTypeManager);
    expect(screen.getByRole("heading", { name: "Типы встреч" })).toHaveClass(
      "admin-heading",
    );
    expect(screen.getByRole("heading", { name: "Добавить тип" })).toHaveClass(
      "admin-heading",
    );
  });

  it("создаёт новый тип встречи", async () => {
    render(EventTypeManager);
    await screen.findByText("Быстрый созвон");
    await userEvent.type(screen.getByLabelText("Название"), "Интервью");
    await userEvent.type(screen.getByLabelText("Slug"), "interview-45");
    const duration = screen.getByLabelText("Длительность");
    await userEvent.clear(duration);
    await userEvent.type(duration, "45");
    await userEvent.click(screen.getByRole("button", { name: "Добавить" }));
    expect(await screen.findByText("Интервью")).toBeInTheDocument();
  });

  it("деактивирует тип встречи", async () => {
    render(EventTypeManager);
    const item = (await screen.findByText("Быстрый созвон")).closest("li")!;
    await userEvent.click(
      within(item).getByRole("button", { name: "Деактивировать" }),
    );
    await waitFor(() => {
      const updated = screen.getByText("Быстрый созвон").closest("li")!;
      expect(within(updated).getByText(/неактивен/)).toBeInTheDocument();
    });
  });

  it("кнопки Деактивировать/Активировать/Удалить/Добавить единого размера", async () => {
    render(EventTypeManager);
    await screen.findByText("Быстрый созвон");
    const item = screen.getByText("Быстрый созвон").closest("li")!;
    const deactivate = within(item).getByRole("button", {
      name: "Деактивировать",
    });
    expect(deactivate).toHaveClass("admin-action");
    expect(within(item).getByRole("button", { name: "Удалить" })).toHaveClass(
      "admin-action",
    );
    expect(screen.getByRole("button", { name: "Добавить" })).toHaveClass(
      "admin-action",
    );

    await userEvent.click(deactivate);
    expect(
      await within(item).findByRole("button", { name: "Активировать" }),
    ).toHaveClass("admin-action");
  });

  it("показывает ошибку 409 при удалении типа с бронированиями", async () => {
    // Добавляем бронь на тип et-15
    state.bookings.push({
      id: "bk-1",
      eventTypeId: "et-15",
      slotStart: "2026-09-01T10:00:00.000Z",
      slotEnd: "2026-09-01T10:15:00.000Z",
      name: "Гость",
      email: "g@example.com",
      createdAt: "2026-08-01T00:00:00.000Z",
    });
    render(EventTypeManager);
    const item = (await screen.findByText("Быстрый созвон")).closest("li")!;
    await userEvent.click(
      within(item).getByRole("button", { name: "Удалить" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /бронированиями|деактивируйте/i,
    );
  });
});
