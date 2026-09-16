"use client";

import { useMemo, useState } from "react";
import { ALL_STATUSES, JOB_TYPES, STATUS_META } from "@/lib/crm/constants";
import type { Job, JobStatus, Manager } from "@/lib/crm/types";

const previewJobs: Job[] = [
  {
    id: "preview-18",
    reference: "MJ018",
    customerId: "preview-customer-1",
    customerName: "Example Customer",
    address: "North West London",
    postcode: "NW11",
    phone: "",
    email: "",
    jobType: "Fencing",
    status: "in_progress",
    manager: "JB",
    source: "WhatsApp",
    enquiryAt: "2026-09-10T09:00:00+01:00",
    finishes: ["Galvanised", "Powder coated"],
    siteVisitRequired: true,
    siteVisitCompletedAt: "2026-09-11T11:00:00+01:00",
    quotedAmount: 0,
    agreedAmount: 0,
    nextAction: "Complete installation and add completion photos",
    nextActionAt: "2026-09-17T09:00:00+01:00",
    materialsOrdered: true,
    createdAt: "2026-09-10T09:00:00+01:00",
    updatedAt: "2026-09-16T12:00:00+01:00",
  },
];

function money(value?: number) {
  if (value === undefined || value === null) return "TBC";
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(value);
}

function dateTime(value?: string) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function CrmDashboard() {
  const [status, setStatus] = useState<JobStatus | "all">("all");
  const [manager, setManager] = useState<Manager | "all">("all");
  const [type, setType] = useState<string>("all");
  const [query, setQuery] = useState("");

  const filteredJobs = useMemo(() => {
    return [...previewJobs]
      .filter((job) => status === "all" || job.status === status)
      .filter((job) => manager === "all" || job.manager === manager)
      .filter((job) => type === "all" || job.jobType === type)
      .filter((job) => {
        const haystack = `${job.reference} ${job.customerName} ${job.address} ${job.postcode ?? ""} ${job.phone ?? ""} ${job.email ?? ""}`.toLowerCase();
        return haystack.includes(query.toLowerCase().trim());
      })
      .sort((a, b) => {
        const byStatus = STATUS_META[a.status].order - STATUS_META[b.status].order;
        if (byStatus !== 0) return byStatus;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [manager, query, status, type]);

  const counts = useMemo(() => {
    const active = previewJobs.filter((j) => STATUS_META[j.status].group === "active").length;
    const scheduled = previewJobs.filter((j) => j.status === "installation_scheduled").length;
    const followUps = previewJobs.filter((j) => j.nextActionAt).length;
    const outstanding = previewJobs.reduce((sum, j) => sum + (j.balanceOutstanding ?? 0), 0);
    return { active, scheduled, followUps, outstanding };
  }, []);

  return (
    <main className="min-h-screen bg-[#f5f5f2] text-[#141414]">
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-4 lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e66a24]">M&J Metal</p>
            <h1 className="text-2xl font-black tracking-tight">CRM & Job Management</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full bg-[#f3f3ef] px-3 py-2 text-sm font-semibold sm:inline">Mark + Jonathan</span>
            <button className="rounded-xl bg-[#e66a24] px-4 py-2.5 text-sm font-black text-white shadow-sm">+ New job</button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-5 py-6 lg:px-8">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Active jobs", counts.active.toString()],
            ["Follow-ups due", counts.followUps.toString()],
            ["Scheduled", counts.scheduled.toString()],
            ["Outstanding", money(counts.outstanding)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-black/10 bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              <p className="text-sm font-semibold text-black/50">{label}</p>
              <p className="mt-2 text-3xl font-black">{value}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 rounded-2xl border border-black/10 bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <div className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_220px_180px_220px]">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search ref, customer, address, postcode, phone..."
              className="h-11 rounded-xl border border-black/15 bg-white px-3 text-sm outline-none focus:border-[#e66a24]"
            />
            <select value={status} onChange={(e) => setStatus(e.target.value as JobStatus | "all")} className="h-11 rounded-xl border border-black/15 px-3 text-sm">
              <option value="all">All statuses</option>
              {ALL_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            <select value={manager} onChange={(e) => setManager(e.target.value as Manager | "all")} className="h-11 rounded-xl border border-black/15 px-3 text-sm">
              <option value="all">Mark + Jonathan</option>
              <option value="MD">Mark</option>
              <option value="JB">Jonathan</option>
            </select>
            <select value={type} onChange={(e) => setType(e.target.value)} className="h-11 rounded-xl border border-black/15 px-3 text-sm">
              <option value="all">All job types</option>
              {JOB_TYPES.map((jobType) => <option key={jobType}>{jobType}</option>)}
            </select>
          </div>
        </section>

        <section className="mt-5 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse text-left">
              <thead className="bg-[#f2f2ee] text-xs uppercase tracking-[0.08em] text-black/55">
                <tr>
                  <th className="px-4 py-3">Ref</th><th className="px-4 py-3">Customer / Site</th><th className="px-4 py-3">Job</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Manager</th><th className="px-4 py-3">Value</th><th className="px-4 py-3">Next action</th><th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((job) => (
                  <tr key={job.id} className="border-t border-black/8 align-top hover:bg-[#fffaf6]">
                    <td className="px-4 py-4 font-black text-[#e66a24]">{job.reference}</td>
                    <td className="px-4 py-4"><p className="font-bold">{job.customerName}</p><p className="mt-1 text-sm text-black/50">{job.address} {job.postcode}</p></td>
                    <td className="px-4 py-4"><p className="font-semibold">{job.jobType}</p><p className="mt-1 text-xs text-black/45">{job.finishes.join(" + ") || "Finish TBC"}</p></td>
                    <td className="px-4 py-4"><span className="rounded-full bg-[#f3f3ef] px-3 py-1.5 text-xs font-bold">{STATUS_META[job.status].label}</span></td>
                    <td className="px-4 py-4 font-bold">{job.manager === "MD" ? "Mark" : "Jonathan"}</td>
                    <td className="px-4 py-4 font-bold">{money(job.agreedAmount ?? job.quotedAmount)}</td>
                    <td className="px-4 py-4"><p className="max-w-[260px] font-semibold">{job.nextAction ?? "No next action"}</p><p className="mt-1 text-xs text-black/45">{dateTime(job.nextActionAt)}</p></td>
                    <td className="px-4 py-4"><button className="rounded-lg border border-black/15 px-3 py-2 text-sm font-bold">Open</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredJobs.length === 0 && <div className="p-10 text-center text-sm text-black/50">No jobs match these filters.</div>}
        </section>

        <p className="mt-5 text-xs text-black/40">Build preview. Live data, authentication, uploads, quotes and integrations switch on when the M&J Supabase project is connected.</p>
      </div>
    </main>
  );
}
