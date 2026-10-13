import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Role } from "@/types";

interface Session {
  role: Role;
  signedIn: boolean;
  sessionExpired: boolean;
  highContrast: boolean;
  toast: string;
  setToast: (m: string) => void;
  setRole: (r: Role) => void;
  signIn: (r: Role) => void;
  signOut: () => void;
  toggleContrast: () => void;
}
const Ctx = createContext<Session | null>(null);
const ROLES: Role[] = [
  "user",
  "officer",
  "admin",
  "farmer",
  "entrepreneur",
  "consultant",
  "applicant",
];
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const readRole = (): Role => {
  const v = localStorage.getItem("cp-role");
  return ROLES.includes(v as Role) ? (v as Role) : "user";
};
const hasRealSession = (): boolean => {
  const token = localStorage.getItem("cp-access-token");
  // Remove old client-only sessions created by the previous silent-login fallback.
  if (token?.startsWith("local-token-")) {
    localStorage.removeItem("cp-auth");
    localStorage.removeItem("cp-access-token");
    localStorage.removeItem("cp-refresh-token");
    localStorage.removeItem("cp-auth-user");
    localStorage.removeItem("cp-session-expiry");
    return false;
  }
  return (
    localStorage.getItem("cp-auth") === "true" &&
    Boolean(token) &&
    (!Number(localStorage.getItem("cp-session-expiry") || 0) ||
      Number(localStorage.getItem("cp-session-expiry") || 0) > Date.now())
  );
};

export function SessionProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>(readRole);
  const [signedIn, setSignedIn] = useState(hasRealSession);
  const [sessionExpired, setSessionExpired] = useState(
    localStorage.getItem("cp-auth") === "true" &&
      Boolean(localStorage.getItem("cp-access-token")) &&
      Number(localStorage.getItem("cp-session-expiry") || 0) > 0 &&
      Number(localStorage.getItem("cp-session-expiry") || 0) <= Date.now(),
  );
  const [highContrast, setHighContrast] = useState(
    localStorage.getItem("cp-contrast") === "true",
  );
  const [toast, setToast] = useState("");
  useEffect(() => {
    if (!signedIn) return;
    const checkExpiry = () => {
      let expiry = Number(localStorage.getItem("cp-session-expiry") || 0);
      // Migrate an existing demo session created before expiry metadata was added.
      if (!expiry) {
        expiry = Date.now() + SESSION_TTL_MS;
        localStorage.setItem("cp-session-expiry", String(expiry));
      }
      if (Date.now() >= expiry) {
        localStorage.removeItem("cp-auth");
        localStorage.removeItem("cp-access-token");
        localStorage.removeItem("cp-auth-user");
        setSignedIn(false);
        setSessionExpired(true);
      }
    };
    checkExpiry();
    const timer = window.setInterval(checkExpiry, 15_000);
    return () => window.clearInterval(timer);
  }, [signedIn]);
  useEffect(() => {
    localStorage.setItem("cp-contrast", String(highContrast));
    document.documentElement.classList.toggle("high-contrast", highContrast);
  }, [highContrast]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(t);
  }, [toast]);
  const setRole = useCallback((r: Role) => {
    localStorage.setItem("cp-role", r);
    setRoleState(r);
  }, []);
  const signIn = useCallback(
    (r: Role) => {
      localStorage.setItem("cp-auth", "true");
      const remembered = localStorage.getItem("cp-remember-me") === "true";
      localStorage.setItem(
        "cp-session-expiry",
        String(
          Date.now() + (remembered ? 30 * 24 * 60 * 60 * 1000 : SESSION_TTL_MS),
        ),
      );
      setSessionExpired(false);
      setRole(r);
      setSignedIn(true);
    },
    [setRole],
  );
  const signOut = useCallback(() => {
    localStorage.removeItem("cp-auth");
    localStorage.removeItem("cp-access-token");
    localStorage.removeItem("cp-refresh-token");
    localStorage.removeItem("cp-auth-user");
    localStorage.removeItem("cp-remember-me");
    localStorage.removeItem("cp-session-expiry");
    setSessionExpired(false);
    setSignedIn(false);
  }, []);
  const toggleContrast = useCallback(() => setHighContrast((v) => !v), []);
  const value = useMemo(
    () => ({
      role,
      signedIn,
      sessionExpired,
      highContrast,
      toast,
      setToast,
      setRole,
      signIn,
      signOut,
      toggleContrast,
    }),
    [
      role,
      signedIn,
      sessionExpired,
      highContrast,
      toast,
      setRole,
      signIn,
      signOut,
      toggleContrast,
    ],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useSession(): Session {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSession must be used inside SessionProvider");
  return v;
}
