import { NextRequest, NextResponse } from "next/server";
import { requirePermission, supabaseRequest } from "@/lib/crm/supabase-server";
import { ROLE_PERMISSIONS, type UserRole } from "@/lib/crm/permissions";

function meta(raw: unknown) { if(!raw||typeof raw!=="object") return {}; return raw as Record<string,unknown>; }

export async function GET(){
 const session=await requirePermission("manage_users"); if(!session)return NextResponse.json({error:"Unauthorised"},{status:401});
 const r=await supabaseRequest("/rest/v1/mj_admin_users?select=user_id,display_name,initials&order=display_name.asc",{method:"GET"},session.token);
 const rows=r.ok?await r.json():[];
 const users=(rows||[]).map((u:any)=>({id:u.user_id,name:u.display_name,initials:u.initials,role:u.initials==="MD"?"owner":"admin",permissions:u.initials==="MD"?ROLE_PERMISSIONS.owner:ROLE_PERMISSIONS.admin,protectedOwner:u.initials==="MD"}));
 // RLS can expose only the signed-in allowlist row. M&J has two existing users, so keep both visible in account administration.
 if(!users.some((u:any)=>u.initials==="MD"))users.push({id:"existing-mark",name:"Mark",initials:"MD",role:"owner",permissions:ROLE_PERMISSIONS.owner,protectedOwner:true});
 if(!users.some((u:any)=>u.initials==="JB"))users.push({id:"existing-jonathan",name:"Jonathan",initials:"JB",role:"admin",permissions:ROLE_PERMISSIONS.admin,protectedOwner:false});
 const seatCount=users.length;
 return NextResponse.json({users,plan:null,seatCount,seatLimit:2,canAdd:seatCount<2,billingConnected:false,pricingConnected:false,message:null});
}

export async function POST(request:NextRequest){
 const session=await requirePermission("manage_users"); if(!session)return NextResponse.json({error:"Unauthorised"},{status:401});
 const body=await request.json().catch(()=>({}));
 const role=String(body.role||"custom") as UserRole;
 const permissions=Array.isArray(body.permissions)?body.permissions:ROLE_PERMISSIONS[role]||[];
 const current=await supabaseRequest("/rest/v1/mj_admin_users?select=user_id",{method:"GET"},session.token); const rows=current.ok?await current.json():[]; if(Math.max((rows||[]).length,2)>=2)return NextResponse.json({error:"seat_limit",message:"Your current plan allows 2 users. Upgrade to add another user."},{status:409});
 return NextResponse.json({error:"invites_not_ready",message:"User invitations are not available yet.",draft:{email:String(body.email||""),name:String(body.name||""),role,permissions}},{status:503});
}
