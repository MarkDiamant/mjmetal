import { NextResponse } from "next/server";
import { clearSessionCookies, requireAdminToken } from "@/lib/crm/supabase-server";
import { signedTenantHandoff } from "@/lib/crm/tenant-handoff";

export async function POST(request: Request) {
  const session = await requireAdminToken().catch(() => null);
  if (session?.user?.email) {
    try {
      const email=String(session.user.email).toLowerCase();
      const origin=process.env.NEXT_PUBLIC_BMS_ORIGIN||new URL(request.url).origin;
      const {ts,sig}=signedTenantHandoff("mjmetal",origin,email);
      await fetch("https://diamantsolutions.co.uk/api/business-software/tenants/mjmetal/session",{
        method:"DELETE",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({origin,email,ts,sig}),cache:"no-store"
      });
    } catch {}
  }
  await clearSessionCookies();
  return NextResponse.json({ ok: true });
}
