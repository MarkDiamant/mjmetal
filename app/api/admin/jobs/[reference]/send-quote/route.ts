import { NextResponse } from "next/server";
import { Resend } from "resend";
import { requireAdminToken, supabaseRequest } from "@/lib/crm/supabase-server";

const resend = new Resend(process.env.RESEND_API_KEY);

function esc(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function money(value: unknown) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(Number(value || 0));
}

export async function POST(request: Request, { params }: { params: Promise<{ reference: string }> }) {
  const session = await requireAdminToken();
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { reference } = await params;
  const body = await request.json().catch(() => ({})) as { quoteId?: string };
  if (!body.quoteId) return NextResponse.json({ error: "Quote is required" }, { status: 400 });

  const jobsResponse = await supabaseRequest(
    `/rest/v1/mj_jobs?reference=eq.${encodeURIComponent(reference.toUpperCase())}&select=*,mj_customers(*)&limit=1`,
    { method: "GET" }, session.token,
  );
  if (!jobsResponse.ok) return NextResponse.json({ error: "Unable to load job" }, { status: 500 });
  const jobs = await jobsResponse.json() as Array<Record<string, any>>;
  const job = jobs[0];
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  const customer = job.mj_customers || {};
  if (!customer.email) return NextResponse.json({ error: "Customer has no email address" }, { status: 400 });

  const quoteResponse = await supabaseRequest(
    `/rest/v1/mj_quotes?id=eq.${encodeURIComponent(body.quoteId)}&job_id=eq.${encodeURIComponent(job.id)}&select=*&limit=1`,
    { method: "GET" }, session.token,
  );
  if (!quoteResponse.ok) return NextResponse.json({ error: "Unable to load quote" }, { status: 500 });
  const quotes = await quoteResponse.json() as Array<Record<string, any>>;
  const quote = quotes[0];
  if (!quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });

  const name = [customer.first_name, customer.last_name].filter(Boolean).join(" ") || "Customer";
  const site = [job.site_address_line_1 || customer.address_line_1, job.site_address_line_2 || customer.address_line_2, job.site_city || customer.city, job.site_postcode || customer.postcode].filter(Boolean).join(", ");
  const scopeHtml = esc(quote.scope_text).replaceAll("\n", "<br>");
  const exclusionsHtml = quote.exclusions ? esc(quote.exclusions).replaceAll("\n", "<br>") : "";

  const { error } = await resend.emails.send({
    from: "M&J Metal <info@mjmetal.co.uk>",
    to: [customer.email],
    replyTo: "info@mjmetal.co.uk",
    subject: `M&J Metal quotation ${job.reference}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:680px;margin:auto;color:#171717;line-height:1.6">
        <h2 style="margin-bottom:4px">M&amp;J Metal</h2>
        <p style="color:#666;margin-top:0">Bespoke Gates &amp; Metalwork</p>
        <hr style="border:none;border-top:4px solid #e66a24;margin:24px 0">
        <p>Dear ${esc(customer.first_name || name)},</p>
        <p>Please find our quotation <strong>${esc(job.reference)}</strong>${site ? ` for works at ${esc(site)}` : ""}.</p>
        <h3>Scope of works</h3>
        <p>${scopeHtml}</p>
        ${exclusionsHtml ? `<h3>Notes / exclusions</h3><p>${exclusionsHtml}</p>` : ""}
        <div style="background:#f5f5f2;padding:18px;border-radius:12px;margin:24px 0">
          <div style="font-size:13px;color:#666">Total quotation</div>
          <div style="font-size:28px;font-weight:700">${money(quote.amount)}</div>
          ${quote.deposit_amount ? `<div><strong>Deposit:</strong> ${money(quote.deposit_amount)}</div>` : ""}
          ${quote.lead_time ? `<div><strong>Estimated lead time:</strong> ${esc(quote.lead_time)}</div>` : ""}
          ${quote.valid_until ? `<div><strong>Valid until:</strong> ${new Date(`${quote.valid_until}T12:00:00`).toLocaleDateString("en-GB")}</div>` : ""}
        </div>
        <p>If you would like to proceed or have any questions, simply reply to this email.</p>
        <p>Kind regards,<br><strong>M&amp;J Metal</strong><br>info@mjmetal.co.uk<br>mjmetal.co.uk</p>
      </div>
    `,
  });

  if (error) return NextResponse.json({ error: error.message || "Unable to send quote" }, { status: 500 });

  const sentAt = new Date().toISOString();
  await Promise.all([
    supabaseRequest(`/rest/v1/mj_quotes?id=eq.${encodeURIComponent(quote.id)}`, {
      method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ status: "sent", sent_at: sentAt }),
    }, session.token),
    supabaseRequest(`/rest/v1/mj_jobs?id=eq.${encodeURIComponent(job.id)}`, {
      method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ status: "quote_sent", quote_sent_at: sentAt, updated_at: sentAt }),
    }, session.token),
    supabaseRequest("/rest/v1/mj_activities", {
      method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ job_id: job.id, activity_type: "email", actor: session.admin.initials, summary: `Quotation V${quote.version} emailed to customer`, details: customer.email, occurred_at: sentAt }),
    }, session.token),
    supabaseRequest("/rest/v1/mj_integration_events", {
      method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ job_id: job.id, source: "resend", event_type: "quote_sent", payload: { quote_id: quote.id, version: quote.version, to: customer.email }, occurred_at: sentAt, processed_at: sentAt }),
    }, session.token),
  ]);

  return NextResponse.json({ ok: true, sentTo: customer.email, sentAt });
}
