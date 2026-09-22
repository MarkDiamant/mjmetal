import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/crm/supabase-server";
import { signedTenantHandoff } from "@/lib/crm/tenant-handoff";

function centralUrl(request:Request,email:string,provider?:string){
  const origin=new URL(request.url).origin,{ts,sig}=signedTenantHandoff("mjmetal",origin,email);
  const u=new URL("https://diamantsolutions.co.uk/api/business-software/tenants/mjmetal/integrations");
  u.searchParams.set("origin",origin);u.searchParams.set("email",email);u.searchParams.set("ts",String(ts));u.searchParams.set("sig",sig);if(provider)u.searchParams.set("provider",provider);return u;
}
export async function GET(request:Request){
  const s=await requirePermission("manage_business_settings");if(!s)return NextResponse.json({error:"Unauthorised"},{status:401});
  try{const email=String(s.accessUser?.email||s.user?.email||"").toLowerCase();if(!email)throw new Error("User email unavailable");const r=await fetch(centralUrl(request,email),{cache:"no-store"});const b=await r.json().catch(()=>({}));if(!r.ok)return NextResponse.json({error:b.error||"Unable to check Gmail"},{status:r.status});const g=(b.integrations||[]).find((x:any)=>x.provider==="google"&&x.status==="connected");return NextResponse.json({connected:Boolean(g),email:g?.provider_account||null,connectedAt:g?.connected_at||null});}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Unable to check Gmail"},{status:500});}
}
export async function DELETE(request:Request){
  const s=await requirePermission("manage_business_settings");if(!s)return NextResponse.json({error:"Unauthorised"},{status:401});
  try{const email=String(s.accessUser?.email||s.user?.email||"").toLowerCase();if(!email)throw new Error("User email unavailable");const r=await fetch(centralUrl(request,email,"google"),{method:"DELETE",cache:"no-store"});const b=await r.json().catch(()=>({}));return NextResponse.json(r.ok?{ok:true}:{error:b.error||"Unable to disconnect Gmail"},{status:r.status});}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Unable to disconnect Gmail"},{status:500});}
}
