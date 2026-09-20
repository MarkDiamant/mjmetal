import { NextRequest,NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requirePermission } from "@/lib/crm/supabase-server";
import { saveXeroConnection, type TokenResponse, type XeroTenant } from "@/lib/crm/xero";
type Pending={token:TokenResponse;tenants:XeroTenant[]};
async function pending(){const c=await cookies(),v=c.get("mj_xero_pending")?.value;if(!v)return null;try{return JSON.parse(Buffer.from(v,"base64url").toString("utf8")) as Pending}catch{return null}}
export async function GET(){const session=await requirePermission("manage_business_settings");if(!session)return NextResponse.json({error:"Unauthorised"},{status:401});const p=await pending();if(!p)return NextResponse.json({error:"Xero connection has expired. Please connect again.",organisations:[]},{status:400});return NextResponse.json({organisations:p.tenants});}
export async function POST(req:NextRequest){const session=await requirePermission("manage_business_settings");if(!session)return NextResponse.json({error:"Unauthorised"},{status:401});const p=await pending();if(!p)return NextResponse.json({error:"Xero connection has expired. Please connect again."},{status:400});const {tenantId}=await req.json();const tenant=p.tenants.find(t=>t.tenantId===tenantId);if(!tenant)return NextResponse.json({error:"Choose a valid Xero organisation."},{status:400});await saveXeroConnection(session.token,session.user.id,p.token,tenant);const c=await cookies();c.delete("mj_xero_pending");return NextResponse.json({ok:true,tenantName:tenant.tenantName||null});}
