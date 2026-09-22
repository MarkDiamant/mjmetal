import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/crm/supabase-server";
import { googleAuthorizeUrl } from "@/lib/crm/gmail";
import { createGoogleState } from "@/lib/crm/google-oauth-state";
import { tenantOrigin } from "@/lib/crm/product";

export async function GET(request:Request){
  const session=await requirePermission("manage_business_settings");
  const origin=tenantOrigin(request.url);
  if(!session)return NextResponse.redirect(`${origin}/admin/login`);
  try{
    const {state,nonce}=createGoogleState(origin);
    const store=await cookies();
    store.set("ds_google_oauth_nonce",nonce,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:600});
    return NextResponse.redirect(googleAuthorizeUrl(state));
  }catch{
    return NextResponse.redirect(`${origin}/admin/integrations?google=config_error`);
  }
}