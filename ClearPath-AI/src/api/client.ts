import axios, { AxiosError } from "axios";
import { env } from "@/lib/env";
import { installTokenRefresh } from "@/api/authRefresh";
import type { ApiError } from "@/types";

export class ApiRequestError extends Error implements ApiError {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
  }
}

export const http = axios.create({ baseURL: env.apiBaseUrl, timeout: 10_000 });
installTokenRefresh(http);

// Send the real backend JWT with every protected API request.
http.interceptors.request.use((config) => {
  const token =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("cp-access-token")
      : null;
  if (token && !token.startsWith("local-token-")) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Normalises every failure to a user-safe ApiError (never leaks stack traces). */
http.interceptors.response.use(
  (r) => r,
  (err: AxiosError<{ detail?: string }>) => {
    if (!err.response)
      return Promise.reject(
        new ApiRequestError(0, "network", "The service could not be reached."),
      );
    const { status, data } = err.response;
    const message =
      typeof data?.detail === "string"
        ? data.detail
        : "The request could not be completed.";
    return Promise.reject(
      new ApiRequestError(
        status,
        status === 404 ? "not_found" : "http_error",
        message,
      ),
    );
  },
);

export function userMessage(e: unknown): string {
  return e instanceof ApiRequestError
    ? e.message
    : "Something went wrong. Please try again.";
}
