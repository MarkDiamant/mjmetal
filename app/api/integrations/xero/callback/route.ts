import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireAdminToken } from "@/lib/crm/supabase-server";
import { exchangeXeroCode, getXeroTenants, saveXeroConnection } from "@/lib/crm/xero";

export async function GET(request: Request) {
  const base = "https://www.mjmetal.co.uk";
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const store = await cookies();
  const expectedState = store.get("mj_xero_oauth_state")?.value;
  store.delete("mj_xero_oauth_state");

  if (error) return NextResponse.redirect(`${base}/admin/integrations?xero=cancelled`);
  if (!code || !state || !expectedState || state !== expectedState) return NextResponse.redirect(`${base}/admin/integrations?xero=state_error`);

  const session = await requireAdminToken();
  if (!session) return NextResponse.redirect(`${base}/admin/login`);

  try {
    const token = await exchangeXeroCode(code);
    const tenants = await getXeroTenants(token.access_token);
    const tenant = tenants[0];
    if (!tenant) return NextResponse.redirect(`${base}/admin/integrations?xero=no_org`);
    await saveXeroConnection(session.token, session.user.id, token, tenant);
    return NextResponse.redirect(`${base}/admin/integrations?xero=connected`);
  } catch {
    return NextResponse.redirect(`${base}/admin/integrations?xero=error`);
  }
}
