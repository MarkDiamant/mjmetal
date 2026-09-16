import { cookies } from "next/headers";

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

export async function requireAdminToken() {
  const token = await getAccessToken();
  if (!token) return null;

  const userResponse = await supabaseRequest("/auth/v1/user", { method: "GET" }, token);
  if (!userResponse.ok) return null;
  const user = await userResponse.json() as { id: string; email?: string };

  const adminResponse = await supabaseRequest(
    `/rest/v1/mj_admin_users?user_id=eq.${encodeURIComponent(user.id)}&select=display_name,initials&limit=1`,
    { method: "GET" },
    token,
  );
  if (!adminResponse.ok) return null;
  const admins = await adminResponse.json() as Array<{ display_name: string; initials: "MD" | "JB" }>;
  if (!admins[0]) return null;

  return { token, user, admin: admins[0] };
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
