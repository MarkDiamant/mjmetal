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
  const [pdfBusy, setPdfBusy] = useState(false);
  const [crmConfig,setCrmConfig]=useState(DEFAULT_CRM_CONFIG);
  const [connectedGmail,setConnectedGmail]=useState<string|null>(null);
  const [drafting,setDrafting]=useState(false);
  const [whatsAppBusy,setWhatsAppBusy]=useState(false);
  const [draftNotice,setDraftNotice]=useState<{email:string}|null>(null);
  useEffect(()=>{fetch("/api/admin/settings",{cache:"no-store"}).then(async r=>{if(r.ok){const b=await r.json();if(b.settings)setCrmConfig(b.settings);}}).catch(()=>{});fetch("/api/admin/integrations/google/status",{cache:"no-store"}).then(async r=>{if(r.ok){const b=await r.json();if(b.connected&&b.email)setConnectedGmail(String(b.email));}}).catch(()=>{});},[]);
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
  // Job photos/files stay internal to the job record. Quotes and invoices never depend on them.
  const message = `Hi ${c.first_name || ""},

Please find our quotation ${j.reference} for ${String(j.job_type || "metalwork").toLowerCase()} at ${site}.

Quotation: ${money(quote.amount)}

Kind regards,
${crmConfig.businessName}`;
  const template=crmConfig.quoteTemplate;
  const isClassic=template==="classic";
  const isMj=template==="mj-signature";
  const pageClass=isClassic?"font-serif":isMj?"":"";
  const headerClass=isClassic?"border-b border-black pb-5":isMj?"border-b-4 border-[var(--brand)] pb-5":"border-b-2 border-[var(--brand)] pb-5";
  const panelClass=isClassic?"border-y border-black/20 py-5":isMj?"rounded-xl bg-[#f5f5f2] p-5":"border border-[var(--brand)]/30 p-5";

  async function shareWhatsApp() {
    if(whatsAppBusy)return;
    setWhatsAppBusy(true);
    try{
      document.getElementById("save-quote-pdf")?.click();
      const raw=String(c.mobile||c.mobile_phone||c.phone||"").trim();
      const digits=raw.replace(/[^\\d+]/g,"");
      let number=digits.startsWith("+")?digits.slice(1):digits.startsWith("00")?digits.slice(2):digits.startsWith("0")?"44"+digits.slice(1):digits;
      if(!/^\\d{8,15}$/.test(number))number="";
      const whatsappUrl=`https://wa.me/${number}?text=${encodeURIComponent(message)}`;
      await navigator.clipboard.writeText(message).catch(()=>{});
      setTimeout(()=>{const opened=window.open(whatsappUrl,"_blank","noopener,noreferrer");if(!opened)window.location.assign(whatsappUrl);},350);
      alert("The quotation PDF is downloading. Attach it in WhatsApp, check the recipient and press Send.");
    }catch(error){alert(error instanceof Error?error.message:"Could not prepare WhatsApp share");}
    finally{setWhatsAppBusy(false);}
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

  return <><main className="min-h-screen bg-[#ecece8] py-6 text-[#171717] print:bg-white print:py-0" style={{"--brand":crmConfig.accentColour} as React.CSSProperties}>
    <style>{`@media print { @page { size: A4; margin: 0; } .quote-page { width: 210mm; min-height: 297mm; box-shadow: none !important; break-after: page; page-break-after: always; } .quote-page:last-child { break-after: auto; page-break-after: auto; } }`}</style>
    <div className="mx-auto mb-4 flex max-w-[900px] flex-wrap justify-end gap-2 px-4 print:hidden">
      {sentMessage && <span className="self-center rounded-lg bg-green-50 px-3 py-2 text-sm font-bold text-green-700">{sentMessage}</span>}
      <button onClick={() => { setPdfBusy(true); document.getElementById("save-quote-pdf")?.click(); }} disabled={pdfBusy} className="rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-black text-white disabled:opacity-60">{pdfBusy ? "Saving PDF..." : "Save PDF"}</button>
      {connectedGmail&&<button onClick={() => void sendQuote()} disabled={sending} className="rounded-xl bg-[#141414] px-4 py-2.5 text-sm font-black text-white disabled:opacity-50">{sending ? "Sending..." : "Send quote by email"}</button>}
      {connectedGmail&&<button type="button" disabled={drafting} onClick={async()=>{setDrafting(true);try{const response=await fetch(`/api/admin/jobs/${encodeURIComponent(reference)}/draft-quote`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({quoteId:quote.id})});const body=await response.json().catch(()=>({}));if(!response.ok)throw new Error(body.error||"Could not create Gmail draft");setDraftNotice({email:body.from||connectedGmail||"connected Gmail"});}catch(error){alert(error instanceof Error?error.message:"Could not create Gmail draft");}finally{setDrafting(false);}}} className="rounded-xl border border-black/15 bg-white px-4 py-2.5 text-sm font-bold disabled:opacity-50">{drafting?"Creating Gmail draft...":"Open email draft"}</button>}
      <button onClick={() => void shareWhatsApp()} disabled={whatsAppBusy} className="rounded-xl border border-black/15 bg-white px-4 py-2.5 text-sm font-bold disabled:opacity-50">{whatsAppBusy?"Preparing WhatsApp...":"Share via WhatsApp"}</button>
      <a href={`/admin/jobs/${reference}`} className="rounded-xl border border-black/15 bg-white px-4 py-2.5 text-sm font-bold">Back to job</a><a href="/admin" className="rounded-xl border border-black/15 bg-white px-4 py-2.5 text-sm font-bold">Back to admin</a>
    </div>

    <article className={`quote-page ${pageClass} mx-auto flex min-h-[1120px] max-w-[900px] flex-col bg-white px-10 py-9 shadow-xl sm:px-14 hidden`}>
      <header className={`flex items-start justify-between gap-8 ${headerClass}`}>
        <div><img src={crmConfig.logoUrl} alt={crmConfig.businessName} className="h-20 w-auto object-contain" /></div>
        <div className="text-right"><h1 className="max-w-[430px] text-2xl font-black uppercase tracking-tight">{isMj ? "Project Proposal" : "Quotation"}</h1><p className="mt-1 text-lg font-black text-[var(--brand)]">{isMj ? j.reference : `${j.reference} / V${quote.version}`}</p><p className="mt-1 text-xs text-black/55">Issued {new Date(quote.created_at).toLocaleDateString("en-GB")}{quote.valid_until ? ` · Valid until ${new Date(`${quote.valid_until}T12:00:00`).toLocaleDateString("en-GB")}` : ""}</p></div>
      </header>

      {isMj && <p className="mt-3 text-xs font-black text-[var(--brand)]">Built Strong. Built to Last.</p>}<section className="mt-6 grid gap-6 sm:grid-cols-2">
        <div><p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--brand)]">{isMj ? "Client Information" : "Client"}</p><p className="mt-1 text-lg font-black">{name}</p>{site && <p className="mt-1 text-sm leading-5 text-black/65">{site}</p>}{c.phone && <p className="mt-1 text-xs text-black/55">{c.phone}</p>}{c.email && <p className="text-xs text-black/55">{c.email}</p>}</div>
        <div><p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--brand)]">{isMj ? "Project Overview & Lead Times" : "Project"}</p><p className="mt-1 text-lg font-black">{j.job_type}</p>{j.dimensions && <p className="mt-1 text-sm text-black/65">Approx. dimensions: {j.dimensions}</p>}{j.material && <p className="text-sm text-black/65">Material: {j.material}</p>}{(j.finishes || []).length > 0 && <p className="text-sm text-black/65">Finish: {(j.finishes || []).join(" + ")}{j.colour ? `, ${j.colour}` : ""}</p>}</div>
      </section>

      {!isMj && <section className="mt-6"><h2 className="border-b border-black/15 pb-1.5 text-base font-black">Scope of works</h2><div className="mt-3 whitespace-pre-wrap text-[14px] leading-6 text-black/75">{quote.scope_text}</div></section>}

      

      {!isMj && <section className={`mt-auto ${panelClass}`}><div className="flex items-end justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.12em] text-black/45">Quotation total</p><p className="mt-1 text-3xl font-black">{money(quote.amount)}</p><p className="mt-1 text-[10px] text-black/45">{crmConfig.businessDetails.vatRegistered&&Number(quote.vat_rate||0)>0?`VAT ${Number(quote.vat_rate)}%`:"VAT not charged"}</p></div><div className="text-right text-sm leading-5 text-black/60">{quote.deposit_amount && <p><b>Deposit:</b> {money(quote.deposit_amount)}</p>}{quote.lead_time && <p><b>Estimated lead time:</b> {quote.lead_time}</p>}</div></div></section>}
      <footer className="mt-4 text-[10px] leading-4 text-black/45">{crmConfig.businessName}{crmConfig.businessDetails.companyNumber?` · Company No. ${crmConfig.businessDetails.companyNumber}`:""}{crmConfig.businessDetails.phone?` · ${crmConfig.businessDetails.phone}`:""}{crmConfig.businessDetails.email?` · ${crmConfig.businessDetails.email}`:""}{crmConfig.businessDetails.website?` · ${crmConfig.businessDetails.website}`:""}</footer>
    </article>

    <article className={`quote-page ${pageClass} mx-auto mt-0 flex min-h-[1120px] max-w-[900px] flex-col bg-white px-10 py-9 shadow-xl print:mt-0 sm:px-14`}>
      <header className={`flex items-center justify-between ${isClassic?"border-b border-black pb-4":isMj?"border-b-4 border-[var(--brand)] pb-4":"border-b-2 border-[var(--brand)] pb-4"}`}><img src={crmConfig.logoUrl} alt={crmConfig.businessName} className="h-14 w-auto object-contain"/><div className="text-right"><p className="font-black">{isMj ? j.reference : `${j.reference} / V${quote.version}`}</p><p className="text-xs text-black/45">Quotation details</p></div></header>{isMj&&<section className="mt-5 grid gap-6 sm:grid-cols-2"><div><p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--brand)]">Client Information</p><p className="mt-1 text-base font-black">{name}</p>{site&&<p className="mt-1 text-xs leading-5 text-black/65">{site}</p>}{(c.phone||c.email)&&<p className="mt-1 text-xs text-black/55">{c.phone}{c.phone&&c.email&&" · "}{c.email}</p>}</div><div><p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--brand)]">Project</p><p className="mt-1 text-base font-black">{j.job_type}</p><p className="mt-1 text-xs text-black/55">Issued {new Date(quote.created_at).toLocaleDateString("en-GB")}{quote.valid_until?` · Valid until ${new Date(`${quote.valid_until}T12:00:00`).toLocaleDateString("en-GB")}`:""}</p></div></section>}
      {isMj && <section className={`mt-6 ${panelClass}`}><div className="flex items-end justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.12em] text-black/45">Quotation total</p><p className="mt-1 text-3xl font-black">{money(quote.amount)}</p><p className="mt-1 text-[10px] text-black/45">{crmConfig.businessDetails.vatRegistered&&Number(quote.vat_rate||0)>0?`VAT ${Number(quote.vat_rate)}%`:"VAT not charged"}</p></div><div className="text-right text-sm leading-5 text-black/60">{quote.deposit_amount && <p><b>Deposit:</b> {money(quote.deposit_amount)}</p>}{quote.lead_time && <p><b>Estimated lead time:</b> {quote.lead_time}</p>}</div></div></section>}
      {isMj && <section className="mt-6"><h2 className="border-b border-black/15 pb-1.5 text-base font-black">Scope of Works</h2><div className="mt-3 whitespace-pre-wrap text-[14px] leading-6 text-black/75">{quote.scope_text}</div></section>}
      {quote.exclusions && <section className="mt-6"><h2 className="text-base font-black">{isMj ? "Project Specific Exclusions" : "Project notes"}</h2><div className="mt-2 whitespace-pre-wrap text-sm leading-5 text-black/70">{quote.exclusions}</div></section>}
      {isMj ? <section className="mt-6"><h2 className="text-base font-black">Payment & Terms</h2><div className="mt-3 rounded-xl border border-black/10 bg-[#fafaf8] p-5 text-[13px] leading-6 text-black/70"><p><b>Payment:</b> {quote.deposit_amount ? `${money(quote.deposit_amount)} deposit, with the balance due on completion.` : crmConfig.businessDetails.paymentTerms}</p><p className="mt-2"><b>Terms:</b> Quote valid for {crmConfig.businessDetails.quoteValidityDays} days. Final site measurements apply. Any additional or changed work will be agreed separately. Lead times are estimates and may change due to access, materials or circumstances outside our control. Fabricated items remain our property until paid in full.</p>{crmConfig.businessDetails.bankName&&<div className="mt-3 border-t border-black/10 pt-3 text-[14px] leading-6 text-black/80"><p className="font-black">Bank details</p><p>Account name: {crmConfig.businessDetails.bankName}</p><p>Sort code: {crmConfig.businessDetails.sortCode}</p><p>Account number: {crmConfig.businessDetails.accountNumber}</p></div>}</div></section> : <section className="mt-6"><h2 className="text-base font-black">Payment & key terms</h2><div className="mt-3 grid gap-x-8 gap-y-2 text-[12px] leading-5 text-black/65 sm:grid-cols-2"><p><b>Payment:</b> {quote.deposit_amount ? `${money(quote.deposit_amount)} deposit. ${crmConfig.businessDetails.paymentTerms.replace(/^\s*\d+(?:\.\d+)?%\s+deposit\s*,?\s*/i,"")}` : crmConfig.businessDetails.paymentTerms}</p><p><b>Validity:</b> This quotation is valid for {crmConfig.businessDetails.quoteValidityDays} days unless another validity date is shown above.</p><p><b>Scope:</b> The price covers only the works specifically described in this quotation. Additional or changed works will be agreed separately.</p><p><b>Measurements:</b> Final site measurements take precedence over preliminary dimensions.</p><p><b>Lead times:</b> Dates and lead times are estimates and may change due to access, materials or circumstances outside our control.</p><p><b>Ownership:</b> Fabricated items remain the property of the supplier until paid for in full.</p></div></section>}
{isMj&&<p className="mt-7 text-center text-[13px] font-semibold text-black/65">Thank you for the opportunity to quote for your project. We look forward to working with you.</p>}{!isMj&&<section className="mt-7"><h2 className="text-base font-black">Acceptance</h2><p className="mt-2 text-sm leading-5 text-black/65">I/We accept this quotation and authorise {crmConfig.businessName} to proceed with the works described.</p><div className="mt-8 grid grid-cols-3 gap-5 text-xs"><div className="border-t border-black/35 pt-2">Name</div><div className="border-t border-black/35 pt-2">Signature</div><div className="border-t border-black/35 pt-2">Date</div></div></section>}
      <footer className="mt-auto border-t border-black/10 pt-4 text-[10px] leading-4 text-black/45"><p className="font-bold text-black/60">{crmConfig.businessName.toUpperCase()}</p><p>{crmConfig.businessDetails.officeAddress}</p><p>{[crmConfig.businessDetails.phone,crmConfig.businessDetails.email,crmConfig.businessDetails.website,crmConfig.businessDetails.companyNumber?`Company No. ${crmConfig.businessDetails.companyNumber}`:"",crmConfig.businessDetails.vatRegistered&&crmConfig.businessDetails.vatNumber?`VAT ${crmConfig.businessDetails.vatNumber}`:""].filter(Boolean).join(" · ")}</p>{!isMj&&crmConfig.businessDetails.bankName&&<p className="mt-1">Payment: {crmConfig.businessDetails.bankName} · Sort code {crmConfig.businessDetails.sortCode} · Account {crmConfig.businessDetails.accountNumber}</p>}</footer>
    </article>
    <span className="hidden" data-pdf-status-listener onClick={() => setPdfBusy(false)} />
  </main>{draftNotice&&<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 print:hidden"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--brand)] text-xl font-black text-white">✓</div><h2 className="text-xl font-black">Email draft created</h2><p className="mt-2 text-sm leading-6 text-black/60">Draft created in <strong className="text-black">{draftNotice.email}</strong> with the quotation PDF attached.</p><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={()=>setDraftNotice(null)} className="rounded-xl border border-black/15 bg-white px-4 py-2.5 text-sm font-bold">Close</button><button type="button" onClick={()=>{window.open(`https://mail.google.com/mail/u/?authuser=${encodeURIComponent(draftNotice.email)}#drafts`,"_blank","noopener,noreferrer");setDraftNotice(null);}} className="rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-black text-white">Open Gmail</button></div></div></div>}</>;
}
