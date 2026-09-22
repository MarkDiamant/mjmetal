import { NextResponse } from "next/server";
import { requirePermission, supabaseRequest } from "@/lib/crm/supabase-server";

export async function POST(request:Request){
  const session=await requirePermission("view_payments_invoices");
  if(!session)return NextResponse.json({error:"Unauthorised"},{status:401});
  try{
    const body=await request.json();
    const jobId=String(body.jobId||"").trim(),invoiceNumber=String(body.invoiceNumber||"").trim();
    const amount=Number(body.amount);
    if(!jobId||!invoiceNumber||!Number.isFinite(amount)||amount<0)return NextResponse.json({error:"Job, invoice number and amount are required"},{status:400});
    const status=String(body.status||"PAID").toUpperCase();
    if(!["PAID","AUTHORISED","DRAFT"].includes(status))return NextResponse.json({error:"Invalid invoice status"},{status:400});
    const payload={job_id:jobId,xero_invoice_id:`historical:${crypto.randomUUID()}`,invoice_number:invoiceNumber,status,amount_due:status==="PAID"?0:amount,amount_paid:status==="PAID"?amount:Math.max(0,Number(body.amountPaid||0)),total:amount,currency:"GBP",invoice_date:body.invoiceDate||null,due_date:body.dueDate||null,updated_at:new Date().toISOString()};
    const res=await supabaseRequest("/rest/v1/mj_xero_invoices",{method:"POST",headers:{Prefer:"return=representation"},body:JSON.stringify(payload)},session.token);
    if(!res.ok)return NextResponse.json({error:"Unable to add historical invoice",detail:await res.text()},{status:500});
    return NextResponse.json({invoice:(await res.json())?.[0]},{status:201});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Unable to add historical invoice"},{status:500});}
}
