import {NextResponse} from "next/server";
/** Canonical BMS customer editor: update by stable ID, verify the saved row and return clear errors. */
export function createCustomerUpdateHandler({requirePermission,supabaseRequest}:{requirePermission:any;supabaseRequest:any}){
 return async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
  const session=await requirePermission("edit_jobs");if(!session)return NextResponse.json({error:"Not authorised to edit customers"},{status:403});
  if(!session.permissions.includes("view_customer_details"))return NextResponse.json({error:"Customer editing is not permitted for this account"},{status:403});
  const {id}=await params;const body=await request.json().catch(()=>null);
  if(!body||typeof body!=="object")return NextResponse.json({error:"Invalid customer details"},{status:400});
  const allowed=["first_name","last_name","company_name","phone","email","address_line_1","address_line_2","city","postcode"];
  const patch:Record<string,unknown>={};for(const key of allowed)if(Object.prototype.hasOwnProperty.call(body,key)){if(body[key]!==null&&typeof body[key]!=="string")return NextResponse.json({error:`Invalid ${key}`},{status:400});patch[key]=body[key]===null?null:String(body[key]).trim();}
  if(!Object.keys(patch).length)return NextResponse.json({error:"No customer changes provided"},{status:400});
  if("first_name" in patch&&!patch.first_name)return NextResponse.json({error:"Customer first name is required"},{status:400});
  const response=await supabaseRequest(`/rest/v1/bms_customers?id=eq.${encodeURIComponent(id)}`,{method:"PATCH",headers:{Prefer:"return=representation"},body:JSON.stringify({...patch,updated_at:new Date().toISOString()})},session.token);
  const rows=await response.json().catch(()=>null);if(!response.ok)return NextResponse.json({error:rows?.message||rows?.error||"Database rejected the customer changes"},{status:502});
  if(!Array.isArray(rows)||rows.length!==1)return NextResponse.json({error:"Customer changes were not confirmed. Please refresh and retry."},{status:409});
  return NextResponse.json({customer:rows[0],message:"Customer details saved"});
 };
}
