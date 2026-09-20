import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requirePermission } from "@/lib/crm/supabase-server";
import { getXeroAuthorizeUrl } from "@/lib/crm/xero";

export async function GET() {
  const session = await requirePermission("manage_business_settings");
  if (!session) return NextResponse.redirect(new URL("/admin/login", process.env.NEXT_PUBLIC_APP_URL || process.env.XERO_REDIRECT_URI || "http://localhost:3000"));

  const state = crypto.randomBytes(24).toString("base64url");
  const store = await cookies();
  store.set("mj_xero_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });

  return NextResponse.redirect(getXeroAuthorizeUrl(state));
}
