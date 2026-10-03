import axios, { AxiosError } from "axios";

export const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "http://localhost:4000";

const TOKEN_KEY = "moodquest.token";

export const tokenStorage = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {}
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {}
  },
};

export const api = axios.create({ baseURL: API_URL, timeout: 15000 });

api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let unauthorizedHandler: ((message: string) => void) | null = null;

export function setUnauthorizedHandler(handler: ((message: string) => void) | null) {
  unauthorizedHandler = handler;
}

const AUTH_ENDPOINTS = ["/api/auth/login", "/api/auth/register", "/api/auth/logout"];

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail?: unknown }>) => {
    const url = error.config?.url ?? "";
    if (
      error.response?.status === 401 &&
      tokenStorage.get() &&
      !AUTH_ENDPOINTS.some((path) => url.includes(path))
    ) {
      const detail = error.response.data?.detail;
      unauthorizedHandler?.(typeof detail === "string" ? detail : "Your session has ended. Please log in again.");
    }
    return Promise.reject(error);
  },
);

export const NETWORK_ERROR_MESSAGE =
  "Can't reach the MoodQuest server. Check your connection or make sure the backend is running.";

export function getErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (axios.isAxiosError(error)) {
    if (error.code === "ECONNABORTED") return "The server took too long to respond. Please try again.";
    if (!error.response) return NETWORK_ERROR_MESSAGE;
    const { status, data } = error.response as { status: number; data?: { detail?: unknown } };
    if (typeof data?.detail === "string" && (status < 500 || status === 501)) return data.detail;
    if (status === 503) return typeof data?.detail === "string" ? data.detail : "Service temporarily unavailable.";
    if (status >= 500) return "Something went wrong on our side. Please try again.";
    return fallback;
  }
  return fallback;
}

export function isNetworkError(error: unknown): boolean {
  return axios.isAxiosError(error) && !error.response;
}

export function getStatus(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined;
}
