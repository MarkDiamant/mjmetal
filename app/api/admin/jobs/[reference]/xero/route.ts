import { NextRequest, NextResponse } from "next/server";
import { requirePermission, supabaseRequest } from "@/lib/crm/supabase-server";
import { DEFAULT_CRM_CONFIG, normaliseCrmConfig } from "@/lib/crm/config";
import { createXeroContact, createXeroDraftInvoice, getXeroInvoice } from "@/lib/crm/xero-invoices";

async function jsonOrError(response: Response) {
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message || body?.error_description || body?.hint || "Database request failed");
  return body;
}

async function loadJob(token: string, reference: string) {
  const rows = await jsonOrError(await supabaseRequest(`/rest/v1/mj_jobs?reference=eq.${encodeURIComponent(reference)}&select=*&limit=1`, {}, token));
  if (!rows[0]) throw new Error("Job not found");
  return rows[0];
}

async function listLocalInvoices(token: string, jobId: string) {
  return jsonOrError(await supabaseRequest(`/rest/v1/mj_xero_invoices?job_id=eq.${jobId}&select=*&order=created_at.desc`, {}, token));
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ reference: string }> }) {
  const session = await requirePermission("view_payments_invoices");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { reference } = await params;
    const job = await loadJob(session.token, reference);
    return NextResponse.json({ invoices: await listLocalInvoices(session.token, job.id) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load Xero invoices" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ reference: string }> }) {
  const session = await requirePermission("view_payments_invoices");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { reference } = await params;
    const body = await request.json();
    const job = await loadJob(session.token, reference);

    if (body.action === "create") {
      const existing = await listLocalInvoices(session.token, job.id);
      if (existing.length) return NextResponse.json({ error: "A Xero invoice already exists for this job" }, { status: 409 });

      const amount = Number(body.amount ?? job.quoted_amount ?? job.agreed_amount ?? 0);
      if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: "Set an agreed or quoted amount before creating the Xero invoice" }, { status: 400 });

      const customers = await jsonOrError(await supabaseRequest(`/rest/v1/mj_customers?id=eq.${job.customer_id}&select=*&limit=1`, {}, session.token));
      const customer = customers[0];
      if (!customer) throw new Error("Customer not found");

      let contactId = customer.xero_contact_id as string | null;
      if (!contactId) {
        const settingsPath="_crm/settings.json".split("/").map(encodeURIComponent).join("/");
        const settingsRes=await supabaseRequest(`/storage/v1/object/mj-job-files/${settingsPath}`,{method:"GET"},session.token);
        const cfg=settingsRes.ok?normaliseCrmConfig(await settingsRes.json().catch(()=>null)):DEFAULT_CRM_CONFIG;
        const prefix=(cfg.businessName||"CRM").replace(/[^A-Za-z0-9]/g,"").slice(0,6).toUpperCase()||"CRM";
        const contact = await createXeroContact(session.token, customer, prefix);
        contactId = contact.ContactID;
        await jsonOrError(await supabaseRequest(`/rest/v1/mj_customers?id=eq.${customer.id}`, {
          method: "PATCH",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({ xero_contact_id: contactId, updated_at: new Date().toISOString() }),
        }, session.token));
      }
      if (!contactId) throw new Error("Xero contact could not be resolved");

      const quotes = await jsonOrError(await supabaseRequest(`/rest/v1/mj_quotes?job_id=eq.${job.id}&select=scope_text&order=version.desc&limit=1`, {}, session.token));
      const description = String(body.description || quotes[0]?.scope_text || job.customer_requirements || "").trim().slice(0,4000);
      if(!description) return NextResponse.json({error:"Add an invoice description before creating the Xero invoice"},{status:400});
      const invoice = await createXeroDraftInvoice(session.token, { contactId, reference: job.reference, description, amount, vatRate: Number(body.vat_rate ?? job.vat_rate ?? 0) });

      const created = await jsonOrError(await supabaseRequest("/rest/v1/mj_xero_invoices", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          job_id: job.id,
          xero_invoice_id: invoice.InvoiceID,
          invoice_number: invoice.InvoiceNumber || null,
          status: invoice.Status || "DRAFT",
          total: Number(invoice.Total ?? amount),
          amount_due: Number(invoice.AmountDue ?? amount),
          amount_paid: Number(invoice.AmountPaid ?? 0),
          currency_code: invoice.CurrencyCode || "GBP",
          created_by: session.admin.initials,
          synced_at: new Date().toISOString(),
        }),
      }, session.token));

      await supabaseRequest("/rest/v1/mj_integration_events", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ job_id: job.id, source: "xero", external_id: invoice.InvoiceID, event_type: "invoice_created", payload: { invoice_number: invoice.InvoiceNumber || null, status: invoice.Status || "DRAFT", amount } }),
      }, session.token);

      await supabaseRequest(`/rest/v1/mj_jobs?id=eq.${job.id}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ status: "awaiting_final_payment", next_action: "Collect outstanding balance", updated_at: new Date().toISOString() }) }, session.token);
      return NextResponse.json({ invoice: created[0] }, { status: 201 });
    }

    if (body.action === "sync") {
      const locals = await listLocalInvoices(session.token, job.id);
      const updated = [];
      for (const local of locals) {
        const invoice = await getXeroInvoice(session.token, local.xero_invoice_id);
        const rows = await jsonOrError(await supabaseRequest(`/rest/v1/mj_xero_invoices?id=eq.${local.id}`, {
          method: "PATCH",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({
            invoice_number: invoice.InvoiceNumber || local.invoice_number,
            status: invoice.Status || local.status,
            total: Number(invoice.Total ?? local.total ?? 0),
            amount_due: Number(invoice.AmountDue ?? local.amount_due ?? 0),
            amount_paid: Number(invoice.AmountPaid ?? local.amount_paid ?? 0),
            currency_code: invoice.CurrencyCode || local.currency_code,
            synced_at: new Date().toISOString(),
          }),
        }, session.token));
        if (rows[0]) updated.push(rows[0]);
      }
      return NextResponse.json({ invoices: updated });
    }

    return NextResponse.json({ error: "Unsupported Xero action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Xero invoice action failed" }, { status: 500 });
  }
}
