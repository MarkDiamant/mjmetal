"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { DEFAULT_CRM_CONFIG } from "@/lib/crm/config";

function money(value: number | string | null | undefined) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(Number(value || 0));
}

export default function XeroInvoicePage({ reference }: { reference: string }) {
  const [jobData, setJobData] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [crmConfig,setCrmConfig]=useState(DEFAULT_CRM_CONFIG);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const [jobRes, xeroRes] = await Promise.all([
      fetch(`/api/admin/jobs/${encodeURIComponent(reference)}`, { cache: "no-store" }),
      fetch(`/api/admin/jobs/${encodeURIComponent(reference)}/xero`, { cache: "no-store" }),
    ]);
    if (jobRes.status === 401 || xeroRes.status === 401) { window.location.href = "/admin/login"; return; }
    const jobBody = await jobRes.json().catch(() => ({}));
    const xeroBody = await xeroRes.json().catch(() => ({}));
    if (!jobRes.ok) setError(jobBody.error || "Could not load job");
    else if (!xeroRes.ok) setError(xeroBody.error || "Could not load Xero invoices");
    else { setJobData(jobBody); setInvoices(xeroBody.invoices || []); }
    setLoading(false);
  }, [reference]);

  useEffect(() => { void load(); fetch("/api/admin/settings",{cache:"no-store"}).then(async r=>{if(r.ok){const b=await r.json();if(b.settings)setCrmConfig(b.settings);}}).catch(()=>{}); }, [load]);

  async function action(actionName: "create" | "sync") {
    setBusy(true); setError(""); setMessage(actionName === "create" ? "Creating Xero draft..." : "Syncing from Xero...");
    const res = await fetch(`/api/admin/jobs/${encodeURIComponent(reference)}/xero`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: actionName }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) { setError(body.error || "Xero action failed"); setMessage(""); setBusy(false); return; }
    setMessage(actionName === "create" ? "Draft invoice created in Xero" : "Xero status updated");
    
    await load(); setBusy(false);
  }

  if (loading && !jobData) return <main className="min-h-screen bg-[#f5f5f2] p-10 text-center">Loading Xero...</main>;
  const job = jobData?.job || {};
  const customer = jobData?.customer || {};
  const amount = Number(job.quoted_amount ?? 0);
  const latestQuote=[...(jobData?.quotes||[])].sort((a:any,b:any)=>Number(b.version||0)-Number(a.version||0))[0];
  const invoiceDescription=latestQuote?.scope_text||job.customer_requirements||job.job_type||"Works as agreed";
  const name = [customer.first_name, customer.last_name].filter(Boolean).join(" ") || "Customer";
  const invoiceTemplate=crmConfig.invoiceTemplate==="mj-signature"&&crmConfig.tenantKey!=="mj-metal"?"clean":crmConfig.invoiceTemplate;
  const invoiceClass=invoiceTemplate==="classic"?"font-serif":"";
  const invoiceAccent=invoiceTemplate==="classic"?"#141414":invoiceTemplate==="mj-signature"?crmConfig.accentColour:"#141414";

  return <main className={`min-h-screen bg-[#f5f5f2] px-5 py-8 text-[#141414] ${invoiceClass}`} style={{"--invoice-accent":invoiceAccent} as React.CSSProperties}>
    <style>{`@media print{@page{size:A4;margin:0}body{background:white}.invoice-controls{display:none!important}.invoice-sheet{display:flex!important;width:210mm;min-height:297mm;margin:0!important;box-shadow:none!important;border:0!important}}`}</style><div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><div className="mb-3 flex items-center gap-4"><img src={crmConfig.logoUrl} alt={crmConfig.businessName} className="h-10 max-w-32 object-contain"/><p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--invoice-accent)]">{invoiceTemplate==="mj-signature"?"Invoice":"Xero invoice"}</p></div><h1 className="mt-1 text-3xl font-black">{reference} invoice</h1><p className="mt-2 text-sm text-black/55">{name} · {job.job_type || "Job"}</p></div>
        <div className="invoice-controls flex gap-2">{invoices.length>0&&<button type="button" onClick={()=>window.print()} className="rounded-xl bg-[var(--invoice-accent)] px-4 py-2.5 text-sm font-black text-white">Print / Save invoice PDF</button>}<Link href={`/admin/jobs/${reference}`} className="rounded-xl border border-black/15 bg-white px-4 py-2.5 text-sm font-bold">Back to job</Link></div>
      </div>

      {error && <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
      {message && <p className="mt-5 rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">{message}</p>}

      <section className="invoice-controls mt-6 rounded-2xl border border-black/10 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        <div className="grid gap-4 sm:grid-cols-3"><div><p className="text-xs font-bold uppercase text-black/45">Customer</p><p className="mt-1 font-black">{name}</p></div><div><p className="text-xs font-bold uppercase text-black/45">Final quote</p><p className="mt-1 text-xl font-black">{money(amount)}</p><p className="mt-1 text-xs text-black/45">{crmConfig.businessDetails.vatRegistered?"VAT charged according to business settings":"VAT not charged"}</p></div><div><p className="text-xs font-bold uppercase text-black/45">CRM reference</p><p className="mt-1 font-black text-[var(--invoice-accent)]">{reference}</p></div></div>
        <div className="mt-6 flex flex-wrap gap-3">
          {invoices.length === 0 ? <button disabled={busy || amount <= 0} onClick={() => void action("create")} className="rounded-xl bg-[var(--invoice-accent)] px-5 py-3 text-sm font-black text-white disabled:opacity-50">Create Xero invoice draft</button> : <button disabled={busy} onClick={() => void action("sync")} className="rounded-xl bg-[var(--invoice-accent)] px-5 py-3 text-sm font-black text-white disabled:opacity-50">Sync status from Xero</button>}
        </div>
        {invoices.length === 0 && <p className="mt-4 text-sm leading-6 text-black/55">{amount<=0?"Add a final quote amount before creating the invoice.":"This creates a draft sales invoice in Xero using the final quote amount and your business VAT settings. Review and approve it in Xero before sending or posting it to the accounts."}</p>}
      </section>


      {invoices[0]&&<article className="invoice-sheet mt-5 hidden min-h-[1120px] flex-col bg-white p-14 text-[#171717] shadow-xl print:flex"><header className="flex items-start justify-between border-b-4 border-[var(--invoice-accent)] pb-6"><img src={crmConfig.logoUrl} alt={crmConfig.businessName} className="h-20 max-w-56 object-contain"/><div className="text-right"><h2 className="text-3xl font-black uppercase">Invoice</h2><p className="mt-1 font-black text-[var(--invoice-accent)]">{invoices[0].invoice_number||reference}</p><p className="mt-1 text-xs text-black/50">CRM reference {reference}</p>{invoices[0].date&&<p className="mt-1 text-xs text-black/50">Invoice date {new Date(`${invoices[0].date}T12:00:00`).toLocaleDateString("en-GB")}</p>}{invoices[0].due_date&&<p className="text-xs text-black/50">Due {new Date(`${invoices[0].due_date}T12:00:00`).toLocaleDateString("en-GB")}</p>}</div></header><section className="mt-8 grid grid-cols-2 gap-10"><div><p className="text-[10px] font-black uppercase tracking-wider text-[var(--invoice-accent)]">Bill to</p><p className="mt-2 text-lg font-black">{name}</p>{customer.email&&<p className="mt-1 text-sm text-black/60">{customer.email}</p>}{customer.phone&&<p className="text-sm text-black/60">{customer.phone}</p>}</div><div className="text-right"><p className="text-[10px] font-black uppercase tracking-wider text-black/40">Invoice total</p><p className="mt-2 text-3xl font-black">{money(invoices[0].total??amount)}</p><p className="mt-1 text-xs text-black/50">{crmConfig.businessDetails.vatRegistered?"VAT included where applicable":"VAT not charged"}</p></div></section><section className="mt-10 border-y border-black/10 py-6"><p className="text-xs font-black uppercase tracking-wider text-black/40">Description</p><p className="mt-2 text-sm leading-6">{invoiceDescription}</p></section><section className="mt-8 grid grid-cols-2 gap-8 text-sm"><div><p className="font-black">Payment details</p>{crmConfig.businessDetails.bankName&&<p className="mt-2">{crmConfig.businessDetails.bankName}</p>}{crmConfig.businessDetails.sortCode&&<p>Sort code: {crmConfig.businessDetails.sortCode}</p>}{crmConfig.businessDetails.accountNumber&&<p>Account: {crmConfig.businessDetails.accountNumber}</p>}</div><div className="text-right"><p><b>Paid:</b> {money(invoices[0].amount_paid)}</p><p><b>Amount due:</b> {money(invoices[0].amount_due)}</p></div></section><footer className="mt-auto border-t border-black/10 pt-5 text-[10px] leading-5 text-black/50"><p className="font-black text-black/70">{crmConfig.businessName}</p><p>{crmConfig.businessDetails.officeAddress}</p><p>{[crmConfig.businessDetails.phone,crmConfig.businessDetails.email,crmConfig.businessDetails.website,crmConfig.businessDetails.companyNumber?`Company No. ${crmConfig.businessDetails.companyNumber}`:"",crmConfig.businessDetails.vatRegistered&&crmConfig.businessDetails.vatNumber?`VAT ${crmConfig.businessDetails.vatNumber}`:""].filter(Boolean).join(" · ")}</p></footer></article>}
      <section className="invoice-controls mt-5 rounded-2xl border border-black/10 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        <h2 className="text-lg font-black">Xero invoice status</h2>
        {invoices.length === 0 ? <p className="mt-4 text-sm text-black/50">No Xero invoice has been created for this job yet.</p> : <div className="mt-4 space-y-3">{invoices.map((invoice) => <div key={invoice.id} className="rounded-xl border border-black/10 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-black">{invoice.invoice_number || "Xero draft"}</p><p className="mt-1 text-xs text-black/45">Status: {invoice.status} · Last synced {new Date(invoice.synced_at).toLocaleString("en-GB")}</p></div><div className="text-right"><p className="font-black">{money(invoice.total)}</p><p className="text-xs text-black/45">Paid {money(invoice.amount_paid)} · Due {money(invoice.amount_due)}</p></div></div></div>)}</div>}
      </section>
    </div>
  </main>;
}
