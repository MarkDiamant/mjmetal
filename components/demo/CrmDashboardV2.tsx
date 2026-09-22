"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ALL_STATUSES, JOB_TYPES, STATUS_META } from "@/lib/crm/constants";
import type { JobStatus, Manager } from "@/lib/crm/types";

function money(value?: number | string) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(Number(value || 0));
}
function when(value?: string) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}
function localInput(value?: string) {
  if (!value) return "";
  const d = new Date(value);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
function iso(value?: string) { return value ? new Date(value).toISOString() : null; }
function statusLabel(value: unknown) { return STATUS_META[value as JobStatus]?.label ?? String(value || ""); }
function closed(value: string) { return ["completed", "declined", "cancelled"].includes(value); }

const input = "h-10 w-full rounded-xl border border-black/15 bg-white px-3 text-sm outline-none transition focus:border-[#e66a24] focus:ring-2 focus:ring-[#e66a24]/10";
const selectClass = `${input} pr-12`;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="min-w-0"><span className="mb-1.5 block text-[11px] font-black uppercase tracking-[0.08em] text-black/45">{label}</span>{children}</label>;
}
function MoneyInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <div className="relative"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-bold text-black/45">£</span><input type="number" min="0" step="0.01" value={value} onChange={(e) => onChange(e.target.value)} className={`${input} pl-7`} /></div>;
}

type QuickDraft = {
  firstName: string; lastName: string; phone: string; email: string;
  siteAddressLine1: string; siteAddressLine2: string; siteCity: string; sitePostcode: string;
  jobTypes: string[]; status: string; manager: string; agreedAmount: string;
  nextAction: string; nextActionAt: string; nextActionAssignee: string;
};

export default function CrmDashboardV2() {
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [people, setPeople] = useState<any[]>([]);
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
    const [jr, dr] = await Promise.all([fetch("/api/demo/jobs", { cache: "no-store" }), fetch("/api/demo/dashboard", { cache: "no-store" })]);
    if (jr.status === 401 || dr.status === 401) { router.replace("/demo/login"); return; }
    const jb = await jr.json().catch(() => ({}));
    const db = await dr.json().catch(() => ({}));
    if (!jr.ok) { setError(jb.error || "Unable to load CRM"); setLoading(false); return; }
    setJobs(jb.jobs || []); setPeople(jb.people || []); setActivities(db.activities || []); setAdmin(jb.admin || db.admin || null); setLoading(false);
  }, [router]);

  useEffect(() => { void load(); }, [load]);

  const realJobs = useMemo(() => jobs.filter((j) => !j.isPlaceholder), [jobs]);
  const counts = useMemo(() => {
    const pendingStatuses = new Set(["new_enquiry","awaiting_information","site_visit_required","site_visit_booked","estimate_preparing","estimate_sent","quote_preparing","quote_sent","awaiting_customer","interested_not_ready","customer_unsure"]);
    const activeStatuses = new Set(["confirmed","deposit_requested","deposit_paid","materials_ordered","fabrication","installation_scheduled","in_progress","awaiting_final_payment"]);
    return {
      total: realJobs.length,
      pending: realJobs.filter((j) => pendingStatuses.has(j.status)).length,
      active: realJobs.filter((j) => activeStatuses.has(j.status)).length,
      completed: realJobs.filter((j) => j.status === "completed").length,
      lost: realJobs.filter((j) => ["declined","cancelled"].includes(j.status)).length,
    };
  }, [realJobs]);

  const filtered = useMemo(() => jobs
    .filter((j) => status === "all" || j.status === status)
    .filter((j) => manager === "all" || (!j.isPlaceholder && j.manager === manager))
    .filter((j) => type === "all" || (j.jobTypes || [j.jobType]).includes(type))
    .filter((j) => `${j.reference} ${j.customerName} ${j.address} ${j.postcode || ""} ${j.phone || ""} ${j.email || ""}`.toLowerCase().includes(query.toLowerCase().trim()))
    .sort((a, b) => a.sequenceNumber - b.sequenceNumber), [jobs, status, manager, type, query]);

  function openQuick(j: any) {
    if (editingRef === j.reference) { setEditingRef(null); setDraft(null); return; }
    setEditingRef(j.reference);
    setDraft({
      firstName: j.isPlaceholder ? "" : (j.firstName || ""), lastName: j.isPlaceholder ? "" : (j.lastName || ""), phone: j.phone || "", email: j.email || "",
      siteAddressLine1: j.siteAddressLine1 || "", siteAddressLine2: j.siteAddressLine2 || "", siteCity: j.siteCity || "", sitePostcode: j.sitePostcode || "",
      jobTypes: j.isPlaceholder ? [] : (j.jobTypes || [j.jobType].filter(Boolean)), status: j.isPlaceholder ? "awaiting_information" : j.status,
      manager: j.isPlaceholder ? "" : (j.manager || ""), agreedAmount: String(j.agreedAmount ?? j.quotedAmount ?? ""),
      nextAction: closed(j.status) ? "" : (j.nextAction || ""), nextActionAt: closed(j.status) ? "" : localInput(j.nextActionAt), nextActionAssignee: closed(j.status) ? "" : (j.nextActionAssignee || ""),
    });
  }
  function setDraftValue<K extends keyof QuickDraft>(key: K, value: QuickDraft[K]) { setDraft((d) => d ? { ...d, [key]: value } : d); }
  function toggleJobType(value: string) { setDraft((d) => d ? { ...d, jobTypes: d.jobTypes.includes(value) ? d.jobTypes.filter((x) => x !== value) : [...d.jobTypes, value] } : d); }

  async function saveQuick(j: any, overrides: Record<string, unknown> = {}) {
    if (!draft && Object.keys(overrides).length === 0) return;
    setSavingRef(j.reference); setFlash("");
    const customer: Record<string, unknown> = {};
    const job: Record<string, unknown> = { ...overrides };
    if (draft) {
      customer.first_name = draft.firstName || (j.isPlaceholder ? "Details TBC" : null); customer.last_name = draft.lastName || null; customer.phone = draft.phone || null; customer.email = draft.email || null;
      job.site_address_line_1 = draft.siteAddressLine1 || null; job.site_address_line_2 = draft.siteAddressLine2 || null; job.site_city = draft.siteCity || null; job.site_postcode = draft.sitePostcode || null;
      if (draft.jobTypes.length) { job.job_types = draft.jobTypes; job.job_type = draft.jobTypes[0]; }
      job.status = draft.status; if (draft.manager) job.manager = draft.manager; job.agreed_amount = draft.agreedAmount === "" ? null : Number(draft.agreedAmount);
      if (closed(draft.status)) { job.next_action = null; job.next_action_at = null; job.next_action_assignee = null; }
      else { job.next_action = draft.nextAction || null; job.next_action_at = iso(draft.nextActionAt); job.next_action_assignee = draft.nextActionAssignee || null; }
      if (j.isPlaceholder && (draft.firstName || draft.lastName || draft.siteAddressLine1 || draft.jobTypes.length || draft.agreedAmount)) job.internal_notes = null;
    }
    const response = await fetch(`/api/demo/jobs/${encodeURIComponent(j.reference)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customer, job }) });
    const body = await response.json().catch(() => ({})); setSavingRef(null);
    if (!response.ok) { setFlash(body.error || `Could not save ${j.reference}`); return; }
    setFlash(`${j.reference} saved`); await load(); setTimeout(() => setFlash(""), 1800);
  }

  async function postAction(reference: string, payload: Record<string, unknown>) {
    setSavingRef(reference); setFlash("");
    const response = await fetch(`/api/demo/jobs/${encodeURIComponent(reference)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const body = await response.json().catch(() => ({})); setSavingRef(null);
    if (!response.ok) { setFlash(body.error || "Could not save"); return false; }
    await load(); setFlash(`${reference} updated`); setTimeout(() => setFlash(""), 1800); return true;
  }

  async function recordSubPayment(reference: string, assignmentId: string, e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const fd = new FormData(e.currentTarget); const amount = Number(fd.get("amount") || 0); if (!amount) return;
    setSavingRef(reference);
    const res = await fetch(`/api/demo/jobs/${encodeURIComponent(reference)}/subcontractors/${encodeURIComponent(assignmentId)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ add_payment: amount, paid_at: fd.get("paid_at") ? new Date(String(fd.get("paid_at"))).toISOString() : new Date().toISOString() }) });
    setSavingRef(null); if (!res.ok) { setFlash("Could not record subcontractor payment"); return; } await load(); e.currentTarget.reset();
  }

  async function archiveJob(j: any) {
    if (!confirm(`Archive ${j.reference}?`)) return;
    await fetch(`/api/demo/jobs/${encodeURIComponent(j.reference)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ job: { archived_at: new Date().toISOString() } }) });
    setEditingRef(null); setDraft(null); await load();
  }
  async function logout() { await fetch("/api/demo/auth/logout", { method: "POST" }); router.replace("/demo/login"); router.refresh(); }

  const cards = [
    ["Total enquiries", counts.total, "All real enquiries"], ["Still pending", counts.pending, "Not decided yet"], ["Active jobs", counts.active, "Won / in progress"], ["Completed", counts.completed, "Finished"], ["Didn't go ahead", counts.lost, "Declined / cancelled"],
  ] as const;

  return <main className="min-h-screen overflow-x-hidden bg-[#f4f4f1] text-[#141414]">
    <header className="sticky top-0 z-20 border-b border-black/8 bg-white/95 backdrop-blur"><div className="mx-auto flex max-w-[1780px] items-center justify-between gap-4 px-4 py-3.5 lg:px-7"><div className="flex min-w-0 items-center gap-3"><img src="/images/logo.png" alt="Demo Metal" className="h-11 w-auto shrink-0 object-contain"/><div className="min-w-0"><h1 className="truncate text-xl font-black tracking-tight sm:text-2xl">CRM & Job Management</h1><p className="text-xs text-black/45">Click any row to quick edit</p></div></div><div className="flex shrink-0 items-center gap-2">{flash&&<span className="hidden rounded-full bg-green-50 px-3 py-2 text-xs font-bold text-green-700 lg:inline">{flash}</span>}<a href="/demo/archive" className="hidden rounded-xl border border-black/12 px-3 py-2 text-sm font-bold md:block">Archive</a><a href="/demo/integrations" className="hidden rounded-xl border border-black/12 px-3 py-2 text-sm font-bold md:block">Integrations</a><button onClick={()=>void logout()} className="hidden rounded-xl border border-black/12 px-3 py-2 text-sm font-bold md:block">Logout</button><a href="/demo/jobs/new" className="rounded-xl bg-[#e66a24] px-4 py-2.5 text-sm font-black text-white">+ New job</a></div></div></header>

    <div className="mx-auto max-w-[1780px] px-3 py-5 sm:px-4 lg:px-7">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{cards.map(([label,value,note])=><div key={label} className="rounded-2xl border border-black/8 bg-white p-4 shadow-[0_6px_24px_rgba(0,0,0,0.035)]"><p className="text-[11px] font-black uppercase tracking-[0.08em] text-black/40">{label}</p><p className="mt-1.5 text-3xl font-black">{value}</p><p className="mt-1 text-xs text-black/40">{note}</p></div>)}</section>

      <div className="mt-5 grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_290px]">
        <section className="min-w-0">
          <div className="rounded-2xl border border-black/8 bg-white p-3.5"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_210px_170px_210px]"><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search ref, customer, address, postcode, phone..." className="h-11 min-w-0 rounded-xl border border-black/12 bg-[#fafafa] px-3 text-sm outline-none"/><select value={status} onChange={(e)=>setStatus(e.target.value as JobStatus|"all")} className={selectClass}><option value="all">All statuses</option>{ALL_STATUSES.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select><select value={manager} onChange={(e)=>setManager(e.target.value as Manager|"all")} className={selectClass}><option value="all">All managers</option><option value="MD">Alex</option><option value="JB">Sam</option></select><select value={type} onChange={(e)=>setType(e.target.value)} className={selectClass}><option value="all">All job types</option>{JOB_TYPES.map(t=><option key={t}>{t}</option>)}</select></div></div>
          {error&&<p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}

          <div className="mt-4 space-y-2">
            {filtered.map((j)=> <div key={j.id} className={`overflow-hidden rounded-2xl border bg-white shadow-[0_5px_20px_rgba(0,0,0,0.025)] ${editingRef===j.reference?"border-[#e66a24]/35":"border-black/8"}`}>
              <button type="button" onClick={()=>openQuick(j)} className="grid w-full min-w-0 gap-3 px-4 py-4 text-left hover:bg-[#fffaf6] md:grid-cols-[72px_minmax(140px,1.3fr)_minmax(130px,1fr)_160px_90px_120px_minmax(150px,1fr)] md:items-center">
                <b className="text-[#e66a24]">{j.reference}</b>
                <div className="min-w-0"><b className="block truncate">{j.isPlaceholder?"Details TBC":j.customerName}</b><span className="block truncate text-xs text-black/45">{j.address||j.postcode||"Address TBC"}</span></div>
                <div className="min-w-0"><b className="block truncate">{j.isPlaceholder?"Job TBC":(j.jobTypes||[j.jobType]).join(" + ")}</b><span className="text-xs text-black/45">{j.isPlaceholder?"":"Click to edit"}</span></div>
                <span className="whitespace-nowrap rounded-full bg-[#f1f1ed] px-3 py-1.5 text-center text-xs font-bold">{j.isPlaceholder?"Details TBC":statusLabel(j.status)}</span>
                <b className="text-sm">{j.isPlaceholder?"TBC":j.manager==="MD"?"Alex":"Sam"}</b>
                <div><b>{j.isPlaceholder?"TBC":money(j.agreedAmount??j.quotedAmount)}</b>{!j.isPlaceholder&&<span className="block text-xs text-[#e66a24]">Bal {money(j.balanceOutstanding)}</span>}</div>
                <div className="min-w-0"><b className="block truncate">{j.isPlaceholder?"Fill historical record":closed(j.status)?"No further action":j.nextAction||"No next action"}</b>{!closed(j.status)&&j.nextActionAt&&<span className="text-xs text-black/45">{when(j.nextActionAt)}</span>}</div>
              </button>

              {editingRef===j.reference&&draft&&<div className="border-t border-[#e66a24]/20 bg-[#fffaf6] p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.12em] text-[#e66a24]">Quick edit</p><h2 className="text-xl font-black">{j.reference}</h2></div><div className="flex flex-wrap gap-2"><button onClick={()=>void saveQuick(j,{status:"completed",completed_at:new Date().toISOString()})} className="rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-sm font-black text-green-800">Alex complete</button><button onClick={()=>void archiveJob(j)} className="rounded-xl border border-black/15 bg-white px-4 py-2 text-sm font-bold">Archive</button><a href={`/demo/jobs/${j.reference}`} className="rounded-xl border border-black/15 bg-white px-4 py-2 text-sm font-bold">Open full job</a><button disabled={savingRef===j.reference} onClick={()=>void saveQuick(j)} className="rounded-xl bg-[#141414] px-5 py-2 text-sm font-black text-white disabled:opacity-50">{savingRef===j.reference?"Saving...":"Save changes"}</button></div></div>

                <div className="mt-4 grid min-w-0 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
                  <section className="min-w-0 rounded-2xl bg-white p-4"><h3 className="mb-3 font-black">Customer & site</h3><div className="grid gap-3 sm:grid-cols-2"><Field label="First name"><input value={draft.firstName} onChange={e=>setDraftValue("firstName",e.target.value)} className={input}/></Field><Field label="Surname / company"><input value={draft.lastName} onChange={e=>setDraftValue("lastName",e.target.value)} className={input}/></Field><Field label="Phone"><input value={draft.phone} onChange={e=>setDraftValue("phone",e.target.value)} className={input}/></Field><Field label="Email"><input value={draft.email} onChange={e=>setDraftValue("email",e.target.value)} className={input}/></Field><Field label="Site address"><input value={draft.siteAddressLine1} onChange={e=>setDraftValue("siteAddressLine1",e.target.value)} className={input}/></Field><Field label="Postcode"><input value={draft.sitePostcode} onChange={e=>setDraftValue("sitePostcode",e.target.value)} className={input}/></Field></div></section>

                  <section className="min-w-0 rounded-2xl bg-white p-4"><h3 className="mb-3 font-black">Job</h3><Field label="Work types, select all that apply"><div className="flex flex-wrap gap-2">{JOB_TYPES.map(t=><button type="button" key={t} onClick={()=>toggleJobType(t)} className={`rounded-full border px-3 py-1.5 text-xs font-bold ${draft.jobTypes.includes(t)?"border-[#e66a24] bg-[#fff0e5] text-[#b94f13]":"border-black/15 bg-white"}`}>{t}</button>)}</div></Field><div className="mt-3 grid gap-3 sm:grid-cols-2"><Field label="Status"><select value={draft.status} onChange={e=>{const v=e.target.value;setDraftValue("status",v);if(closed(v)){setDraftValue("nextAction","");setDraftValue("nextActionAt","");setDraftValue("nextActionAssignee","");}}} className={selectClass}>{ALL_STATUSES.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select></Field><Field label="Managed by"><select value={draft.manager} onChange={e=>setDraftValue("manager",e.target.value)} className={selectClass}><option value="">TBC</option><option value="MD">Alex</option><option value="JB">Sam</option></select></Field><Field label="Agreed value"><MoneyInput value={draft.agreedAmount} onChange={(v)=>setDraftValue("agreedAmount",v)}/></Field></div></section>

                  <section className="min-w-0 rounded-2xl bg-white p-4"><h3 className="mb-3 font-black">Next action</h3>{closed(draft.status)?<div className="rounded-xl bg-[#f1f1ed] p-4 text-sm font-bold text-black/45">No further action required for a {statusLabel(draft.status).toLowerCase()} job.</div>:<div className="grid gap-3"><Field label="Action"><input value={draft.nextAction} onChange={e=>setDraftValue("nextAction",e.target.value)} className={input}/></Field><div className="grid gap-3 sm:grid-cols-2"><Field label="Due"><input type="datetime-local" value={draft.nextActionAt} onChange={e=>setDraftValue("nextActionAt",e.target.value)} className={input}/></Field><Field label="Assigned to"><select value={draft.nextActionAssignee} onChange={e=>setDraftValue("nextActionAssignee",e.target.value)} className={selectClass}><option value="">Unassigned</option><option value="MD">Alex</option><option value="JB">Sam</option></select></Field></div></div>}</section>

                  <section className="min-w-0 rounded-2xl bg-white p-4"><h3 className="font-black">Customer payments</h3><div className="mt-2 grid grid-cols-3 gap-2 text-sm"><div><span className="block text-xs text-black/45">Value</span><b>{money(j.agreedAmount??j.quotedAmount)}</b></div><div><span className="block text-xs text-black/45">Received</span><b>{money(j.amountPaid)}</b></div><div><span className="block text-xs text-black/45">Outstanding</span><b className="text-[#e66a24]">{money(j.balanceOutstanding)}</b></div></div><form onSubmit={async(e)=>{e.preventDefault();const fd=new FormData(e.currentTarget);const ok=await postAction(j.reference,{type:"payment",direction:"customer_in",payment_type:String(fd.get("payment_type")||"Payment"),amount:Number(fd.get("amount")||0),paid_at:fd.get("paid_at")?new Date(String(fd.get("paid_at"))).toISOString():new Date().toISOString(),payment_method:"Bank transfer"});if(ok)e.currentTarget.reset();}} className="mt-4 grid gap-2 sm:grid-cols-2"><Field label="Payment type"><select name="payment_type" className={selectClass}><option>Deposit</option><option>Part payment</option><option>Final payment</option><option>Payment</option></select></Field><Field label="Amount"><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-black/45">£</span><input name="amount" type="number" min="0" step="0.01" required className={`${input} pl-7`}/></div></Field><Field label="Date received"><input name="paid_at" type="datetime-local" className={input}/></Field><div className="flex items-end"><button className="h-10 w-full rounded-xl bg-[#141414] px-3 text-sm font-black text-white">Record payment</button></div></form>{j.customerPayments?.length>0&&<div className="mt-3 space-y-1">{j.customerPayments.slice(0,4).map((p:any)=><div key={p.id} className="flex justify-between text-xs"><span>{p.payment_type} · {when(p.paid_at||p.created_at)}</span><b>{money(p.amount)}</b></div>)}</div>}</section>

                  <section className="min-w-0 rounded-2xl bg-white p-4"><h3 className="font-black">Fabricators / installers / subcontractors</h3>{j.workforceAssignments?.length>0?<div className="mt-3 space-y-3">{j.workforceAssignments.map((a:any)=><div key={a.id} className="rounded-xl border border-black/10 p-3"><div className="flex flex-wrap justify-between gap-2"><div><b>{a.personName}</b><span className="ml-2 rounded-full bg-[#f1f1ed] px-2 py-1 text-[10px] font-bold uppercase">{String(a.assignmentRole||"subcontractor").replaceAll("_"," ")}</span><p className="text-xs text-black/45">{a.relationshipType==="employee"?"Employee":"Subcontractor"}</p></div>{a.relationshipType!=="employee"&&<div className="text-right text-xs"><b>{money(a.agreedCost)}</b><p className="text-[#e66a24]">{money(a.outstanding)} due</p></div>}</div>{a.relationshipType!=="employee"&&a.outstanding>0&&<form onSubmit={(e)=>void recordSubPayment(j.reference,a.id,e)} className="mt-2 grid gap-2 sm:grid-cols-[1fr_1fr_auto]"><input name="amount" type="number" min="0" step="0.01" placeholder="£ payment" className={input}/><input name="paid_at" type="datetime-local" className={input}/><button className="rounded-xl border border-black/15 bg-white px-3 text-xs font-black">Record paid</button></form>}</div>)}</div>:<p className="mt-2 text-sm text-black/45">Nobody assigned yet.</p>}
                    <form onSubmit={async(e)=>{e.preventDefault();const fd=new FormData(e.currentTarget);const ok=await postAction(j.reference,{type:"subcontractor",subcontractor_id:String(fd.get("person_id")||"")||null,name:String(fd.get("new_name")||"")||null,relationship_type:String(fd.get("relationship_type")||"subcontractor"),assignment_role:String(fd.get("assignment_role")||"subcontractor"),agreed_cost:Number(fd.get("agreed_cost")||0)||null,scope:String(fd.get("scope")||"")||null});if(ok)e.currentTarget.reset();}} className="mt-4 grid gap-2 sm:grid-cols-2"><Field label="Existing person"><select name="person_id" className={selectClass}><option value="">Add new person</option>{people.map((p)=><option key={p.id} value={p.id}>{p.name}{p.company?` · ${p.company}`:""} · {p.relationship_type==="employee"?"Employee":"Subcontractor"}</option>)}</select></Field><Field label="New person name"><input name="new_name" className={input}/></Field><Field label="Relationship"><select name="relationship_type" className={selectClass}><option value="subcontractor">Subcontractor</option><option value="employee">Employee</option></select></Field><Field label="Role"><select name="assignment_role" className={selectClass}><option value="fabricator">Fabricator</option><option value="installer">Installer</option><option value="fabricator_installer">Fabricator + installer</option><option value="other">Other</option></select></Field><Field label="Agreed subcontract cost"><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-black/45">£</span><input name="agreed_cost" type="number" min="0" step="0.01" className={`${input} pl-7`}/></div></Field><Field label="Scope"><input name="scope" className={input}/></Field><div className="sm:col-span-2"><button className="h-10 rounded-xl bg-[#141414] px-4 text-sm font-black text-white">Assign person</button></div></form>
                  </section>

                  <section className="min-w-0 rounded-2xl bg-white p-4"><h3 className="font-black">Commission</h3><div className="mt-2 grid grid-cols-3 gap-2 text-sm"><div><span className="block text-xs text-black/45">Agreed</span><b>{money(j.commissionAgreed)}</b></div><div><span className="block text-xs text-black/45">Paid</span><b>{money(j.commissionPaid)}</b></div><div><span className="block text-xs text-black/45">Outstanding</span><b className="text-[#e66a24]">{money(j.commissionOutstanding)}</b></div></div><form onSubmit={async(e)=>{e.preventDefault();const fd=new FormData(e.currentTarget);const agreed=Number(fd.get("amount")||0);const paid=Number(fd.get("paid_amount")||0);const ok=await postAction(j.reference,{type:"cost",category:"Commission",supplier:String(fd.get("recipient")||""),actual_amount:agreed,paid_amount:paid,paid_at:paid&&fd.get("paid_at")?new Date(String(fd.get("paid_at"))).toISOString():paid?new Date().toISOString():null,due_at:fd.get("due_at")?new Date(String(fd.get("due_at"))).toISOString():null});if(ok)e.currentTarget.reset();}} className="mt-4 grid gap-2 sm:grid-cols-2"><Field label="Pay commission to"><input name="recipient" required className={input}/></Field><Field label="Commission amount"><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-black/45">£</span><input name="amount" type="number" min="0" step="0.01" required className={`${input} pl-7`}/></div></Field><Field label="Already paid"><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-black/45">£</span><input name="paid_amount" type="number" min="0" step="0.01" className={`${input} pl-7`}/></div></Field><Field label="Paid date"><input name="paid_at" type="datetime-local" className={input}/></Field><Field label="Due date"><input name="due_at" type="datetime-local" className={input}/></Field><div className="flex items-end"><button className="h-10 w-full rounded-xl bg-[#141414] px-3 text-sm font-black text-white">Add commission</button></div></form>{j.commissions?.length>0&&<div className="mt-3 space-y-1">{j.commissions.map((c:any)=><div key={c.id} className="flex justify-between text-xs"><span>{c.supplier||"Commission"}</span><b>{money(c.agreedAmount)} · {money(c.outstanding)} due</b></div>)}</div>}</section>
                </div>
              </div>}
            </div>)}
            {loading&&<p className="rounded-2xl bg-white p-8 text-center text-black/45">Loading jobs...</p>}{!loading&&filtered.length===0&&<p className="rounded-2xl bg-white p-8 text-center text-black/45">No jobs match these filters.</p>}
          </div>
        </section>

        <aside className="min-w-0 space-y-4"><section className="rounded-2xl border border-black/8 bg-white p-4"><h2 className="font-black">Recent activity</h2><div className="mt-3 space-y-3">{activities.slice(0,8).map((a:any)=><a key={a.id} href={a.mj_jobs?.reference?`/demo/jobs/${a.mj_jobs.reference}`:"/demo"} className="block border-b border-black/8 pb-3 last:border-0"><b className="block text-sm">{a.summary}</b><span className="text-xs text-black/45">{a.mj_jobs?.reference||"CRM"} · {when(a.occurred_at)}</span></a>)}{activities.length===0&&<p className="text-sm text-black/45">No activity yet.</p>}</div></section></aside>
      </div>
    </div>
  </main>;
}
