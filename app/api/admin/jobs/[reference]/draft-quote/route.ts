import { NextResponse } from "next/server";
import { requirePermission, supabaseRequest } from "@/lib/crm/supabase-server";
import { DEFAULT_CRM_CONFIG, normaliseCrmConfig } from "@/lib/crm/config";
import { signedTenantHandoff } from "@/lib/crm/tenant-handoff";

async function settings(token:string){const p="_crm/settings.json".split("/").map(encodeURIComponent).join("/");const r=await supabaseRequest(`/storage/v1/object/mj-job-files/${p}`,{method:"GET"},token);return r.ok?normaliseCrmConfig(await r.json().catch(()=>null)):DEFAULT_CRM_CONFIG;}
function esc(v:unknown){return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");}\nfunction originForAssets(request:Request){const u=new URL(request.url);return `${u.protocol}//${u.host}`;}

export async function POST(request:Request,{params}:{params:Promise<{reference:string}>}){
 const session=await requirePermission("view_pricing");if(!session)return NextResponse.json({error:"Unauthorised"},{status:401});
 if(!session.permissions.includes("edit_jobs"))return NextResponse.json({error:"You do not have permission to create quote drafts"},{status:403});
 const {reference}=await params,body=await request.json().catch(()=>({})) as {quoteId?:string};if(!body.quoteId)return NextResponse.json({error:"Quote is required"},{status:400});
 const config=await settings(session.token);
 const jr=await supabaseRequest(`/rest/v1/mj_jobs?reference=eq.${encodeURIComponent(reference.toUpperCase())}&select=*,mj_customers(*)&limit=1`,{},session.token);const job=(jr.ok?await jr.json():[])?.[0];if(!job)return NextResponse.json({error:"Job not found"},{status:404});
 const customer=job.mj_customers||{};if(!customer.email)return NextResponse.json({error:"Customer has no email address"},{status:400});
 const qr=await supabaseRequest(`/rest/v1/mj_quotes?id=eq.${encodeURIComponent(body.quoteId)}&job_id=eq.${encodeURIComponent(job.id)}&select=*&limit=1`,{},session.token);const quote=(qr.ok?await qr.json():[])?.[0];if(!quote)return NextResponse.json({error:"Quote not found"},{status:404});
 let path=String(quote.pdf_path||"").trim();if(!path)return NextResponse.json({error:"Generate the quote PDF before creating the email draft."},{status:409});
 const stored=await supabaseRequest(`/storage/v1/object/mj-job-files/${path.split("/").map(encodeURIComponent).join("/")}`,{},session.token);if(!stored.ok)return NextResponse.json({error:"Could not load quotation PDF"},{status:500});const pdf=Buffer.from(await stored.arrayBuffer()),filename=path.split("/").pop()||`${job.reference}-Quote.pdf`;
 const name=[customer.first_name,customer.last_name].filter(Boolean).join(" ")||"Customer",subject=`${config.businessName} quotation ${job.reference}`;
 const logoUrl=`${originForAssets(request)}/images/logo.png`;\n const html=`<div style="font-family:Arial,sans-serif;line-height:1.6;color:#111"><p>Dear ${esc(customer.first_name||name)},</p><p>Please find attached our quotation <strong>${esc(job.reference)}</strong>.</p><p>If you have any questions, simply reply to this email.</p><p>Kind regards,</p><div style="font-family:Arial,sans-serif;line-height:1.35"><strong>The M&amp;J Metal Team</strong><br><span>📱 ${esc(config.businessDetails.phone)}</span><br><a href="mailto:${esc(config.businessDetails.email)}">${esc(config.businessDetails.email)}</a><br><a href="https://${esc(config.businessDetails.website)}">${esc(config.businessDetails.website)}</a><br><br><img src="${logoUrl}" alt="M&amp;J Metal" width="110" style="display:block;width:110px;height:auto;border:0"><br><span>M&amp;J Metal</span><br><span>| Built Strong. Built to last |</span></div></div>`;
 const actorEmail=String(session.accessUser?.email||session.user?.email||"").toLowerCase(),origin=new URL(request.url).origin;if(!actorEmail)return NextResponse.json({error:"Signed-in email unavailable"},{status:401});
 const {ts,sig}=signedTenantHandoff("mjmetal",origin,actorEmail);
 const central=await fetch("https://diamantsolutions.co.uk/api/business-software/tenants/mjmetal/gmail/draft",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({origin,actorEmail,ts,sig,fromName:config.businessName,to:customer.email,replyTo:config.businessDetails.email,subject,html,attachment:{filename,mimeType:"application/pdf",contentBase64:pdf.toString("base64")}}),cache:"no-store"});
 const result=await central.json().catch(()=>({}));return NextResponse.json(result,{status:central.status});
}
