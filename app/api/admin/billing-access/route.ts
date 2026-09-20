import {NextResponse} from "next/server";
import {requireAdminToken,supabaseRequest} from "@/lib/crm/supabase-server";
import {DEFAULT_CRM_CONFIG,normaliseCrmConfig} from "@/lib/crm/config";

export async function GET(){
  const session=await requireAdminToken();
  if(!session)return NextResponse.json({message:"Your sign-in has expired. Please sign in again.",reason:"signed_out"},{status:401});
  try{
    const path="_crm/settings.json".split("/").map(encodeURIComponent).join("/");
    const r=await supabaseRequest(`/storage/v1/object/mj-job-files/${path}`,{method:"GET"},session.token);
    if(!r.ok&&r.status!==404)return NextResponse.json({message:"We couldn't check your account just now. Please try again.",reason:"account"},{status:503});
    const cfg=r.ok?normaliseCrmConfig(await r.json().catch(()=>null)):DEFAULT_CRM_CONFIG;
    const blocked=cfg.billing.mode==="paid"&&!["active","trialing"].includes(cfg.billing.status);
    return NextResponse.json({blocked,reason:blocked?"payment":null,billing:cfg.billing,businessName:cfg.businessName});
  }catch{
    return NextResponse.json({message:"We couldn't check your account just now. Please try again.",reason:"account"},{status:503});
  }
}