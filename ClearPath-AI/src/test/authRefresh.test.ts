import { describe, it, expect, beforeEach, vi } from "vitest";
import axios, { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from "axios";
import { installTokenRefresh } from "@/api/authRefresh";

function makeClient(handler: (cfg: InternalAxiosRequestConfig) => { status: number; data: unknown }) {
  const adapter: AxiosAdapter = async (cfg) => {
    const { status, data } = handler(cfg);
    const res = { data, status, statusText: "", headers: {}, config: cfg };
    if (status >= 400) throw new AxiosError("fail", "ERR", cfg, null, res);
    return res;
  };
  const c = axios.create({ adapter });
  c.interceptors.request.use((cfg) => {
    cfg.headers.Authorization = `Bearer ${localStorage.getItem("cp-access-token")}`;
    return cfg;
  });
  installTokenRefresh(c);
  return c;
}

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("token refresh", () => {
  it("refreshes an expired access token once and retries the request", async () => {
    localStorage.setItem("cp-access-token", "old");
    localStorage.setItem("cp-refresh-token", "r1");
    vi.spyOn(axios, "post").mockResolvedValue({ data: { access_token: "new" } });
    const client = makeClient((cfg) =>
      cfg.headers.Authorization === "Bearer new" ? { status: 200, data: { ok: true } } : { status: 401, data: { detail: "Invalid or expired token" } },
    );
    const res = await client.get("/projects");
    expect(res.data).toEqual({ ok: true });
    expect(localStorage.getItem("cp-access-token")).toBe("new");
  });

  it("ends the session when the refresh token is also rejected", async () => {
    localStorage.setItem("cp-access-token", "old");
    localStorage.setItem("cp-refresh-token", "bad");
    localStorage.setItem("cp-auth", "true");
    vi.spyOn(axios, "post").mockRejectedValue(new Error("401"));
    const assign = vi.fn();
    vi.stubGlobal("location", { ...window.location, pathname: "/projects", assign });
    const client = makeClient(() => ({ status: 401, data: { detail: "Invalid or expired token" } }));
    await expect(client.get("/projects")).rejects.toBeTruthy();
    expect(localStorage.getItem("cp-auth")).toBeNull();
    expect(assign).toHaveBeenCalledWith("/session-expired");
    vi.unstubAllGlobals();
  });

  it("does not try to refresh a fake local token or a failed login", async () => {
    localStorage.setItem("cp-access-token", "local-token-1");
    localStorage.setItem("cp-refresh-token", "r1");
    const post = vi.spyOn(axios, "post");
    const client = makeClient(() => ({ status: 401, data: {} }));
    await expect(client.get("/projects")).rejects.toBeTruthy();
    await expect(client.post("/auth/login", {})).rejects.toBeTruthy();
    expect(post).not.toHaveBeenCalled();
  });
});
