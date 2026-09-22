import { NextRequest,NextResponse } from "next/server";
import { requirePermission,supabaseRequest } from "@/lib/crm/supabase-server";

export async function POST(request:NextRequest){
 const session=await requirePermission("manage_users");if(!session)return NextResponse.json({error:"Unauthorised"},{status:401});
 const b=await request.json().catch(()=>({})),name=String(b.name||"").trim(),company=String(b.company||"").trim(),relationship=String(b.relationshipType||"employee");
 if(!name)return NextResponse.json({error:"Name is required"},{status:400});
 const r=await supabaseRequest("/rest/v1/mj_subcontractors",{method:"POST",headers:{Prefer:"return=representation"},body:JSON.stringify({name,company:company||null,phone:String(b.phone||"").trim()||null,email:String(b.email||"").trim()||null,relationship_type:relationship,active:true})},session.token);
 if(!r.ok)return NextResponse.json({error:"Unable to add team member"},{status:500});
 return NextResponse.json({person:(await r.json())?.[0]},{status:201});
}
export async function DELETE(request:NextRequest){
 const session=await requirePermission("manage_users");if(!session)return NextResponse.json({error:"Unauthorised"},{status:401});
 const id=new URL(request.url).searchParams.get("id");if(!id)return NextResponse.json({error:"Team member is required"},{status:400});
 const r=await supabaseRequest("/rest/v1/mj_subcontractors?id=eq."+encodeURIComponent(id),{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({active:false})},session.token);
 if(!r.ok)return NextResponse.json({error:"Unable to remove team member"},{status:500});
 return NextResponse.json({ok:true});
}
