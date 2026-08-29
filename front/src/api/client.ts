import axios from "axios";
import { getMeetlyAPI } from "./generated";

/**
 * Единый axios-инстанс приложения.
 * Пути в сгенерированном клиенте уже содержат префикс `/api`, поэтому
 * baseURL оставляем пустым — запросы идут на тот же origin и проксируются
 * (в dev) или обслуживаются MSW.
 */
export const axiosInstance = axios.create();

export const api = getMeetlyAPI(axiosInstance);
