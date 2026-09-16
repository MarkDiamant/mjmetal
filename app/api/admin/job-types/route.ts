import { NextResponse } from "next/server";
import { requireAdminToken, supabaseRequest } from "@/lib/crm/supabase-server";
import { JOB_TYPES } from "@/lib/crm/constants";

export async function GET() {
  const session = await requireAdminToken();
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const response = await supabaseRequest("/rest/v1/mj_jobs?select=job_type,job_types", { method: "GET" }, session.token);
  const jobs = response.ok ? await response.json() as Array<{ job_type?: string; job_types?: string[] }> : [];
  const counts = new Map<string, number>();
  for (const name of JOB_TYPES) counts.set(name, 0);
  for (const job of jobs) {
    const types = Array.isArray(job.job_types) && job.job_types.length ? job.job_types : [job.job_type].filter(Boolean) as string[];
    for (const raw of types) {
      const name = String(raw || "").trim();
      if (!name) continue;
      counts.set(name, (counts.get(name) || 0) + 1);
    }
  }

  const options = [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "en-GB"));

  return NextResponse.json({ options });
}
