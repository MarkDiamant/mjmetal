"use client";

import { useEffect, useState } from "react";

export default function IntegrationsPage() {
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [tenantName, setTenantName] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const response = await fetch("/api/integrations/xero/status", { cache: "no-store" });
    if (response.status === 401) { window.location.href = "/admin/login"; return; }
    const body = await response.json().catch(() => ({}));
    if (!response.ok) setError(body.error || "Unable to check Xero");
    else { setConnected(Boolean(body.connected)); setTenantName(body.tenantName || null); setError(""); }
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function disconnect() {
    if (!window.confirm("Disconnect Xero from M&J CRM?")) return;
    const response = await fetch("/api/integrations/xero/status", { method: "DELETE" });
    if (!response.ok) { setError("Unable to disconnect Xero"); return; }
    await load();
  }

  return (
    <main className="min-h-screen bg-[#f5f5f2] px-5 py-8 text-[#141414]">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#e66a24]">Connections</p><h1 className="mt-1 text-3xl font-black">Integrations</h1><p className="mt-2 text-sm text-black/55">Connect the services your business uses. Connections are authorised by the provider and can be disconnected here.</p></div>
          <a href="/admin" className="rounded-xl border border-black/15 bg-white px-4 py-2.5 text-sm font-bold">Back</a>
        </div>

        <section className="mt-6 rounded-2xl border border-black/10 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div><h2 className="text-xl font-black">Xero</h2><p className="mt-1 text-sm text-black/55">Create and track M&J customer invoices from jobs.</p></div>
            {loading ? <span className="text-sm font-bold text-black/45">Checking...</span> : connected ? <span className="rounded-full bg-green-50 px-3 py-1.5 text-sm font-black text-green-700">Connected</span> : <span className="rounded-full bg-orange-50 px-3 py-1.5 text-sm font-black text-orange-700">Not connected</span>}
          </div>

          {connected && <div className="mt-5 rounded-xl bg-[#f5f5f2] p-4"><p className="text-xs font-bold uppercase tracking-[0.08em] text-black/45">Xero organisation</p><p className="mt-1 font-black">{tenantName || "Connected organisation"}</p></div>}
          {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}

          <div className="mt-5 flex gap-3">
            {!connected ? <a href="/api/integrations/xero/connect" className="rounded-xl bg-[#e66a24] px-5 py-3 text-sm font-black text-white">Connect Xero</a> : <button onClick={() => void disconnect()} className="rounded-xl border border-black/15 px-5 py-3 text-sm font-black">Disconnect Xero</button>}
          </div>
        </section>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {[
            ["Google / Gmail","Send quotes, invoices and CRM emails from your business Gmail account.","Email"],
            ["Microsoft 365 / Outlook","Send CRM emails from your Microsoft business mailbox.","Email"],
            ["Google Calendar","Sync site visits, appointments and scheduled work with your calendar.","Calendar"],
            ["Microsoft Outlook Calendar","Sync CRM appointments and scheduled work with Outlook.","Calendar"],
            ["Stripe","Take and reconcile customer payments from CRM jobs and invoices.","Payments"],
            ["QuickBooks","Accounting and invoice integration for businesses that use QuickBooks.","Accounting"],
            ["Google Drive","Link job documents and business files where useful.","Files"],
            ["Microsoft OneDrive","Link job documents and business files where useful.","Files"],
          ].map(([name,description,category])=><section key={name} className="rounded-2xl border border-black/10 bg-white p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.12em] text-black/35">{category}</p><h2 className="mt-1 text-lg font-black">{name}</h2></div><span className="rounded-full bg-black/5 px-2.5 py-1 text-xs font-bold text-black/45">Planned</span></div><p className="mt-2 text-sm leading-6 text-black/55">{description}</p></section>)}
        </div>
        <section className="mt-5 rounded-2xl border border-black/10 bg-white p-6">
          <h2 className="text-lg font-black">Email connections</h2><p className="mt-2 text-sm leading-6 text-black/55">Email connections will start with sending only, so quotes, invoices and CRM messages can come from the business&apos;s own mailbox. Inbox access can remain a separate optional permission if job-linked email threads are added later.</p>
        </section>
      </div>
    </main>
  );
}
