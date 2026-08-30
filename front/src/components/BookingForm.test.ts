import { render, screen, waitFor } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import BookingForm from "./BookingForm.vue";
import type { Slot } from "../api/generated";
import { resetData } from "../mocks/data";

const slot: Slot = {
  start: "2026-09-01T10:00:00.000Z",
  end: "2026-09-01T10:15:00.000Z",
};

beforeEach(() => resetData());
afterEach(() => resetData());

describe("BookingForm", () => {
  it("валидирует email перед отправкой", async () => {
    render(BookingForm, { props: { eventTypeId: "et-15", slot } });
    await userEvent.type(screen.getByLabelText("Имя"), "Иван");
    await userEvent.type(screen.getByLabelText("Email"), "invalid-email");
    await userEvent.click(screen.getByRole("button", { name: /Записаться/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/email/i);
  });

  it("создаёт бронь и эмитит booked", async () => {
    const { emitted } = render(BookingForm, {
      props: { eventTypeId: "et-15", slot },
    });
    await userEvent.type(screen.getByLabelText("Имя"), "Иван");
    await userEvent.type(screen.getByLabelText("Email"), "ivan@example.com");
    await userEvent.click(screen.getByRole("button", { name: /Записаться/ }));
    await waitFor(() => expect(emitted().booked).toBeTruthy());
    const booking = (emitted().booked[0] as Array<{ name: string }>)[0];
    expect(booking.name).toBe("Иван");
  });

  it("показывает ошибку 409, если слот занят", async () => {
    // Первая бронь занимает слот
    const { unmount } = render(BookingForm, {
      props: { eventTypeId: "et-15", slot },
    });
    await userEvent.type(screen.getByLabelText("Имя"), "Первый");
    await userEvent.type(screen.getByLabelText("Email"), "first@example.com");
    await userEvent.click(screen.getByRole("button", { name: /Записаться/ }));
    await waitFor(() => {});
    unmount();

    // Вторая попытка на тот же слот -> 409
    render(BookingForm, { props: { eventTypeId: "et-15", slot } });
    await userEvent.type(screen.getByLabelText("Имя"), "Второй");
    await userEvent.type(screen.getByLabelText("Email"), "second@example.com");
    await userEvent.click(screen.getByRole("button", { name: /Записаться/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/занят/i);
  });
});
