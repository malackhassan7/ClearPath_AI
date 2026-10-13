import axios, { AxiosError } from "axios";
import type { ApiError } from "@/api/types";
import { installTokenRefresh } from "@/api/authRefresh";

export class SafeApiError extends Error implements ApiError {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "SafeApiError";
    this.status = status;
    this.code = code;
  }
}
const baseURL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";
export const httpClient = axios.create({
  baseURL,
  timeout: 10000,
  headers: { Accept: "application/json" },
});
installTokenRefresh(httpClient);
httpClient.interceptors.request.use((config) => {
  const token =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("cp-access-token")
      : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
httpClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail?: string; message?: string }>) => {
    if (!error.response)
      return Promise.reject(
        new SafeApiError(
          0,
          "network",
          "The service could not be reached. Please try again.",
        ),
      );
    const status = error.response.status;
    const body = error.response.data;
    const safeMessage =
      typeof body?.detail === "string"
        ? body.detail
        : typeof body?.message === "string"
          ? body.message
          : "The request could not be completed.";
    return Promise.reject(
      new SafeApiError(
        status,
        status === 404 ? "not_found" : "http_error",
        safeMessage
          .replace(/(bearer\s+)[^\s]+/gi, "$1[redacted]")
          .replace(/(token[=: ]+)[^\s,;]+/gi, "$1[redacted]"),
      ),
    );
  },
);
export function getSafeApiError(error: unknown): ApiError {
  return error instanceof SafeApiError
    ? error
    : {
        status: 0,
        code: "unknown",
        message: "Something went wrong. Please try again.",
      };
}
