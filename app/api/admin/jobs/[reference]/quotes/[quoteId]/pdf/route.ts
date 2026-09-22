import { NextRequest, NextResponse } from "next/server";
import { requirePermission, supabaseRequest } from "@/lib/crm/supabase-server";
import { buildQuotePdf } from "@/lib/crm/simple-pdf";
import { DEFAULT_CRM_CONFIG, normaliseCrmConfig } from "@/lib/crm/config";

async function crmSettings(token:string){const p="_crm/settings.json".split("/").map(encodeURIComponent).join("/");const r=await supabaseRequest(`/storage/v1/object/mj-job-files/${p}`,{method:"GET"},token);return r.ok?normaliseCrmConfig(await r.json().catch(()=>null)):DEFAULT_CRM_CONFIG;}

async function jsonOrError(response: Response) {
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message || body?.error_description || body?.hint || "Database request failed");
  return body;
}

function date(value: string | null | undefined) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-GB");
}

export async function POST(_request: NextRequest, { params }: { params: Promise<{ reference: string; quoteId: string }> }) {
  const session = await requirePermission("view_pricing");
  if(session&&!session.permissions.includes("edit_jobs")) return NextResponse.json({error:"You do not have permission to generate quote files"},{status:403});
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { reference, quoteId } = await params;
    const config = await crmSettings(session.token);
    const jobs = await jsonOrError(await supabaseRequest(`/rest/v1/mj_jobs?reference=eq.${encodeURIComponent(reference)}&select=*&limit=1`, {}, session.token));
    const job = jobs[0];
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    const [customers, quotes] = await Promise.all([
      jsonOrError(await supabaseRequest(`/rest/v1/mj_customers?id=eq.${job.customer_id}&select=*&limit=1`, {}, session.token)),
      jsonOrError(await supabaseRequest(`/rest/v1/mj_quotes?id=eq.${encodeURIComponent(quoteId)}&job_id=eq.${job.id}&select=*&limit=1`, {}, session.token)),
    ]);
    const customer = customers[0];
    const quote = quotes[0];
    if (!quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });

    const site = [job.site_address_line_1 || customer?.address_line_1, job.site_address_line_2 || customer?.address_line_2, job.site_city || customer?.city, job.site_postcode || customer?.postcode].filter(Boolean).join(", ");
    const customerName = [customer?.first_name, customer?.last_name].filter(Boolean).join(" ") || "Customer";
    const finish = Array.isArray(job.finishes) ? job.finishes.join(" + ") : "";
    if (!quote.scope_text?.trim() || Number(quote.amount||0)<=0) return NextResponse.json({ error: "Add the quote scope and final price before generating the PDF." }, { status: 400 });

    const pdf = buildQuotePdf({
      companyName: config.businessName,
      companyNumber: config.businessDetails.companyNumber,
      phone: config.businessDetails.phone,
      email: config.businessDetails.email,
      website: config.businessDetails.website,
      vatRegistered: config.businessDetails.vatRegistered,
      vatRate: Number(job.vat_rate || 0),
      vatNumber: config.businessDetails.vatNumber,
      template: config.quoteTemplate,
      accentColour: config.accentColour,
      reference: job.reference,
      version: Number(quote.version || 1),
      date: date(quote.created_at),
      validUntil: quote.valid_until ? date(`${quote.valid_until}T12:00:00`) : null,
      customerName,
      customerEmail: customer?.email,
      customerPhone: customer?.phone,
      site,
      jobType: job.job_type,
      dimensions: job.dimensions,
      material: job.material,
      finish,
      colour: job.colour,
      customerReference: job.customer_reference,
      scope: quote.scope_text,
      exclusions: quote.exclusions,
      amount: Number(quote.amount || 0),
      deposit: quote.deposit_amount === null ? null : Number(quote.deposit_amount),
      leadTime: quote.lead_time,
      companyAddress: config.businessDetails.officeAddress,
      bankName: config.businessDetails.bankName,
      accountNumber: config.businessDetails.accountNumber,
      sortCode: config.businessDetails.sortCode,
      defaultDepositPercent: config.businessDetails.defaultDepositPercent,
      quoteValidityDays: config.businessDetails.quoteValidityDays,
      paymentTerms: config.businessDetails.paymentTerms,
    });

    const fileName = `${job.reference}-V${quote.version}-quotation.pdf`;
    const storagePath = `${job.id}/quotes/${fileName}`;
    const encodedPath = storagePath.split("/").map(encodeURIComponent).join("/");
    const pdfBody = new Blob([new Uint8Array(pdf)], { type: "application/pdf" });
    const upload = await supabaseRequest(`/storage/v1/object/mj-job-files/${encodedPath}`, {
      method: "POST",
      headers: { "Content-Type": "application/pdf", "x-upsert": "true" },
      body: pdfBody,
    }, session.token);
    if (!upload.ok) {
      const detail = await upload.json().catch(() => null);
      return NextResponse.json({ error: detail?.message || "Could not store generated PDF" }, { status: 500 });
    }

    const existingFiles = await jsonOrError(await supabaseRequest(`/rest/v1/mj_files?job_id=eq.${job.id}&storage_path=eq.${encodeURIComponent(storagePath)}&select=*&limit=1`, {}, session.token));
    let file = existingFiles[0];
    if (!file) {
      const rows = await jsonOrError(await supabaseRequest("/rest/v1/mj_files", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ job_id: job.id, category: "quote", storage_path: storagePath, file_name: fileName, mime_type: "application/pdf", include_in_quote: false, uploaded_by: session.admin?.initials || session.accessUser?.name || session.accessUser?.email || "CRM user" }),
      }, session.token));
      file = rows[0];
    }

    await jsonOrError(await supabaseRequest(`/rest/v1/mj_quotes?id=eq.${encodeURIComponent(quote.id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ pdf_path: storagePath }),
    }, session.token));

    await supabaseRequest("/rest/v1/mj_audit_events", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ job_id: job.id, actor: session.admin?.initials || session.accessUser?.name || session.accessUser?.email || "CRM user", action: "generated", entity_type: "quote_pdf", entity_id: quote.id, changes: { version: quote.version, file_name: fileName } }),
    }, session.token);

    const signed = await supabaseRequest(`/storage/v1/object/sign/mj-job-files/${encodedPath}`, { method: "POST", body: JSON.stringify({ expiresIn: 3600 }) }, session.token);
    const signedBody = signed.ok ? await signed.json() : null;
    return NextResponse.json({ file, url: signedBody?.signedURL || signedBody?.signedUrl || null });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not generate PDF" }, { status: 500 });
  }
}
