import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireAdminToken } from "@/lib/crm/supabase-server";
import { getXeroAuthorizeUrl } from "@/lib/crm/xero";

export async function GET() {
  const session = await requireAdminToken();
  if (!session) return NextResponse.redirect(new URL("/admin/login", process.env.XERO_REDIRECT_URI || "https://www.mjmetal.co.uk"));

  const state = crypto.randomBytes(24).toString("base64url");
  const store = await cookies();
  store.set("mj_xero_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });

  return NextResponse.redirect(getXeroAuthorizeUrl(state));
}
