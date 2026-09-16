import { NextResponse } from "next/server";
import { clearSessionCookies } from "@/lib/crm/supabase-server";

export async function POST() {
  await clearSessionCookies();
  return NextResponse.json({ ok: true });
}
