"use client";

import { useEffect, useState } from "react";

export default function ArchivePage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const response = await fetch("/api/admin/jobs?archived=1", { cache: "no-store" });
    if (response.status === 401) { window.location.href = "/admin/login"; return; }
    const body = await response.json().catch(() => ({}));
    if (!response.ok) setError(body.error || "Unable to load archive"); else { setJobs(body.jobs || []); setError(""); }
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  async function restore(reference: string) {
    const response = await fetch(`/api/admin/jobs/${encodeURIComponent(reference)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ job: { archived_at: null } }) });
    if (!response.ok) { setError("Could not restore job"); return; }
    await load();
  }

  return <main className="min-h-screen bg-[#f5f5f2] px-5 py-8 text-[#141414]"><div className="mx-auto max-w-5xl">
    <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#e66a24]">CRM & Job Management</p><h1 className="mt-1 text-3xl font-black">Archived jobs</h1><p className="mt-2 text-sm text-black/55">Archived records are kept permanently and can be restored at any time.</p></div><a href="/admin" className="rounded-xl border border-black/15 bg-white px-4 py-2.5 text-sm font-bold">Back</a></div>
    {error && <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>}
    <section className="mt-6 overflow-hidden rounded-2xl border border-black/10 bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-[#f2f2ee] text-xs uppercase tracking-[0.08em] text-black/50"><tr><th className="px-4 py-3">Ref</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Job</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"></th></tr></thead><tbody>{jobs.map((job) => <tr key={job.id} className="border-t border-black/8"><td className="px-4 py-4 font-black text-[#e66a24]"><a href={`/admin/jobs/${job.reference}`}>{job.reference}</a></td><td className="px-4 py-4"><b>{job.customerName}</b><div className="text-xs text-black/45">{job.address} {job.postcode}</div></td><td className="px-4 py-4">{job.jobType}</td><td className="px-4 py-4">{String(job.status).replaceAll("_", " ")}</td><td className="px-4 py-4 text-right"><button onClick={() => void restore(job.reference)} className="rounded-lg border border-black/15 px-3 py-2 font-bold">Restore</button></td></tr>)}</tbody></table></div>{loading && <p className="p-8 text-center text-black/45">Loading...</p>}{!loading && jobs.length === 0 && <p className="p-8 text-center text-black/45">No archived jobs.</p>}</section>
  </div></main>;
}
