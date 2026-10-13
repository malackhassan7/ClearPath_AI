import { useMemo, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Activity, ArrowRight, Check, CheckCircle2, CircleUserRound, Eye, Landmark, LockKeyhole, ShieldCheck } from "lucide-react";
import type { Role } from "@/types";
import { httpClient } from "@/api/httpClient";

const passwordSchema = z.string().min(8, "Use at least 8 characters").regex(/[a-z]/, "Add a lowercase letter").regex(/[A-Z]/, "Add an uppercase letter").regex(/[0-9]/, "Add a number");
type AuthValues = Record<string, string | boolean>;
const emailSchema = z.string().trim().email("Enter a valid email address");

export function AuthPage({ path, onLogin, navigate, toast }: { path: string; onLogin: (r: Role) => void; navigate: (to: string) => void; toast: (s: string) => void }) {
  const [role, setRole] = useState<Role>("user");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [notice, setNotice] = useState("");
  const [demoCode, setDemoCode] = useState("");
  const [strength, setStrength] = useState(0);
  const isLogin = path === "/login" || path === "/";
  const isRegister = path === "/register";
  const isForgotId = path === "/forgot-user-id";
  const isForgotPassword = path === "/forgot-password";
  const isReset = path === "/reset-password";
  const isVerify = path === "/verify-otp" || path === "/verify-email";
  const title = isLogin ? "Sign in to DairySetu" : isRegister ? "Create your account" : isForgotId ? "Recover your account" : isForgotPassword ? "Reset your password" : isReset ? "Choose a new password" : isVerify ? "Verify your account" : "Account assistance";
  const defaultEmail = role === "officer" ? "meenakshi@fssai-tn.example" : role === "admin" ? "admin@dairysetu.example" : "anitha@dairyventure.example";
  const schema = useMemo(() => {
    if (isLogin) return z.object({ email: emailSchema, password: z.string().min(6, "Password must contain at least 6 characters"), remember: z.boolean().optional() });
    if (isRegister) return z.object({ full_name: z.string().trim().min(2, "Enter your full name"), email: emailSchema, mobile: z.string().regex(/^\+?[0-9 ()-]{8,20}$/, "Enter a valid mobile number"), organization: z.string().trim().min(2, "Enter your entity/dairy name"), role: z.enum(["user", "consultant"]), password: passwordSchema, confirm_password: z.string(), terms_accepted: z.boolean().refine(Boolean, "Accept terms to continue") }).refine(v => v.password === v.confirm_password, { path: ["confirm_password"], message: "Passwords do not match" });
    if (isForgotId || isForgotPassword) return z.object({ identifier: z.string().trim().min(3, "Enter your email address") });
    if (isVerify) return z.object({ email: emailSchema, code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code") });
    if (isReset) return z.object({ email: emailSchema, code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"), password: passwordSchema, confirm_password: z.string() }).refine(v => v.password === v.confirm_password, { path: ["confirm_password"], message: "Passwords do not match" });
    return z.object({ email: z.string().optional() });
  }, [isLogin, isRegister, isForgotId, isForgotPassword, isVerify, isReset]);
  const form = useForm<AuthValues>({ resolver: zodResolver(schema) as never, mode: "onTouched", defaultValues: { email: defaultEmail, password: "Demo@12345", remember: true, full_name: "", mobile: "", organization: "", role: "user", confirm_password: "", terms_accepted: false, code: "" } });
  const password = String(form.watch("password") || "");
  const meter = [/[a-z]/.test(password), /[A-Z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password), password.length >= 12].filter(Boolean).length;
  const err = (name: string) => { const e = (form.formState.errors as Record<string, { message?: string }>)[name]; return e?.message ? <small className="field-error" role="alert">{e.message}</small> : null; };
  const input = (name: string, label: string, props: Record<string, unknown> = {}) => <div className="form-group"><label htmlFor={name}>{label}</label><input id={name} className="form-control" aria-invalid={Boolean((form.formState.errors as Record<string, unknown>)[name])} {...form.register(name as never)} {...props} />{err(name)}</div>;
  const submit = async (values: AuthValues) => {
    setBusy(true); setNotice(""); setDone(false);
    try {
      if (isLogin) {
        try {
          const res = await httpClient.post("/auth/login", { email: values.email, identifier: values.email, password: values.password });
          const data = res.data;
          localStorage.setItem("cp-access-token", data.access_token);
          localStorage.setItem("cp-auth-user", JSON.stringify(data.user));
          localStorage.setItem("cp-role", data.user.role || role);
          localStorage.setItem("cp-auth", "true");
          onLogin(data.user.role as Role);
          return;
        } catch (error) {
          // Live mode must never turn a failed backend login into a fake authenticated session.
          throw error;
        }
      }
      if (isRegister) {
        const res = await httpClient.post("/auth/register", {
          full_name: values.full_name,
          email: values.email,
          phone: values.mobile || null,
          password: values.password,
          role: values.role || "user",
          preferred_language: "en",
        });
        // Registration returns real JWTs; persist them so protected pages can load immediately.
        localStorage.setItem("cp-access-token", res.data.access_token);
        localStorage.setItem("cp-refresh-token", res.data.refresh_token);
        localStorage.setItem("cp-auth-user", JSON.stringify(res.data.user));
        localStorage.setItem("cp-role", res.data.user.role || "user");
        localStorage.setItem("cp-auth", "true");
        onLogin(res.data.user.role as Role);
        return;
      }
      if (isForgotId || isForgotPassword) {
        setNotice("If an account exists with this email, recovery instructions have been sent."); setDone(true);
        return;
      }
      if (isVerify || isReset) {
        setNotice("Verification complete. Please sign in with your password."); setDone(true);
        setTimeout(() => navigate("/login"), 1200);
        return;
      }
    } catch (e: unknown) {
      const error = e as { response?: { status?: number; data?: { detail?: string } }; message?: string };
      const message = error.response?.data?.detail || error.message || "The request could not be completed.";
      setNotice(message); toast(message);
    } finally { setBusy(false); }
  };
  const roleEmail: Record<string, string> = {
    user: "anitha@dairyventure.example",
    officer: "meenakshi@fssai-tn.example",
    admin: "admin@dairysetu.example",
  };
  const codeForm = isVerify || isReset;
  return <div className="auth-screen"><div className="auth-left"><div className="auth-brand"><div className="brand-mark"><Landmark size={23} /></div><div><b>DairySetu<span>-TN</span></b><small>DAIRY ECOSYSTEM PLATFORM</small></div></div><div className="auth-pitch"><div className="eyebrow light"><span /> UNIFIED DAIRY PLATFORM</div><h1>Compliance & Intelligence<br /><i>for Tamil Nadu Dairy.</i></h1><p>One unified digital platform for Tamil Nadu dairy compliance, traceability, market intelligence, and grievance redressal.</p><div className="auth-feature"><span><Check size={15} /></span><div><b>FSSAI / FoSCoS Rule Engine</b><small>Automated categorization and exact statutory fees.</small></div></div><div className="auth-feature"><span><Check size={15} /></span><div><b>Real Government Datasets</b><small>30 districts milk production & official policies.</small></div></div><div className="auth-quote"><div className="quote-mark">“</div><p>Designed as an explainable decision-support layer grounded in official government gazettes.</p><small>DAIRYSETU-TN · OFFICIAL REFERENCE DATA</small></div></div><div className="auth-left-foot">© 2026 DairySetu-TN <span /> Tamil Nadu Dairy Development</div></div>
    <div className="auth-right"><div className="auth-card"><div className="mobile-auth-brand"><div className="brand-mark"><Landmark size={20} /></div><b>DairySetu-TN</b></div><div className="eyebrow">SECURE LOGIN</div><h2>{title}</h2><p className="auth-sub">{isLogin ? "Sign in using your email and password." : isRegister ? "Create a new DairySetu account." : "Account recovery and reset."}</p>
      {isLogin && <div className="form-group"><label>Quick Account Selector</label><div className="role-choices">{([["user", "User / Producer"], ["officer", "FSSAI Officer"], ["admin", "System Admin"]] as const).map(([r, label]) => <button type="button" key={r} className={role === r ? "chosen" : ""} onClick={() => { setRole(r as Role); form.setValue("email", roleEmail[r]); form.setValue("password", "Demo@12345"); }}>{label}</button>)}</div><small>Use an account registered in this local database. Quick selectors are not pre-created accounts.</small></div>}
      <form onSubmit={form.handleSubmit(submit)} noValidate>
        {isLogin && <>{input("email", "Email Address", { type: "email", autoComplete: "email", placeholder: "user@example.com" })}<div className="form-group"><div className="label-row"><label htmlFor="password">Password</label><button type="button" className="text-link" onClick={() => navigate("/forgot-password")}>Forgot password?</button></div><div className="field"><LockKeyhole size={17} /><input id="password" type={show ? "text" : "password"} autoComplete="current-password" {...form.register("password")} /><button type="button" className="field-eye" onClick={() => setShow(!show)} aria-label="Toggle password visibility"><Eye size={17} /></button></div>{err("password")}</div><label className="check-line"><input type="checkbox" {...form.register("remember")} /> Remember me on this device</label><button className="btn primary full" disabled={busy} type="submit">{busy ? "Signing in…" : "Sign in to platform"} <ArrowRight size={17} /></button><div className="auth-links"><button type="button" onClick={() => navigate("/register")}>Create an account</button></div></>}
        {isRegister && <>{input("full_name", "Full Name", { autoComplete: "name", placeholder: "Your full name" })}{input("email", "Email Address", { type: "email", autoComplete: "email", placeholder: "you@example.com" })}{input("mobile", "Mobile Number", { type: "tel", autoComplete: "tel", placeholder: "+91 9876543210" })}{input("organization", "Dairy Entity / Organization", { placeholder: "e.g. Sri Krishna Dairy" })}<div className="form-group"><label htmlFor="role">Role</label><select id="role" className="form-control" {...form.register("role")}><option value="user">User / Dairy Stakeholder</option><option value="consultant">Compliance Consultant</option></select><small>Officer and administrator accounts are created by an administrator, not by self-registration.</small>{err("role")}</div>{input("password", "Password", { type: "password", autoComplete: "new-password", onChange: (e: ChangeEvent<HTMLInputElement>) => { form.setValue("password", e.target.value); setStrength([/[a-z]/.test(e.target.value), /[A-Z]/.test(e.target.value), /\d/.test(e.target.value), /[^A-Za-z0-9]/.test(e.target.value), e.target.value.length >= 8].filter(Boolean).length); } })}<div className="password-strength" aria-label={`Password strength ${strength} of 5`}>{[1,2,3,4,5].map(n => <span key={n} className={n <= meter ? "filled" : ""} />)}</div><small>Password strength: {meter <= 2 ? "Needs improvement" : meter <= 4 ? "Good" : "Strong"}.</small>{input("confirm_password", "Confirm Password", { type: "password", autoComplete: "new-password" })}<label className="check-line"><input type="checkbox" {...form.register("terms_accepted")} /> I agree to the platform terms and data protection policies.</label>{err("terms_accepted")}<button className="btn primary full" disabled={busy} type="submit">{busy ? "Creating account…" : "Create Account"} <ArrowRight size={17} /></button></>}
        {(isForgotId || isForgotPassword) && <>{input("identifier", isForgotId ? "Email or mobile number" : "Email or user ID", { autoComplete: "username", placeholder: "Enter your account identifier" })}<button className="btn primary full" disabled={busy} type="submit">{busy ? "Checking…" : "Continue"} <ArrowRight size={17} /></button></>}
        {codeForm && <>{input("email", "Account email, mobile, or user ID", { defaultValue: localStorage.getItem("cp-pending-email") || "", autoComplete: "username" })}{input("code", "6-digit demo verification code", { inputMode: "numeric", maxLength: 6, placeholder: "000000" })}{isReset && <>{input("password", "New password", { type: "password", autoComplete: "new-password" })}{input("confirm_password", "Confirm new password", { type: "password", autoComplete: "new-password" })}</>}<button className="btn primary full" disabled={busy} type="submit">{busy ? "Verifying…" : isReset ? "Reset password" : "Verify code"} <ArrowRight size={17} /></button></>}
        {!isLogin && !isRegister && !isForgotId && !isForgotPassword && !codeForm && <><p className="privacy-banner">This account state is informational in the demo. No email, SMS, or support notification is sent.</p><button className="btn primary full" type="button" onClick={() => navigate("/login")}>Return to sign in <ArrowRight size={17} /></button></>}
      </form>
      {demoCode && <div className="inline-success" role="status"><CheckCircle2 size={16} /><div>Demo code: <b>{demoCode}</b><br />Local demonstration only — no email or SMS was sent.</div></div>}
      {notice && <div className={done ? "inline-success" : "privacy-banner"} role="status">{done && <CheckCircle2 size={16} />}{notice}</div>}
      {done && isRegister && <button className="btn secondary full" onClick={() => navigate("/verify-otp")}>Continue to verification <ArrowRight size={16} /></button>}
      {done && isForgotPassword && <button className="btn secondary full" onClick={() => navigate("/reset-password")}>Continue to password reset <ArrowRight size={16} /></button>}
      {done && isForgotId && <button className="btn secondary full" onClick={() => navigate("/verify-otp")}>Verify to recover user ID <ArrowRight size={16} /></button>}
      {done && isVerify && <button className="btn secondary full" onClick={() => navigate("/login")}>Return to sign in <ArrowRight size={16} /></button>}
      {done && isReset && <button className="btn secondary full" onClick={() => navigate("/login")}>Return to sign in <ArrowRight size={16} /></button>}
      {!isLogin && <div className="auth-links"><button type="button" onClick={() => navigate("/login")}>Back to sign in</button></div>}
      <div className="auth-disclaimer"><ShieldCheck size={15} /><span>Demo authentication. Never enter real Aadhaar, PAN, bank passbooks, or sensitive personal documents.</span></div></div><div className="auth-right-foot">Privacy first <span /> No real messages sent <span /> Academic prototype</div></div></div>;
}
