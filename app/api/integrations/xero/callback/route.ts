import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requirePermission } from "@/lib/crm/supabase-server";
import { exchangeXeroCode, getXeroTenants, saveXeroConnection } from "@/lib/crm/xero";

function baseUrl(request:Request){const configured=process.env.NEXT_PUBLIC_APP_URL;return configured?configured.replace(/\/$/,""):new URL(request.url).origin;}

export async function GET(request: Request) {
  const base=baseUrl(request), url=new URL(request.url);
  const code=url.searchParams.get("code"), state=url.searchParams.get("state"), error=url.searchParams.get("error");
  const store=await cookies(), expectedState=store.get("mj_xero_oauth_state")?.value;
  store.delete("mj_xero_oauth_state");
  if(error)return NextResponse.redirect(`${base}/admin/integrations?xero=cancelled`);
  if(!code||!state||!expectedState||state!==expectedState)return NextResponse.redirect(`${base}/admin/integrations?xero=state_error`);
  const session=await requirePermission("manage_business_settings");
  if(!session)return NextResponse.redirect(`${base}/admin/login`);
  try{
    const token=await exchangeXeroCode(code), tenants=await getXeroTenants(token.access_token);
    if(!tenants.length)return NextResponse.redirect(`${base}/admin/integrations?xero=no_org`);
    if(tenants.length===1){await saveXeroConnection(session.token,session.user.id,token,tenants[0]);return NextResponse.redirect(`${base}/admin/integrations?xero=connected`);}
    store.set("mj_xero_pending",Buffer.from(JSON.stringify({token,tenants})).toString("base64url"),{httpOnly:true,secure:true,sameSite:"lax",path:"/",maxAge:10*60});
    return NextResponse.redirect(`${base}/admin/integrations?xero=choose_org`);
  }catch{return NextResponse.redirect(`${base}/admin/integrations?xero=error`);}
}
