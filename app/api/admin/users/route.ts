import { NextRequest, NextResponse } from "next/server";
import { requireAdminToken, supabaseRequest } from "@/lib/crm/supabase-server";
import { ROLE_PERMISSIONS, USER_PLANS, type UserRole } from "@/lib/crm/permissions";

function meta(raw: unknown) { if(!raw||typeof raw!=="object") return {}; return raw as Record<string,unknown>; }

export async function GET(){
 const session=await requireAdminToken(); if(!session)return NextResponse.json({error:"Unauthorised"},{status:401});
 const r=await supabaseRequest("/rest/v1/mj_admin_users?select=user_id,display_name,initials&order=display_name.asc",{method:"GET"},session.token);
 const rows=r.ok?await r.json():[];
 const users=(rows||[]).map((u:any)=>({id:u.user_id,name:u.display_name,initials:u.initials,role:"admin",permissions:ROLE_PERMISSIONS.admin}));
 return NextResponse.json({users,plan:USER_PLANS[0],seatCount:users.length,seatLimit:USER_PLANS[0].max,canAdd:users.length<USER_PLANS[0].max,billingConnected:false});
}

export async function POST(request:NextRequest){
 const session=await requireAdminToken(); if(!session)return NextResponse.json({error:"Unauthorised"},{status:401});
 const body=await request.json().catch(()=>({}));
 const role=String(body.role||"custom") as UserRole;
 const permissions=Array.isArray(body.permissions)?body.permissions:ROLE_PERMISSIONS[role]||[];
 const r=await supabaseRequest("/rest/v1/mj_admin_users?select=user_id",{method:"GET"},session.token);
 const users=r.ok?await r.json():[];
 const plan=USER_PLANS[0];
 if((users||[]).length>=plan.max)return NextResponse.json({error:"plan_limit",message:`Your current ${plan.label} plan is full. Upgrade to the 3–5 user plan before adding another user.`,upgrade:{from:plan.id,to:"users_3_5",newLimit:5,billingConnected:false}},{status:409});
 return NextResponse.json({error:"invites_not_configured",message:"User invitations need the subscription/auth provisioning connection before they can be activated.",draft:{email:String(body.email||""),name:String(body.name||""),role,permissions}},{status:501});
}
