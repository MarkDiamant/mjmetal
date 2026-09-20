import {NextResponse} from "next/server";
import {requireAdminToken,supabaseRequest} from "@/lib/crm/supabase-server";
import {DEFAULT_CRM_CONFIG,normaliseCrmConfig} from "@/lib/crm/config";

export async function GET(){
  const session=await requireAdminToken();
  if(!session)return NextResponse.json({message:"Your sign-in has expired. Please sign in again.",reason:"signed_out"},{status:401});
  try{
    const path="_crm/settings.json".split("/").map(encodeURIComponent).join("/");
    const r=await supabaseRequest(`/storage/v1/object/mj-job-files/${path}`,{method:"GET"},session.token);
    if(!r.ok&&r.status!==404){
      // M&J is the founding free tenant. A temporary settings-storage failure must never lock it behind billing verification.
      if(DEFAULT_CRM_CONFIG.tenantKey==="mj-metal"&&DEFAULT_CRM_CONFIG.billing.mode==="free") return NextResponse.json({blocked:false,reason:null,billing:DEFAULT_CRM_CONFIG.billing,businessName:DEFAULT_CRM_CONFIG.businessName});
      return NextResponse.json({message:"We couldn’t check your account just now. Your subscription has not been blocked. Please try again.",reason:"account"},{status:503});
    }
    const cfg=r.ok?normaliseCrmConfig(await r.json().catch(()=>null)):DEFAULT_CRM_CONFIG;
    // The founding M&J tenant is permanently free. Billing state must never gate its CRM access.
    if(cfg.tenantKey==="mj-metal") return NextResponse.json({blocked:false,reason:null,billing:{...cfg.billing,mode:"free",status:"active"},businessName:cfg.businessName});
    const periodEnd=cfg.billing.currentPeriodEnd?Date.parse(cfg.billing.currentPeriodEnd):0;\n    const graceUntil=periodEnd?periodEnd+7*24*60*60*1000:0;\n    const paymentFailed=["past_due","unpaid"].includes(cfg.billing.status);\n    const withinRecovery=paymentFailed&&graceUntil>0&&Date.now()<=graceUntil;\n    const cancelledButPaid=cfg.billing.status==="cancelled"&&periodEnd>Date.now();\n    const blocked=cfg.billing.mode==="paid"&&!(["active","trialing"].includes(cfg.billing.status)||withinRecovery||cancelledButPaid);
    return NextResponse.json({blocked,reason:blocked?"payment":null,recovery:withinRecovery,recoveryUntil:withinRecovery?new Date(graceUntil).toISOString():null,billing:cfg.billing,businessName:cfg.businessName});
  }catch{
    if(DEFAULT_CRM_CONFIG.tenantKey==="mj-metal"&&DEFAULT_CRM_CONFIG.billing.mode==="free") return NextResponse.json({blocked:false,reason:null,billing:DEFAULT_CRM_CONFIG.billing,businessName:DEFAULT_CRM_CONFIG.businessName});
    return NextResponse.json({message:"We couldn’t check your account just now. Your subscription has not been blocked. Please try again.",reason:"account"},{status:503});
  }
}