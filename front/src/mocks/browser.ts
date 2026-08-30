import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

/** MSW worker для dev-режима в браузере (бэка пока нет). */
export const worker = setupWorker(...handlers);
