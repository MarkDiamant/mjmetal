"use client";

import { useEffect, useMemo, useState } from "react";
import { DEFAULT_CRM_CONFIG } from "@/lib/crm/config";

function money(value: number | string | null | undefined) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(Number(value || 0));
}

export default function QuotePrint({ reference, quoteId }: { reference: string; quoteId: string }) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [sentMessage, setSentMessage] = useState("");
  const [crmConfig,setCrmConfig]=useState(DEFAULT_CRM_CONFIG);
  useEffect(()=>{fetch("/api/admin/settings",{cache:"no-store"}).then(async r=>{if(r.ok){const b=await r.json();if(b.settings)setCrmConfig(b.settings);}}).catch(()=>{});},[]);
  useEffect(() => {
    fetch(`/api/admin/jobs/${encodeURIComponent(reference)}`, { cache: "no-store" }).then(async (res) => {
      if (res.status === 401) { window.location.href = "/admin/login"; return; }
      const body = await res.json();
      if (!res.ok) setError(body.error || "Could not load quote"); else setData(body);
    });
  }, [reference]);

  const quote = useMemo(() => data?.quotes?.find((q: any) => q.id === quoteId), [data, quoteId]);
  if (error) return <main className="p-10">{error}</main>;
  if (!data) return <main className="p-10">Loading quote...</main>;
  if (!quote) return <main className="p-10">Quote not found.</main>;

  const j = data.job, c = data.customer || {};
  const name = [c.first_name, c.last_name].filter(Boolean).join(" ");
  const site = [j.site_address_line_1 || c.address_line_1, j.site_address_line_2 || c.address_line_2, j.site_city || c.city, j.site_postcode || c.postcode].filter(Boolean).join(", ");
  const photos = (data.files || []).filter((f: any) => f.include_in_quote && f.signed_url && String(f.mime_type || "").startsWith("image/")).slice(0, 3);
  const message = `Hi ${c.first_name || ""},\n\nPlease find our quotation ${j.reference} for ${String(j.job_type || "metalwork").toLowerCase()} at ${site}.\n\nQuotation: ${money(quote.amount)}\n\nKind regards,\n${crmConfig.businessName}`;
  const mailSubject = `${crmConfig.businessName} quotation ${j.reference}`;
  const template=crmConfig.quoteTemplate;
  const isClassic=template==="classic";
  const isMj=template==="mj-signature"&&crmConfig.tenantKey==="mj-metal";
  const pageClass=isClassic?"font-serif":isMj?"":"";
  const headerClass=isClassic?"border-b border-black pb-5":isMj?"border-b-4 border-[var(--brand)] pb-5":"border-b-2 border-[var(--brand)] pb-5";
  const panelClass=isClassic?"border-y border-black/20 py-5":isMj?"rounded-xl bg-[#f5f5f2] p-5":"border border-[var(--brand)]/30 p-5";
  const mailHref = `mailto:${encodeURIComponent(c.email || "")}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(message)}`;

  async function copyWhatsApp() {
    await navigator.clipboard.writeText(message);
    alert("WhatsApp message copied. Attach the saved PDF when sending.");
  }

  async function sendQuote() {
    if (!c.email) { alert("Add the customer's email address to the job first."); return; }
    if (!window.confirm(`Send quotation ${j.reference} V${quote.version} to ${c.email}?`)) return;
    setSending(true); setSentMessage("");
    const response = await fetch(`/api/admin/jobs/${encodeURIComponent(reference)}/send-quote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quoteId: quote.id }),
    });
    const body = await response.json().catch(() => ({}));
    setSending(false);
    if (!response.ok) { alert(body.error || "Unable to send quote"); return; }
    setSentMessage(`Sent to ${body.sentTo}`);
  }

  return <main className="min-h-screen bg-[#ecece8] py-6 text-[#171717] print:bg-white print:py-0" style={{"--brand":crmConfig.accentColour} as React.CSSProperties}>
    <style>{`@media print { @page { size: A4; margin: 0; } .quote-page { width: 210mm; min-height: 297mm; box-shadow: none !important; break-after: page; page-break-after: always; } .quote-page:last-child { break-after: auto; page-break-after: auto; } }`}</style>
    <div className="mx-auto mb-4 flex max-w-[900px] flex-wrap justify-end gap-2 px-4 print:hidden">
      {sentMessage && <span className="self-center rounded-lg bg-green-50 px-3 py-2 text-sm font-bold text-green-700">{sentMessage}</span>}
      <button onClick={() => document.getElementById("save-quote-pdf")?.click()} className="rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-black text-white">Save PDF</button>
      <button onClick={() => void sendQuote()} disabled={sending} className="rounded-xl bg-[#141414] px-4 py-2.5 text-sm font-black text-white disabled:opacity-50">{sending ? "Sending..." : "Send quote by email"}</button>
      <a href={mailHref} className="rounded-xl border border-black/15 bg-white px-4 py-2.5 text-sm font-bold">Open email draft</a>
      <button onClick={() => void copyWhatsApp()} className="rounded-xl border border-black/15 bg-white px-4 py-2.5 text-sm font-bold">Copy WhatsApp message</button>
      <a href={`/admin/jobs/${reference}`} className="rounded-xl border border-black/15 bg-white px-4 py-2.5 text-sm font-bold">Back to job</a>
    </div>

    <article className={`quote-page ${pageClass} mx-auto flex min-h-[1120px] max-w-[900px] flex-col bg-white px-10 py-9 shadow-xl sm:px-14`}>
      <header className={`flex items-start justify-between gap-8 ${headerClass}`}>
        <div><img src={crmConfig.logoUrl} alt={crmConfig.businessName} className="h-20 w-auto object-contain" /></div>
        <div className="text-right"><h1 className="text-3xl font-black uppercase tracking-tight">Quotation</h1><p className="mt-1 text-lg font-black text-[var(--brand)]">{j.reference} / V{quote.version}</p><p className="mt-1 text-xs text-black/55">Issued {new Date(quote.created_at).toLocaleDateString("en-GB")}{quote.valid_until ? ` · Valid until ${new Date(`${quote.valid_until}T12:00:00`).toLocaleDateString("en-GB")}` : ""}</p></div>
      </header>

      <section className="mt-6 grid gap-6 sm:grid-cols-2">
        <div><p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--brand)]">Client</p><p className="mt-1 text-lg font-black">{name}</p>{site && <p className="mt-1 text-sm leading-5 text-black/65">{site}</p>}{c.phone && <p className="mt-1 text-xs text-black/55">{c.phone}</p>}{c.email && <p className="text-xs text-black/55">{c.email}</p>}</div>
        <div><p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--brand)]">Project</p><p className="mt-1 text-lg font-black">{j.job_type}</p>{j.dimensions && <p className="mt-1 text-sm text-black/65">Approx. dimensions: {j.dimensions}</p>}{j.material && <p className="text-sm text-black/65">Material: {j.material}</p>}{(j.finishes || []).length > 0 && <p className="text-sm text-black/65">Finish: {(j.finishes || []).join(" + ")}{j.colour ? `, ${j.colour}` : ""}</p>}</div>
      </section>

      <section className="mt-6"><h2 className="border-b border-black/15 pb-1.5 text-base font-black">Scope of works</h2><div className="mt-3 whitespace-pre-wrap text-[14px] leading-6 text-black/75">{quote.scope_text}</div></section>

      {photos.length > 0 && <section className="mt-6"><div className={`grid gap-3 ${photos.length===1?"grid-cols-1":photos.length===2?"grid-cols-2":"grid-cols-3"}`}>{photos.map((f: any) => <img key={f.id} src={f.signed_url} alt={f.file_name} className="h-48 w-full rounded-lg border border-black/10 object-cover" />)}</div></section>}

      <section className={`mt-auto ${panelClass}`}><div className="flex items-end justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.12em] text-black/45">Quotation total</p><p className="mt-1 text-3xl font-black">{money(quote.amount)}</p><p className="mt-1 text-[10px] text-black/45">{crmConfig.businessDetails.vatRegistered?"VAT shown where applicable":"VAT not charged"}</p></div><div className="text-right text-sm leading-5 text-black/60">{quote.deposit_amount && <p><b>Deposit:</b> {money(quote.deposit_amount)}</p>}{quote.lead_time && <p><b>Estimated lead time:</b> {quote.lead_time}</p>}</div></div></section>
      <footer className="mt-4 text-[10px] leading-4 text-black/45">{crmConfig.businessName}{crmConfig.businessDetails.companyNumber?` · Company No. ${crmConfig.businessDetails.companyNumber}`:""}{crmConfig.businessDetails.phone?` · ${crmConfig.businessDetails.phone}`:""}{crmConfig.businessDetails.email?` · ${crmConfig.businessDetails.email}`:""}{crmConfig.businessDetails.website?` · ${crmConfig.businessDetails.website}`:""}</footer>
    </article>

    <article className={`quote-page ${pageClass} mx-auto mt-6 flex min-h-[1120px] max-w-[900px] flex-col bg-white px-10 py-9 shadow-xl print:mt-0 sm:px-14`}>
      <header className={`flex items-center justify-between ${isClassic?"border-b border-black pb-4":isMj?"border-b-4 border-[var(--brand)] pb-4":"border-b-2 border-[var(--brand)] pb-4"}`}><img src={crmConfig.logoUrl} alt={crmConfig.businessName} className="h-14 w-auto object-contain"/><div className="text-right"><p className="font-black">{j.reference} / V{quote.version}</p><p className="text-xs text-black/45">Quotation details</p></div></header>
      {quote.exclusions && <section className="mt-6"><h2 className="text-base font-black">Project notes</h2><div className="mt-2 whitespace-pre-wrap text-sm leading-5 text-black/70">{quote.exclusions}</div></section>}
      <section className="mt-6"><h2 className="text-base font-black">Payment & key terms</h2><div className="mt-3 grid gap-x-8 gap-y-2 text-[12px] leading-5 text-black/65 sm:grid-cols-2">
        <p><b>Payment:</b> {quote.deposit_amount ? `${money(quote.deposit_amount)} deposit. ${crmConfig.businessDetails.paymentTerms.replace(/^\s*\d+(?:\.\d+)?%\s+deposit\s*,?\s*/i,"")}` : crmConfig.businessDetails.paymentTerms || (crmConfig.businessDetails.defaultDepositPercent>0 ? `${crmConfig.businessDetails.defaultDepositPercent}% deposit, with the remaining balance due on completion.` : "Payment terms as agreed for this project.")}</p>
        <p><b>Validity:</b> This quotation is valid for {crmConfig.businessDetails.quoteValidityDays} days unless another validity date is shown above.</p>
        <p><b>Scope:</b> The price covers only the works specifically described in this quotation. Additional or changed works will be agreed separately.</p>
        <p><b>Measurements:</b> Final site measurements take precedence over preliminary dimensions.</p>
        <p><b>Lead times:</b> Dates and lead times are estimates and may change due to access, materials or circumstances outside our control.</p>
        <p><b>Ownership:</b> Fabricated items remain the property of the supplier until paid for in full.</p>
      </div></section>
      <section className="mt-6 rounded-xl border border-black/10 bg-[#fafaf8] p-4 text-[11px] leading-5 text-black/55"><b className="text-black/70">General assumptions</b><p className="mt-1">Unless specifically included in the scope, the quotation excludes electrical work, decorating, planning applications and unforeseen structural alterations. Any variation to specification, site conditions or access requirements may affect the price or programme.</p></section>
      <section className="mt-7"><h2 className="text-base font-black">Acceptance</h2><p className="mt-2 text-sm leading-5 text-black/65">I/We accept this quotation and authorise {crmConfig.businessName} to proceed with the works described.</p><div className="mt-8 grid grid-cols-3 gap-5 text-xs"><div className="border-t border-black/35 pt-2">Name</div><div className="border-t border-black/35 pt-2">Signature</div><div className="border-t border-black/35 pt-2">Date</div></div></section>
      <footer className="mt-auto border-t border-black/10 pt-4 text-[10px] leading-4 text-black/45"><p className="font-bold text-black/60">{crmConfig.businessName.toUpperCase()}</p><p>{crmConfig.businessDetails.officeAddress}</p><p>{[crmConfig.businessDetails.phone,crmConfig.businessDetails.email,crmConfig.businessDetails.website,crmConfig.businessDetails.companyNumber?`Company No. ${crmConfig.businessDetails.companyNumber}`:"",crmConfig.businessDetails.vatRegistered&&crmConfig.businessDetails.vatNumber?`VAT ${crmConfig.businessDetails.vatNumber}`:""].filter(Boolean).join(" · ")}</p>{crmConfig.businessDetails.bankName&&<p className="mt-1">Payment: {crmConfig.businessDetails.bankName} · Sort code {crmConfig.businessDetails.sortCode} · Account {crmConfig.businessDetails.accountNumber}</p>}</footer>
    </article>
  </main>;
}
