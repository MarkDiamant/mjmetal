import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/crm/supabase-server";
import { tenantOrigin } from "@/lib/crm/product";
import { signedTenantHandoff } from "@/lib/crm/tenant-handoff";

export async function GET(request:Request){
  const session=await requirePermission("manage_business_settings");
  const origin=tenantOrigin(request.url);
  if(!session)return NextResponse.redirect(`${origin}/admin/login`);
  try{
    const email=String(session.accessUser?.email||"").toLowerCase();
    if(!email)throw new Error("Signed-in user email unavailable");
    const {ts,sig}=signedTenantHandoff("mjmetal",origin,email);
    const url=new URL("https://diamantsolutions.co.uk/api/business-software/oauth/google/connect");
    url.searchParams.set("tenant","mjmetal");url.searchParams.set("return_origin",origin);url.searchParams.set("email",email);url.searchParams.set("ts",String(ts));url.searchParams.set("sig",sig);
    return NextResponse.redirect(url);
  }catch{
    return NextResponse.redirect(`${origin}/admin/integrations?google=config_error`);
  }
}
