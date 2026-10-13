export const env = {
  useMockApi: import.meta.env.VITE_USE_MOCK_API === "true",
  apiBaseUrl:
    (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
    "http://localhost:8000/api/v1",
  appName:
    (import.meta.env.VITE_APP_NAME as string | undefined) ?? "ClearPath-TN",
};
