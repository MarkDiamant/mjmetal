import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/crm/supabase-server";
import { exchangeGoogleCode,googleEmail,saveGoogleConnection } from "@/lib/crm/gmail";
import { verifyGoogleState } from "@/lib/crm/google-oauth-state";

export async function GET(request:Request){
  const url=new URL(request.url),stateRaw=url.searchParams.get("state")||"",state=verifyGoogleState(stateRaw);
  const fallback=(process.env.DS_INTEGRATIONS_BASE_URL||url.origin).replace(/\/$/,"");
  if(!state)return NextResponse.redirect(`${fallback}/admin/integrations?google=state_error`);
  const base=state.tenantOrigin.replace(/\/$/,"");
  if(url.searchParams.get("error"))return NextResponse.redirect(`${base}/admin/integrations?google=cancelled`);
  const code=url.searchParams.get("code");
  if(!code)return NextResponse.redirect(`${base}/admin/integrations?google=error`);

  // When the central callback is hosted on the tenant deployment (M&J is tenant #1),
  // preserve the existing authenticated session and save the connection directly.
  // A dedicated DS integrations host can later exchange this for a short-lived
  // tenant handoff without changing Google's registered callback.
  const store=await cookies(),expected=store.get("ds_google_oauth_nonce")?.value;
  store.delete("ds_google_oauth_nonce");
  if(!expected||expected!==state.nonce)return NextResponse.redirect(`${base}/admin/integrations?google=state_error`);
  const session=await requirePermission("manage_business_settings");
  if(!session)return NextResponse.redirect(`${base}/admin/login`);
  try{
    const token=await exchangeGoogleCode(code),email=await googleEmail(token.access_token);
    await saveGoogleConnection(session.token,session.user.id,token,email);
    return NextResponse.redirect(`${base}/admin/integrations?google=connected`);
  }catch{
    return NextResponse.redirect(`${base}/admin/integrations?google=error`);
  }
}