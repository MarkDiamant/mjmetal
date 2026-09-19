"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

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

  useEffect(() => { void load(); }, [load]);

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
    if(actionName==="create") await fetch(`/api/admin/jobs/${encodeURIComponent(reference)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({job:{status:"awaiting_final_payment",next_action:"Collect outstanding balance"}})});
    await load(); setBusy(false);
  }

  if (loading && !jobData) return <main className="min-h-screen bg-[#f5f5f2] p-10 text-center">Loading Xero...</main>;
  const job = jobData?.job || {};
  const customer = jobData?.customer || {};
  const amount = Number(job.agreed_amount ?? job.quoted_amount ?? 0);
  const name = [customer.first_name, customer.last_name].filter(Boolean).join(" ") || "Customer";

  return <main className="min-h-screen bg-[#f5f5f2] px-5 py-8 text-[#141414]">
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#13b5ea]">Xero</p><h1 className="mt-1 text-3xl font-black">{reference} invoice</h1><p className="mt-2 text-sm text-black/55">{name} · {job.job_type || "Job"}</p></div>
        <Link href={`/admin/jobs/${reference}`} className="rounded-xl border border-black/15 bg-white px-4 py-2.5 text-sm font-bold">Back to job</Link>
      </div>

      {error && <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
      {message && <p className="mt-5 rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">{message}</p>}

      <section className="mt-6 rounded-2xl border border-black/10 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        <div className="grid gap-4 sm:grid-cols-3"><div><p className="text-xs font-bold uppercase text-black/45">Customer</p><p className="mt-1 font-black">{name}</p></div><div><p className="text-xs font-bold uppercase text-black/45">Job value</p><p className="mt-1 text-xl font-black">{money(amount)}</p></div><div><p className="text-xs font-bold uppercase text-black/45">CRM reference</p><p className="mt-1 font-black text-[#e66a24]">{reference}</p></div></div>
        <div className="mt-6 flex flex-wrap gap-3">
          {invoices.length === 0 ? <button disabled={busy || amount <= 0} onClick={() => void action("create")} className="rounded-xl bg-[#13b5ea] px-5 py-3 text-sm font-black text-white disabled:opacity-50">Create Xero invoice draft</button> : <button disabled={busy} onClick={() => void action("sync")} className="rounded-xl bg-[#13b5ea] px-5 py-3 text-sm font-black text-white disabled:opacity-50">Sync status from Xero</button>}
        </div>
        {invoices.length === 0 && <p className="mt-4 text-sm leading-6 text-black/55">This creates a <b>draft</b> sales invoice in Xero. Review and approve it in Xero before sending or posting it to the accounts.</p>}
      </section>

      <section className="mt-5 rounded-2xl border border-black/10 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        <h2 className="text-lg font-black">Xero invoice status</h2>
        {invoices.length === 0 ? <p className="mt-4 text-sm text-black/50">No Xero invoice has been created for this job yet.</p> : <div className="mt-4 space-y-3">{invoices.map((invoice) => <div key={invoice.id} className="rounded-xl border border-black/10 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-black">{invoice.invoice_number || "Xero draft"}</p><p className="mt-1 text-xs text-black/45">Status: {invoice.status} · Last synced {new Date(invoice.synced_at).toLocaleString("en-GB")}</p></div><div className="text-right"><p className="font-black">{money(invoice.total)}</p><p className="text-xs text-black/45">Paid {money(invoice.amount_paid)} · Due {money(invoice.amount_due)}</p></div></div></div>)}</div>}
      </section>
    </div>
  </main>;
}
