"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ALL_STATUSES, JOB_TYPES, STATUS_META } from "@/lib/crm/constants";
import type { JobStatus, Manager } from "@/lib/crm/types";

function money(value?: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(Number(value || 0));
}
function when(value?: string) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}
function localInput(value?: string) {
  if (!value) return "";
  const d = new Date(value);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
function iso(value?: string) { return value ? new Date(value).toISOString() : null; }
function statusOrder(value: unknown) { return STATUS_META[value as JobStatus]?.order ?? 0; }
function statusLabel(value: unknown) { return STATUS_META[value as JobStatus]?.label ?? String(value || ""); }

const input = "h-10 w-full rounded-xl border border-black/15 bg-white px-3 text-sm outline-none transition focus:border-[#e66a24] focus:ring-2 focus:ring-[#e66a24]/10";

type QuickDraft = {
  firstName: string; lastName: string; phone: string; email: string;
  siteAddressLine1: string; siteAddressLine2: string; siteCity: string; sitePostcode: string;
  jobType: string; status: string; manager: string; agreedAmount: string;
  nextAction: string; nextActionAt: string; nextActionAssignee: string;
};

export default function CrmDashboardV2() {
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [admin, setAdmin] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<JobStatus | "all">("all");
  const [manager, setManager] = useState<Manager | "all">("all");
  const [type, setType] = useState("all");
  const [editingRef, setEditingRef] = useState<string | null>(null);
  const [draft, setDraft] = useState<QuickDraft | null>(null);
  const [savingRef, setSavingRef] = useState<string | null>(null);
  const [flash, setFlash] = useState("");

  const load = useCallback(async () => {
    const [jr, dr] = await Promise.all([
      fetch("/api/admin/jobs", { cache: "no-store" }),
      fetch("/api/admin/dashboard", { cache: "no-store" }),
    ]);
    if (jr.status === 401 || dr.status === 401) { router.replace("/admin/login"); return; }
    const jb = await jr.json().catch(() => ({}));
    const db = await dr.json().catch(() => ({}));
    if (!jr.ok) { setError(jb.error || "Unable to load CRM"); setLoading(false); return; }
    setJobs(jb.jobs || []);
    setActivities(db.activities || []);
    setAdmin(jb.admin || db.admin || null);
    setLoading(false);
  }, [router]);

  useEffect(() => { void load(); }, [load]);

  const now = Date.now();
  const realJobs = useMemo(() => jobs.filter((j) => !j.isPlaceholder), [jobs]);
  const counts = useMemo(() => ({
    active: realJobs.filter((j) => !["completed", "declined", "cancelled"].includes(j.status)).length,
    newEnquiries: realJobs.filter((j) => j.status === "new_enquiry").length,
    siteVisits: realJobs.filter((j) => ["site_visit_required", "site_visit_booked"].includes(j.status)).length,
    quotes: realJobs.filter((j) => ["estimate_preparing", "estimate_sent", "quote_preparing", "quote_sent", "awaiting_customer", "interested_not_ready", "customer_unsure"].includes(j.status)).length,
    deposits: realJobs.filter((j) => j.status === "deposit_requested").length,
    production: realJobs.filter((j) => ["deposit_paid", "materials_ordered", "fabrication", "in_progress"].includes(j.status)).length,
    installs: realJobs.filter((j) => j.status === "installation_scheduled").length,
    awaitingPayment: realJobs.filter((j) => j.status === "awaiting_final_payment").length,
    completed: realJobs.filter((j) => j.status === "completed").length,
    backfill: jobs.filter((j) => j.isPlaceholder).length,
    due: realJobs.filter((j) => j.nextActionAt && new Date(j.nextActionAt).getTime() <= now).length,
    outstanding: realJobs.reduce((s, j) => s + Number(j.balanceOutstanding || 0), 0),
  }), [jobs, realJobs, now]);

  const myDue = useMemo(() => realJobs
    .filter((j) => j.nextActionAt && new Date(j.nextActionAt).getTime() <= now && (!j.nextActionAssignee || j.nextActionAssignee === admin?.initials))
    .sort((a, b) => new Date(a.nextActionAt).getTime() - new Date(b.nextActionAt).getTime()), [realJobs, admin, now]);

  const filtered = useMemo(() => jobs
    .filter((j) => status === "all" || j.status === status)
    .filter((j) => manager === "all" || (!j.isPlaceholder && j.manager === manager))
    .filter((j) => type === "all" || j.jobType === type)
    .filter((j) => `${j.reference} ${j.customerName} ${j.address} ${j.postcode || ""} ${j.phone || ""} ${j.email || ""}`.toLowerCase().includes(query.toLowerCase().trim()))
    .sort((a, b) => a.sequenceNumber - b.sequenceNumber), [jobs, status, manager, type, query]);

  function openQuick(j: any) {
    if (editingRef === j.reference) { setEditingRef(null); setDraft(null); return; }
    setEditingRef(j.reference);
    setDraft({
      firstName: j.isPlaceholder ? "" : (j.firstName || ""),
      lastName: j.isPlaceholder ? "" : (j.lastName || ""),
      phone: j.phone || "",
      email: j.email || "",
      siteAddressLine1: j.siteAddressLine1 || "",
      siteAddressLine2: j.siteAddressLine2 || "",
      siteCity: j.siteCity || "",
      sitePostcode: j.sitePostcode || "",
      jobType: j.isPlaceholder ? "" : (j.jobType || ""),
      status: j.isPlaceholder ? "awaiting_information" : j.status,
      manager: j.isPlaceholder ? "" : (j.manager || ""),
      agreedAmount: j.agreedAmount ?? j.quotedAmount ?? "",
      nextAction: j.nextAction || "",
      nextActionAt: localInput(j.nextActionAt),
      nextActionAssignee: j.nextActionAssignee || "",
    });
  }

  function set<K extends keyof QuickDraft>(key: K, value: QuickDraft[K]) {
    setDraft((d) => d ? { ...d, [key]: value } : d);
  }

  async function saveQuick(j: any, overrides: Record<string, unknown> = {}) {
    if (!draft && Object.keys(overrides).length === 0) return;
    setSavingRef(j.reference); setFlash("");
    const customer: Record<string, unknown> = {};
    const job: Record<string, unknown> = { ...overrides };
    if (draft) {
      customer.first_name = draft.firstName || (j.isPlaceholder ? "Details TBC" : null);
      customer.last_name = draft.lastName || null;
      customer.phone = draft.phone || null;
      customer.email = draft.email || null;
      job.site_address_line_1 = draft.siteAddressLine1 || null;
      job.site_address_line_2 = draft.siteAddressLine2 || null;
      job.site_city = draft.siteCity || null;
      job.site_postcode = draft.sitePostcode || null;
      if (draft.jobType) job.job_type = draft.jobType;
      job.status = draft.status;
      if (draft.manager) job.manager = draft.manager;
      job.agreed_amount = draft.agreedAmount === "" ? null : Number(draft.agreedAmount);
      job.next_action = draft.nextAction || null;
      job.next_action_at = iso(draft.nextActionAt);
      job.next_action_assignee = draft.nextActionAssignee || null;
      if (j.isPlaceholder && (draft.firstName || draft.lastName || draft.siteAddressLine1 || draft.jobType || draft.agreedAmount)) job.internal_notes = null;
    }
    const response = await fetch(`/api/admin/jobs/${encodeURIComponent(j.reference)}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customer, job }),
    });
    const body = await response.json().catch(() => ({}));
    setSavingRef(null);
    if (!response.ok) { setFlash(body.error || `Could not save ${j.reference}`); return; }
    setFlash(`${j.reference} saved`);
    await load();
    setTimeout(() => setFlash(""), 1800);
  }

  async function archiveJob(j: any) {
    if (!confirm(`Archive ${j.reference}?`)) return;
    setSavingRef(j.reference);
    const response = await fetch(`/api/admin/jobs/${encodeURIComponent(j.reference)}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ job: { archived_at: new Date().toISOString() } }),
    });
    setSavingRef(null);
    if (!response.ok) { setFlash(`Could not archive ${j.reference}`); return; }
    setEditingRef(null); setDraft(null); await load();
  }

  async function logout() { await fetch("/api/admin/auth/logout", { method: "POST" }); router.replace("/admin/login"); router.refresh(); }

  const cards = [
    ["Active jobs", counts.active, "Work currently open"],
    ["New enquiries", counts.newEnquiries, "Fresh leads"],
    ["Site visits", counts.siteVisits, "Required / booked"],
    ["Quotes in play", counts.quotes, "Estimate to decision"],
    ["Deposits due", counts.deposits, "Awaiting deposit"],
    ["Production", counts.production, "Materials / fabrication"],
    ["Installations", counts.installs, "Scheduled installs"],
    ["Awaiting payment", counts.awaitingPayment, money(counts.outstanding) + " outstanding"],
    ["Completed", counts.completed, "Finished jobs"],
    ["Backfill TBC", counts.backfill, "Historical records to fill"],
  ] as const;

  return <main className="min-h-screen bg-[#f4f4f1] text-[#141414]">
    <header className="sticky top-0 z-20 border-b border-black/8 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1780px] items-center justify-between gap-4 px-5 py-3.5 lg:px-7">
        <div className="flex items-center gap-4"><img src="/images/logo.png" alt="M&J Metal" className="h-12 w-auto object-contain"/><div><h1 className="text-xl font-black tracking-tight sm:text-2xl">CRM & Job Management</h1><p className="text-xs text-black/45 sm:text-sm">Click any job row to quick edit</p></div></div>
        <div className="flex items-center gap-2">{flash && <span className="hidden rounded-full bg-green-50 px-3 py-2 text-xs font-bold text-green-700 lg:inline">{flash}</span>}{admin?.display_name && <span className="hidden rounded-full bg-[#f3f3ef] px-3 py-2 text-sm font-semibold xl:inline">{admin.display_name}</span>}<a href="/admin/archive" className="hidden rounded-xl border border-black/12 px-3 py-2.5 text-sm font-bold md:block">Archive</a><a href="/admin/integrations" className="hidden rounded-xl border border-black/12 px-3 py-2.5 text-sm font-bold md:block">Integrations</a><button onClick={() => void logout()} className="hidden rounded-xl border border-black/12 px-3 py-2.5 text-sm font-bold md:block">Logout</button><a href="/admin/jobs/new" className="rounded-xl bg-[#e66a24] px-4 py-2.5 text-sm font-black text-white shadow-sm">+ New job</a></div>
      </div>
    </header>

    <div className="mx-auto max-w-[1780px] px-4 py-5 lg:px-7">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map(([label, value, note]) => <div key={label} className="rounded-2xl border border-black/8 bg-white p-4 shadow-[0_6px_24px_rgba(0,0,0,0.035)]"><p className="text-[11px] font-black uppercase tracking-[0.08em] text-black/40">{label}</p><p className="mt-1.5 text-3xl font-black tracking-tight">{value}</p><p className="mt-1 text-xs text-black/40">{note}</p></div>)}
      </section>

      <section className="mt-5 grid gap-5 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <div className="rounded-2xl border border-black/8 bg-white p-3.5 shadow-[0_6px_24px_rgba(0,0,0,0.03)]"><div className="grid gap-3 lg:grid-cols-[minmax(280px,1fr)_230px_180px_220px]"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search ref, customer, address, postcode, phone..." className="h-11 rounded-xl border border-black/12 bg-[#fafafa] px-3 text-sm outline-none focus:border-[#e66a24]"/><select value={status} onChange={(e) => setStatus(e.target.value as JobStatus | "all")} className="h-11 rounded-xl border border-black/12 bg-white px-3 text-sm"><option value="all">All statuses</option>{ALL_STATUSES.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}</select><select value={manager} onChange={(e) => setManager(e.target.value as Manager | "all")} className="h-11 rounded-xl border border-black/12 bg-white px-3 text-sm"><option value="all">All managers</option><option value="MD">Mark</option><option value="JB">Jonathan</option></select><select value={type} onChange={(e) => setType(e.target.value)} className="h-11 rounded-xl border border-black/12 bg-white px-3 text-sm"><option value="all">All job types</option>{JOB_TYPES.map((t) => <option key={t}>{t}</option>)}</select></div></div>

          {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
          <div className="mt-4 overflow-hidden rounded-2xl border border-black/8 bg-white shadow-[0_6px_24px_rgba(0,0,0,0.03)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1420px] table-fixed text-left">
                <colgroup><col className="w-[85px]"/><col className="w-[245px]"/><col className="w-[205px]"/><col className="w-[185px]"/><col className="w-[120px]"/><col className="w-[115px]"/><col className="w-[115px]"/><col className="w-[260px]"/><col className="w-[115px]"/></colgroup>
                <thead className="bg-[#efefeb] text-[11px] font-black uppercase tracking-[0.08em] text-black/45"><tr><th className="px-4 py-3">Ref</th><th className="px-4 py-3">Customer / site</th><th className="px-4 py-3">Job</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Manager</th><th className="px-4 py-3">Value</th><th className="px-4 py-3">Balance</th><th className="px-4 py-3">Next action</th><th className="px-4 py-3"></th></tr></thead>
                <tbody>{filtered.map((j) => <JobRows key={j.id} job={j} now={now} editing={editingRef === j.reference} draft={editingRef === j.reference ? draft : null} saving={savingRef === j.reference} onOpen={() => openQuick(j)} onSet={set} onSave={() => void saveQuick(j)} onComplete={() => void saveQuick(j, { status: "completed", completed_at: new Date().toISOString(), next_action: null, next_action_at: null })} onArchive={() => void archiveJob(j)} />)}</tbody>
              </table>
            </div>
            {loading && <p className="p-8 text-center text-black/45">Loading jobs...</p>}
            {!loading && filtered.length === 0 && <p className="p-8 text-center text-black/45">No jobs match these filters.</p>}
          </div>
        </div>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-black/8 bg-white p-5 shadow-[0_6px_24px_rgba(0,0,0,0.03)]"><div className="flex items-center justify-between"><div><h2 className="text-lg font-black">Actions due</h2><p className="text-xs text-black/40">For you</p></div><span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-black text-red-700">{myDue.length}</span></div><div className="mt-4 space-y-2">{myDue.slice(0, 8).map((j) => <button key={j.id} onClick={() => openQuick(j)} className="block w-full rounded-xl bg-[#f5f5f2] p-3 text-left transition hover:bg-[#fff3eb]"><div className="flex justify-between gap-3"><b>{j.reference}</b><span className="text-xs text-red-700">{when(j.nextActionAt)}</span></div><p className="mt-1 text-sm font-semibold">{j.nextAction}</p><p className="text-xs text-black/45">{j.customerName}</p></button>)}{myDue.length === 0 && <p className="text-sm text-black/45">Nothing overdue for you.</p>}</div></section>
          <section className="rounded-2xl border border-black/8 bg-white p-5 shadow-[0_6px_24px_rgba(0,0,0,0.03)]"><h2 className="text-lg font-black">Recent activity</h2><div className="mt-4 space-y-3">{activities.map((a: any) => <a key={a.id} href={a.mj_jobs?.reference ? `/admin/jobs/${a.mj_jobs.reference}` : "/admin"} className="block border-b border-black/8 pb-3 last:border-0"><div className="flex justify-between gap-3"><b className="text-sm">{a.summary}</b><span className="whitespace-nowrap text-xs text-black/40">{when(a.occurred_at)}</span></div><p className="mt-1 text-xs text-black/45">{a.mj_jobs?.reference || "CRM"}{a.actor ? ` • ${a.actor === "MD" ? "Mark" : "Jonathan"}` : ""}</p></a>)}{activities.length === 0 && <p className="text-sm text-black/45">No activity yet.</p>}</div></section>
        </aside>
      </section>
    </div>
  </main>;
}

function JobRows({ job: j, now, editing, draft, saving, onOpen, onSet, onSave, onComplete, onArchive }: any) {
  return <>
    <tr onClick={onOpen} className={`cursor-pointer border-t border-black/7 align-middle transition ${editing ? "bg-[#fff7f1]" : "hover:bg-[#fafaf7]"}`}>
      <td className="px-4 py-4 font-black text-[#e66a24]">{j.reference}</td>
      <td className="px-4 py-4"><b className="block truncate">{j.isPlaceholder ? "Details TBC" : j.customerName}</b><p className="mt-1 truncate text-xs text-black/45">{j.address || "Address TBC"}{j.postcode ? `, ${j.postcode}` : ""}</p></td>
      <td className="px-4 py-4"><b className="block truncate">{j.isPlaceholder ? "Job TBC" : j.jobType}</b><p className="mt-1 truncate text-xs text-black/40">{(j.finishes || []).join(" + ") || (j.isPlaceholder ? "Historical backfill" : "Finish TBC")}</p></td>
      <td className="px-4 py-4"><span className={`inline-flex max-w-full whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-black ${j.status === "completed" ? "bg-green-50 text-green-700" : j.status === "awaiting_final_payment" ? "bg-amber-50 text-amber-800" : j.isPlaceholder ? "bg-slate-100 text-slate-600" : "bg-[#f3f3ef]"}`}>{j.isPlaceholder ? "Details TBC" : statusLabel(j.status)}</span></td>
      <td className="px-4 py-4 font-bold">{j.isPlaceholder ? <span className="text-black/35">TBC</span> : j.manager === "MD" ? "Mark" : "Jonathan"}</td>
      <td className="px-4 py-4 font-bold">{j.isPlaceholder && !j.agreedAmount ? <span className="text-black/30">TBC</span> : money(j.agreedAmount ?? j.quotedAmount)}</td>
      <td className="px-4 py-4 font-bold">{j.balanceOutstanding > 0 ? <span className="text-amber-700">{money(j.balanceOutstanding)}</span> : j.isPlaceholder ? <span className="text-black/30">TBC</span> : money(0)}</td>
      <td className="px-4 py-4"><b className={`block truncate ${j.nextActionAt && new Date(j.nextActionAt).getTime() <= now ? "text-red-700" : ""}`}>{j.nextAction || (j.isPlaceholder ? "Fill historical record" : "No next action")}</b><p className="mt-1 truncate text-xs text-black/40">{j.nextActionAt ? when(j.nextActionAt) : ""}{j.nextActionAssignee ? ` • ${j.nextActionAssignee === "MD" ? "Mark" : "Jonathan"}` : ""}</p></td>
      <td className="px-4 py-4"><button onClick={(e) => { e.stopPropagation(); onOpen(); }} className="rounded-lg border border-black/12 bg-white px-3 py-2 text-sm font-bold">{editing ? "Close" : "Quick edit"}</button></td>
    </tr>
    {editing && draft && <tr className="border-t border-[#e66a24]/20 bg-[#fffaf6]"><td colSpan={9} className="p-4"><div onClick={(e) => e.stopPropagation()} className="rounded-2xl border border-[#e66a24]/20 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.1em] text-[#e66a24]">Quick edit</p><h3 className="text-lg font-black">{j.reference}</h3></div><div className="flex flex-wrap gap-2"><button type="button" onClick={onComplete} disabled={saving} className="rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-sm font-black text-green-800">Mark complete</button><button type="button" onClick={onArchive} disabled={saving} className="rounded-xl border border-black/12 px-4 py-2 text-sm font-bold">Archive</button><a href={`/admin/jobs/${j.reference}`} className="rounded-xl border border-black/12 px-4 py-2 text-sm font-bold">Open full job</a><button type="button" onClick={onSave} disabled={saving} className="rounded-xl bg-[#141414] px-5 py-2 text-sm font-black text-white disabled:opacity-50">{saving ? "Saving..." : "Save changes"}</button></div></div>
      <div className="mt-5 grid gap-5 xl:grid-cols-4">
        <QuickSection title="Customer"><Q label="First name"><input value={draft.firstName} onChange={(e) => onSet("firstName", e.target.value)} className={input}/></Q><Q label="Surname / company"><input value={draft.lastName} onChange={(e) => onSet("lastName", e.target.value)} className={input}/></Q><Q label="Phone"><input value={draft.phone} onChange={(e) => onSet("phone", e.target.value)} className={input}/></Q><Q label="Email"><input type="email" value={draft.email} onChange={(e) => onSet("email", e.target.value)} className={input}/></Q></QuickSection>
        <QuickSection title="Site"><Q label="Address"><input value={draft.siteAddressLine1} onChange={(e) => onSet("siteAddressLine1", e.target.value)} className={input}/></Q><Q label="Address line 2"><input value={draft.siteAddressLine2} onChange={(e) => onSet("siteAddressLine2", e.target.value)} className={input}/></Q><Q label="City"><input value={draft.siteCity} onChange={(e) => onSet("siteCity", e.target.value)} className={input}/></Q><Q label="Postcode"><input value={draft.sitePostcode} onChange={(e) => onSet("sitePostcode", e.target.value)} className={input}/></Q></QuickSection>
        <QuickSection title="Job"><Q label="Job type"><select value={draft.jobType} onChange={(e) => onSet("jobType", e.target.value)} className={input}><option value="">TBC</option>{JOB_TYPES.map((x) => <option key={x}>{x}</option>)}</select></Q><Q label="Status"><select value={draft.status} onChange={(e) => onSet("status", e.target.value)} className={input}>{ALL_STATUSES.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}</select></Q><Q label="Manager"><select value={draft.manager} onChange={(e) => onSet("manager", e.target.value)} className={input}><option value="">TBC</option><option value="MD">Mark</option><option value="JB">Jonathan</option></select></Q><Q label="Agreed value"><input type="number" min="0" step="0.01" value={draft.agreedAmount} onChange={(e) => onSet("agreedAmount", e.target.value)} className={input}/></Q></QuickSection>
        <QuickSection title="Next action"><Q label="Action"><input value={draft.nextAction} onChange={(e) => onSet("nextAction", e.target.value)} className={input}/></Q><Q label="Due"><input type="datetime-local" value={draft.nextActionAt} onChange={(e) => onSet("nextActionAt", e.target.value)} className={input}/></Q><Q label="Assigned to"><select value={draft.nextActionAssignee} onChange={(e) => onSet("nextActionAssignee", e.target.value)} className={input}><option value="">Unassigned</option><option value="MD">Mark</option><option value="JB">Jonathan</option></select></Q><div className="rounded-xl bg-[#f5f5f2] p-3 text-xs leading-5 text-black/55"><b className="text-black/75">Tip:</b> change the status here for normal workflow updates. Use Mark complete when the job is genuinely finished.</div></QuickSection>
      </div>
    </div></td></tr>}
  </>;
}

function QuickSection({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-xl bg-[#f7f7f4] p-4"><h4 className="mb-3 text-sm font-black">{title}</h4><div className="space-y-3">{children}</div></section>; }
function Q({ label, children }: { label: string; children: React.ReactNode }) { return <label><span className="mb-1 block text-[10px] font-black uppercase tracking-[0.07em] text-black/40">{label}</span>{children}</label>; }
