"use client";

import { useEffect, useMemo, useState } from "react";

function money(value: number | string | null | undefined) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(Number(value || 0));
}

export default function QuotePrint({ reference, quoteId }: { reference: string; quoteId: string }) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [sentMessage, setSentMessage] = useState("");
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
  const photos = (data.files || []).filter((f: any) => f.include_in_quote && f.signed_url && String(f.mime_type || "").startsWith("image/")).slice(0, 2);
  const message = `Hi ${c.first_name || ""},\n\nPlease find our quotation ${j.reference} for ${String(j.job_type || "metalwork").toLowerCase()} at ${site}.\n\nQuotation: ${money(quote.amount)}\n\nKind regards,\nM&J Metal`;
  const mailSubject = `M&J Metal quotation ${j.reference}`;
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

  return <main className="min-h-screen bg-[#ecece8] py-6 text-[#171717] print:bg-white print:py-0">
    <div className="mx-auto mb-4 flex max-w-[900px] flex-wrap justify-end gap-2 px-4 print:hidden">
      {sentMessage && <span className="self-center rounded-lg bg-green-50 px-3 py-2 text-sm font-bold text-green-700">{sentMessage}</span>}
      <button onClick={() => window.print()} className="rounded-xl bg-[#e66a24] px-4 py-2.5 text-sm font-black text-white">Print / Save PDF</button>
      <button onClick={() => void sendQuote()} disabled={sending} className="rounded-xl bg-[#141414] px-4 py-2.5 text-sm font-black text-white disabled:opacity-50">{sending ? "Sending..." : "Send quote by email"}</button>
      <a href={mailHref} className="rounded-xl border border-black/15 bg-white px-4 py-2.5 text-sm font-bold">Open email draft</a>
      <button onClick={() => void copyWhatsApp()} className="rounded-xl border border-black/15 bg-white px-4 py-2.5 text-sm font-bold">Copy WhatsApp message</button>
      <a href={`/admin/jobs/${reference}`} className="rounded-xl border border-black/15 bg-white px-4 py-2.5 text-sm font-bold">Back to job</a>
    </div>

    <article className="mx-auto min-h-[1120px] max-w-[900px] bg-white px-10 py-10 shadow-xl print:min-h-0 print:max-w-none print:shadow-none sm:px-14">
      <header className="flex items-start justify-between gap-8 border-b-4 border-[#e66a24] pb-6">
        <div><img src="/images/logo.png" alt="M&J Metal" className="h-20 w-auto object-contain" /><p className="mt-3 text-sm font-semibold text-black/55">Bespoke Gates & Metalwork</p></div>
        <div className="text-right"><h1 className="text-3xl font-black uppercase tracking-tight">Quotation</h1><p className="mt-2 text-lg font-black text-[#e66a24]">{j.reference} / V{quote.version}</p><p className="mt-1 text-sm text-black/55">Date: {new Date(quote.created_at).toLocaleDateString("en-GB")}</p>{quote.valid_until && <p className="text-sm text-black/55">Valid until: {new Date(`${quote.valid_until}T12:00:00`).toLocaleDateString("en-GB")}</p>}</div>
      </header>

      <section className="mt-8 grid gap-8 sm:grid-cols-2">
        <div><p className="text-xs font-black uppercase tracking-[0.12em] text-[#e66a24]">Prepared for</p><p className="mt-2 text-xl font-black">{name}</p>{site && <p className="mt-2 leading-6 text-black/65">{site}</p>}{c.phone && <p className="mt-1 text-black/60">{c.phone}</p>}{c.email && <p className="text-black/60">{c.email}</p>}</div>
        <div><p className="text-xs font-black uppercase tracking-[0.12em] text-[#e66a24]">Project</p><p className="mt-2 text-xl font-black">{j.job_type}</p>{j.dimensions && <p className="mt-2 text-black/65">Approx. dimensions: {j.dimensions}</p>}{j.material && <p className="text-black/65">Material: {j.material}</p>}{(j.finishes || []).length > 0 && <p className="text-black/65">Finish: {(j.finishes || []).join(" + ")}{j.colour ? `, ${j.colour}` : ""}</p>}{j.customer_reference && <p className="mt-1 text-black/65">Customer reference: {j.customer_reference}</p>}</div>
      </section>

      <section className="mt-9"><h2 className="border-b border-black/15 pb-2 text-lg font-black">Scope of works</h2><div className="mt-4 whitespace-pre-wrap leading-7 text-black/75">{quote.scope_text}</div></section>
      {quote.exclusions && <section className="mt-7"><h2 className="border-b border-black/15 pb-2 text-lg font-black">Notes / exclusions</h2><div className="mt-4 whitespace-pre-wrap leading-7 text-black/70">{quote.exclusions}</div></section>}

      {photos.length > 0 && <section className="mt-8"><h2 className="mb-4 border-b border-black/15 pb-2 text-lg font-black">Site photos</h2><div className="grid grid-cols-2 gap-4">{photos.map((f: any) => <img key={f.id} src={f.signed_url} alt={f.file_name} className="h-64 w-full rounded-xl border border-black/10 object-cover" />)}</div></section>}

      <section className="mt-9 rounded-2xl bg-[#f5f5f2] p-6"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.12em] text-black/45">Total quotation</p><p className="mt-2 text-4xl font-black">{money(quote.amount)}</p></div><div className="text-right text-sm leading-6 text-black/60">{quote.deposit_amount && <p><b>Deposit:</b> {money(quote.deposit_amount)}</p>}{quote.lead_time && <p><b>Estimated lead time:</b> {quote.lead_time}</p>}</div></div></section>

      <footer className="mt-12 border-t border-black/15 pt-5 text-xs leading-5 text-black/50"><p className="font-bold text-black/65">M&J METAL LTD</p><p>Company No. 17330239 · Office 6, 1st Floor, Sutherland House, 70-78 West Hendon Broadway, London, NW9 7BT</p><p>mjmetal.co.uk</p></footer>
    </article>
  </main>;
}
