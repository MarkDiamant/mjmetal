import {NextRequest,NextResponse} from "next/server";
import {requirePermission,supabaseRequest} from "@/lib/crm/supabase-server";
import {getValidXeroConnection} from "@/lib/crm/xero";
import {DEFAULT_CRM_CONFIG,normaliseCrmConfig} from "@/lib/crm/config";
import {signedTenantHandoff} from "@/lib/crm/tenant-handoff";
async function data(token:string,reference:string,invoiceId:string){
 const jr=await supabaseRequest(`/rest/v1/mj_jobs?reference=eq.${encodeURIComponent(reference)}&select=*,mj_customers(*)&limit=1`,{},token);
 if(!jr.ok)throw new Error("Could not load job");const job=(await jr.json())[0];if(!job)throw new Error("Job not found");
 const ir=await supabaseRequest(`/rest/v1/mj_xero_invoices?id=eq.${encodeURIComponent(invoiceId)}&job_id=eq.${encodeURIComponent(job.id)}&select=*&limit=1`,{},token);
 if(!ir.ok)throw new Error("Could not load invoice");const invoice=(await ir.json())[0];if(!invoice)throw new Error("Invoice not found");
 const connection=await getValidXeroConnection(token);if(!connection)throw new Error("Connect Xero to retrieve the invoice PDF");
 const pdfResponse=await fetch(`https://api.xero.com/api.xro/2.0/Invoices/${encodeURIComponent(invoice.xero_invoice_id)}`,{headers:{Authorization:`Bearer ${connection.accessToken}`,"Xero-tenant-id":connection.tenantId,Accept:"application/pdf"},cache:"no-store"});
 if(!pdfResponse.ok)throw new Error("Xero could not provide the invoice PDF");
 const pdf=Buffer.from(await pdfResponse.arrayBuffer());if(pdf.subarray(0,5).toString()!=="%PDF-")throw new Error("Xero did not return a valid PDF");
 const sr=await supabaseRequest("/storage/v1/object/mj-job-files/_crm/settings.json",{},token);
 const cfg=sr.ok?normaliseCrmConfig(await sr.json().catch(()=>null)):DEFAULT_CRM_CONFIG;
 const customer=job.mj_customers||{},name=[customer.first_name,customer.last_name].filter(Boolean).join(" ")||"Customer";
 const filename=`${String(invoice.invoice_number||job.reference).replace(/[^a-zA-Z0-9_-]/g,"")}-Invoice.pdf`;
 return {job,invoice,customer,name,cfg,pdf,filename};
}
function esc(v:unknown){return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");}
export async function GET(_request:NextRequest,{params}:{params:Promise<{reference:string}>}){
 const session=await requirePermission("view_payments_invoices");if(!session)return NextResponse.json({error:"Unauthorized"},{status:401});
 try{const {reference}=await params;const invoiceId=new URL(_request.url).searchParams.get("invoiceId");if(!invoiceId)return NextResponse.json({error:"Invoice required"},{status:400});
 const {pdf,filename}=await data(session.token,reference,invoiceId);
 return new NextResponse(new Uint8Array(pdf),{headers:{"Content-Type":"application/pdf","Content-Disposition":`attachment; filename="${filename}"`,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Could not load invoice PDF"},{status:500});}
}
export async function POST(request:NextRequest,{params}:{params:Promise<{reference:string}>}){
 const session=await requirePermission("view_payments_invoices");if(!session)return NextResponse.json({error:"Unauthorized"},{status:401});
 if(!session.permissions.includes("edit_jobs"))return NextResponse.json({error:"No permission to email invoices"},{status:403});
 try{const {reference}=await params;const body=await request.json().catch(()=>({}));if(!body.invoiceId||!["draft","send"].includes(body.action))return NextResponse.json({error:"Select an invoice and action"},{status:400});
 const {job,invoice,customer,name,cfg,pdf,filename}=await data(session.token,reference,body.invoiceId);
 if(!customer.email)return NextResponse.json({error:"Customer has no email address"},{status:400});
 if(body.action==="send"&&String(invoice.status).toUpperCase()==="DRAFT")return NextResponse.json({error:"Approve the invoice in Xero and sync its status before sending."},{status:409});
 const actorEmail=String(session.accessUser?.email||session.user?.email||"").toLowerCase();if(!actorEmail)return NextResponse.json({error:"Signed-in email unavailable"},{status:401});
 const origin=new URL(request.url).origin,{ts,sig}=signedTenantHandoff("mjmetal",origin,actorEmail);
 const html=`<div style="font-family:Arial,sans-serif;line-height:1.6;color:#171717"><p>Dear ${esc(customer.first_name||name)},</p><p>Please find attached invoice <strong>${esc(invoice.invoice_number||job.reference)}</strong> from ${esc(cfg.businessName)}.</p><p>If you have any questions, please reply to this email.</p><p>Kind regards,<br><strong>${esc(cfg.businessDetails.emailSignatureName||cfg.businessName)}</strong><br>${esc(cfg.businessDetails.phone)}<br>${esc(cfg.businessDetails.email)}<br>${esc(cfg.businessDetails.website)}<br>${esc(cfg.businessDetails.emailSignatureTagline)}</p></div>`;
 const central=await fetch(`https://diamantsolutions.co.uk/api/business-software/tenants/mjmetal/gmail/${body.action}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({origin,actorEmail,ts,sig,fromName:cfg.businessName,to:customer.email,replyTo:cfg.businessDetails.email,subject:`${cfg.businessName} invoice ${invoice.invoice_number||job.reference}`,html,attachment:{filename,mimeType:"application/pdf",contentBase64:pdf.toString("base64")}}),cache:"no-store"});
 const result=await central.json().catch(()=>({}));if(!central.ok)return NextResponse.json({error:result.error||"Gmail action failed"},{status:central.status});
 if(body.action==="send")await supabaseRequest("/rest/v1/mj_activities",{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify({job_id:job.id,activity_type:"email",actor:session.admin?.initials||session.accessUser?.email||"BMS user",summary:`Invoice ${invoice.invoice_number||job.reference} emailed with PDF attachment`,details:customer.email,occurred_at:new Date().toISOString()})},session.token);
 return NextResponse.json({...result,ok:true,to:customer.email});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Invoice email failed"},{status:500});}
}
