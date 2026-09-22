import { cookies } from "next/headers";
import { ROLE_PERMISSIONS, type PermissionKey, type UserRole } from "@/lib/crm/permissions";

const ACCESS_COOKIE = "mj_admin_access";
const REFRESH_COOKIE = "mj_admin_refresh";

function config() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("M&J Supabase is not configured");
  return { url, key };
}

export async function supabaseRequest(path: string, init: RequestInit = {}, accessToken?: string) {
  const { url, key } = config();
  const headers = new Headers(init.headers);
  headers.set("apikey", key);
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json");
  return fetch(`${url}${path}`, { ...init, headers, cache: "no-store" });
}

export async function getAccessToken() {
  return (await cookies()).get(ACCESS_COOKIE)?.value ?? null;
}

function decodeJwtPayload(token: string) {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const padded = part.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(part.length / 4) * 4, "=");
    return JSON.parse(Buffer.from(padded, "base64").toString("utf8")) as { sub?: string; email?: string; exp?: number };
  } catch {
    return null;
  }
}

export async function requireAdminToken() {
  const token = await getAccessToken();
  if (!token) return null;

  const payload = decodeJwtPayload(token);
  if (!payload?.sub) return null;
  if (payload.exp && payload.exp * 1000 <= Date.now()) return null;

  const adminResponse = await supabaseRequest(
    `/rest/v1/mj_admin_users?user_id=eq.${encodeURIComponent(payload.sub)}&select=display_name,initials&limit=1`,
    { method: "GET" },
    token,
  );
  const admins = adminResponse.ok ? await adminResponse.json() as Array<{ display_name: string; initials: "MD" | "JB" }> : [];
  if (admins[0]) return { token, user: { id: payload.sub, email: payload.email }, admin: admins[0] };

  // Invited CRM users are authorised by the tenant access store. This keeps the
  // legacy M&J admin table for the two original managers without forcing its
  // MD/JB-only initials enum onto future invited users.
  const { loadCrmUsers } = await import("@/lib/crm/user-access");
  const users = await loadCrmUsers(token);
  const invited = users.find((u) => u.status !== "disabled" && (u.userId === payload.sub || (!!payload.email && u.email?.toLowerCase() === payload.email.toLowerCase())));
  if (!invited) return null;
  return { token, user: { id: payload.sub, email: payload.email }, admin: { display_name: invited.name, initials: invited.initials as "MD" | "JB" } };
}

export async function setSessionCookies(accessToken: string, refreshToken: string, expiresIn: number) {
  const store = await cookies();
  store.set(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.max(60, expiresIn - 30),
  });
  store.set(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookies() {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}

export async function requirePermission(permission: PermissionKey) {
  const session = await requireAdminToken();
  if (!session) return null;
  const settingsPath="_crm/settings.json".split("/").map(encodeURIComponent).join("/");
  const settingsResponse=await supabaseRequest(`/storage/v1/object/mj-job-files/${settingsPath}`,{method:"GET"},session.token);
  if(settingsResponse.ok){
    const settings=await settingsResponse.json().catch(()=>null);
    const billing=settings?.billing;
    if(billing?.mode==="paid"){
      const status=String(billing.status||"");
      const periodEnd=billing.currentPeriodEnd?Date.parse(String(billing.currentPeriodEnd)):0;
      const recoveryUntil=periodEnd?periodEnd+7*24*60*60*1000:0;
      const withinRecovery=["past_due","unpaid"].includes(status)&&recoveryUntil>Date.now();
      const cancelledButPaid=status==="cancelled"&&periodEnd>Date.now();
      if(!["active","trialing"].includes(status)&&!withinRecovery&&!cancelledButPaid)return null;
    }
  }
  const { loadCrmUsers, effectiveAccess } = await import("@/lib/crm/user-access");
  const users = await loadCrmUsers(session.token);
  const access = effectiveAccess(users,{id:session.user.id,email:session.user.email,initials:session.admin.initials});
  if (!access || !access.permissions.includes(permission)) return null;
  return { ...session, role: access.role, permissions: access.permissions, accessUser: access };
}
