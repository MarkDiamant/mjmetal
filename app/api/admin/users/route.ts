import { NextRequest, NextResponse } from "next/server";
import { requireAdminToken, supabaseRequest } from "@/lib/crm/supabase-server";
import { ROLE_PERMISSIONS, type UserRole } from "@/lib/crm/permissions";

function meta(raw: unknown) { if(!raw||typeof raw!=="object") return {}; return raw as Record<string,unknown>; }

export async function GET(){
 const session=await requireAdminToken(); if(!session)return NextResponse.json({error:"Unauthorised"},{status:401});
 const r=await supabaseRequest("/rest/v1/mj_admin_users?select=user_id,display_name,initials&order=display_name.asc",{method:"GET"},session.token);
 const rows=r.ok?await r.json():[];
 const users=(rows||[]).map((u:any)=>({id:u.user_id,name:u.display_name,initials:u.initials,role:u.initials==="MD"?"owner":"admin",permissions:u.initials==="MD"?ROLE_PERMISSIONS.owner:ROLE_PERMISSIONS.admin,protectedOwner:u.initials==="MD"}));
 return NextResponse.json({users,plan:null,seatCount:users.length,seatLimit:null,canAdd:false,billingConnected:false,pricingConnected:false,message:"User limits will come from the central Diamant Solutions subscription catalogue rather than being hard-coded in this CRM."});
}

export async function POST(request:NextRequest){
 const session=await requireAdminToken(); if(!session)return NextResponse.json({error:"Unauthorised"},{status:401});
 const body=await request.json().catch(()=>({}));
 const role=String(body.role||"custom") as UserRole;
 const permissions=Array.isArray(body.permissions)?body.permissions:ROLE_PERMISSIONS[role]||[];
 return NextResponse.json({error:"pricing_not_connected",message:"User invitations will be enabled once this CRM is connected to the central Diamant Solutions subscription catalogue, so seat limits and upgrades always follow the current package.",draft:{email:String(body.email||""),name:String(body.name||""),role,permissions}},{status:503});
}
