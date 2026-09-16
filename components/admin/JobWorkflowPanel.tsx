"use client";

import { useEffect, useState } from "react";

function localInput(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
function iso(value: string) { return value ? new Date(value).toISOString() : null; }

const input = "h-10 w-full rounded-xl border border-black/15 bg-white px-3 text-sm outline-none focus:border-[#e66a24]";

export default function JobWorkflowPanel({ reference }: { reference: string }) {
  const [data, setData] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    const response = await fetch(`/api/admin/jobs/${encodeURIComponent(reference)}`, { cache: "no-store" });
    if (response.status === 401) { window.location.href = "/admin/login"; return; }
    if (response.ok) setData(await response.json());
  }
  useEffect(() => { void load(); }, [reference]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setMessage("");
    const fd = new FormData(event.currentTarget);
    const visitStatus = String(fd.get("site_visit_status") || "not_required");
    const status = String(fd.get("status") || data.job.status);
    const patch: any = {
      status,
      site_visit_status: visitStatus,
      site_visit_required: visitStatus !== "not_required" && visitStatus !== "cancelled",
      site_visit_at: iso(String(fd.get("site_visit_at") || "")),
      site_visit_completed_at: iso(String(fd.get("site_visit_completed_at") || "")),
      site_visit_attendee: String(fd.get("site_visit_attendee") || "").trim() || null,
      site_visit_notes: String(fd.get("site_visit_notes") || "").trim() || null,
      site_visit_measurements: String(fd.get("site_visit_measurements") || "").trim() || null,
      lost_reason: status === "declined" ? String(fd.get("lost_reason") || "").trim() || null : null,
      cancellation_reason: status === "cancelled" ? String(fd.get("cancellation_reason") || "").trim() || null : null,
      cancelled_at: status === "cancelled" ? (data.job.cancelled_at || new Date().toISOString()) : null,
    };
    if (visitStatus === "completed" && !patch.site_visit_completed_at) patch.site_visit_completed_at = new Date().toISOString();

    const response = await fetch(`/api/admin/jobs/${encodeURIComponent(reference)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ job: patch }) });
    const body = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) { setMessage(body.error || "Could not save workflow"); return; }
    setMessage("Saved"); await load(); setTimeout(() => setMessage(""), 1800);
  }

  async function toggleArchive() {
    if (!data?.job) return;
    const archived = Boolean(data.job.archived_at);
    const prompt = archived ? "Restore this job to the active CRM?" : "Archive this job? It will leave the active dashboard but can be restored later.";
    if (!window.confirm(prompt)) return;
    setSaving(true);
    const response = await fetch(`/api/admin/jobs/${encodeURIComponent(reference)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ job: { archived_at: archived ? null : new Date().toISOString() } }) });
    setSaving(false);
    if (!response.ok) { setMessage("Could not update archive status"); return; }
    if (!archived) { window.location.href = "/admin"; return; }
    await load(); setMessage("Restored");
  }

  if (!data?.job) return null;
  const j = data.job;

  return <section className="border-b border-black/10 bg-[#fffaf6] print:hidden">
    <div className="mx-auto max-w-[1500px] px-5 py-3 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm"><span className="font-black">Workflow</span><span className="rounded-full bg-white px-3 py-1 font-bold text-black/60">Site visit: {String(j.site_visit_status || "not_required").replaceAll("_", " ")}</span>{j.archived_at && <span className="rounded-full bg-black px-3 py-1 font-bold text-white">Archived</span>}{message && <span className="font-bold text-[#e66a24]">{message}</span>}</div>
        <div className="flex gap-2"><button onClick={() => setOpen((v) => !v)} className="rounded-xl border border-black/15 bg-white px-4 py-2 text-sm font-black">{open ? "Close workflow" : "Workflow details"}</button><button onClick={() => void toggleArchive()} disabled={saving} className="rounded-xl border border-black/15 bg-white px-4 py-2 text-sm font-bold">{j.archived_at ? "Restore" : "Archive"}</button></div>
      </div>

      {open && <form onSubmit={(e) => void save(e)} className="mt-4 grid gap-4 rounded-2xl border border-black/10 bg-white p-4 md:grid-cols-2 xl:grid-cols-4">
        <label><span className="mb-1 block text-xs font-black uppercase text-black/45">Commercial status</span><select name="status" defaultValue={j.status} className={input}><option value="new_enquiry">New enquiry</option><option value="awaiting_information">Awaiting information</option><option value="site_visit_required">Site visit required</option><option value="site_visit_booked">Site visit booked</option><option value="estimate_preparing">Preparing estimate</option><option value="estimate_sent">Estimate sent</option><option value="quote_preparing">Preparing quote</option><option value="quote_sent">Quote sent</option><option value="awaiting_customer">Awaiting customer</option><option value="interested_not_ready">Interested, not ready</option><option value="customer_unsure">Customer unsure</option><option value="confirmed">Confirmed</option><option value="deposit_requested">Deposit requested</option><option value="deposit_paid">Deposit paid</option><option value="materials_ordered">Materials ordered</option><option value="fabrication">Fabrication</option><option value="installation_scheduled">Installation scheduled</option><option value="in_progress">In progress</option><option value="awaiting_final_payment">Awaiting final payment</option><option value="completed">Completed</option><option value="declined">Declined / lost</option><option value="cancelled">Cancelled</option></select></label>
        <label><span className="mb-1 block text-xs font-black uppercase text-black/45">Site visit stage</span><select name="site_visit_status" defaultValue={j.site_visit_status || (j.site_visit_required ? "required" : "not_required")} className={input}><option value="not_required">Not required</option><option value="required">Required</option><option value="proposed">Proposed</option><option value="booked">Booked</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></label>
        <label><span className="mb-1 block text-xs font-black uppercase text-black/45">Visit date / time</span><input name="site_visit_at" type="datetime-local" defaultValue={localInput(j.site_visit_at)} className={input} /></label>
        <label><span className="mb-1 block text-xs font-black uppercase text-black/45">Completed at</span><input name="site_visit_completed_at" type="datetime-local" defaultValue={localInput(j.site_visit_completed_at)} className={input} /></label>
        <label><span className="mb-1 block text-xs font-black uppercase text-black/45">Attendee</span><input name="site_visit_attendee" defaultValue={j.site_visit_attendee || ""} className={input} placeholder="Mark, Jonathan, fabricator..." /></label>
        <label className="md:col-span-2"><span className="mb-1 block text-xs font-black uppercase text-black/45">Measurements</span><textarea name="site_visit_measurements" defaultValue={j.site_visit_measurements || ""} className="min-h-20 w-full rounded-xl border border-black/15 p-3 text-sm" /></label>
        <label className="md:col-span-2"><span className="mb-1 block text-xs font-black uppercase text-black/45">Site visit notes</span><textarea name="site_visit_notes" defaultValue={j.site_visit_notes || ""} className="min-h-20 w-full rounded-xl border border-black/15 p-3 text-sm" /></label>
        <label className="md:col-span-2"><span className="mb-1 block text-xs font-black uppercase text-black/45">Lost / declined reason</span><input name="lost_reason" defaultValue={j.lost_reason || ""} className={input} placeholder="Price, timing, no response, chose competitor..." /></label>
        <label className="md:col-span-2"><span className="mb-1 block text-xs font-black uppercase text-black/45">Cancellation reason</span><input name="cancellation_reason" defaultValue={j.cancellation_reason || ""} className={input} placeholder="Only used when status is Cancelled" /></label>
        <div className="md:col-span-2 xl:col-span-4 flex justify-end"><button disabled={saving} className="rounded-xl bg-[#141414] px-5 py-2.5 text-sm font-black text-white disabled:opacity-50">{saving ? "Saving..." : "Save workflow"}</button></div>
      </form>}
    </div>
  </section>;
}
