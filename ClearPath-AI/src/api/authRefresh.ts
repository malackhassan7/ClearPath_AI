import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";

const ACCESS = "cp-access-token";
const REFRESH = "cp-refresh-token";
const AUTH_URLS = ["/auth/login", "/auth/register", "/auth/refresh"];
const baseURL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  "http://localhost:8000/api/v1";

type Retryable = InternalAxiosRequestConfig & { _retried?: boolean };
let inflight: Promise<string | null> | null = null;

function endSession(): void {
  ["cp-auth", ACCESS, REFRESH, "cp-auth-user", "cp-session-expiry"].forEach(
    (k) => localStorage.removeItem(k),
  );
  if (!window.location.pathname.startsWith("/session-expired"))
    window.location.assign("/session-expired");
}

/** Exchanges the stored refresh token for a new access token (shared by concurrent requests). */
function refreshAccessToken(): Promise<string | null> {
  const refresh = localStorage.getItem(REFRESH);
  if (!refresh) return Promise.resolve(null);
  inflight ??= axios
    .post<{ access_token: string }>(
      `${baseURL}/auth/refresh`,
      { refresh_token: refresh },
      { timeout: 10_000 },
    )
    .then((r) => {
      localStorage.setItem(ACCESS, r.data.access_token);
      return r.data.access_token;
    })
    .catch(() => null)
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/**
 * Access tokens are short-lived (30 min by default). On a 401 from a protected call, refresh once and retry;
 * if that fails, end the session cleanly instead of showing "could not load this page".
 * Register BEFORE any interceptor that rewrites errors.
 */
export function installTokenRefresh(instance: AxiosInstance): void {
  instance.interceptors.response.use(
    (r) => r,
    async (error: AxiosError) => {
      const config = error.config as Retryable | undefined;
      const url = config?.url ?? "";
      const token = localStorage.getItem(ACCESS);
      const eligible =
        error.response?.status === 401 &&
        config &&
        !config._retried &&
        !AUTH_URLS.some((u) => url.includes(u)) &&
        Boolean(token) &&
        !token!.startsWith("local-token-");
      if (!eligible || !config) return Promise.reject(error);
      config._retried = true;
      const fresh = await refreshAccessToken();
      if (!fresh) {
        endSession();
        return Promise.reject(error);
      }
      config.headers.Authorization = `Bearer ${fresh}`;
      return instance.request(config);
    },
  );
}
