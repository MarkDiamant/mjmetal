import { NextResponse } from "next/server";
import { requireAdminToken, supabaseRequest } from "@/lib/crm/supabase-server";
import { JOB_TYPES } from "@/lib/crm/constants";

const hiddenCookie = "mj_hidden_job_types";
function hiddenFrom(request: Request) { const raw = request.headers.get("cookie")?.match(/(?:^|; )mj_hidden_job_types=([^;]*)/)?.[1]; try { return new Set<string>(JSON.parse(decodeURIComponent(raw || "%5B%5D"))); } catch { return new Set<string>(); } }

export async function GET(request: Request) {
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

  const hidden = hiddenFrom(request);
  const options = [...counts.entries()]
    .filter(([name]) => !hidden.has(name))
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "en-GB"));

  return NextResponse.json({ options });
}


export async function DELETE(request: Request) {
  const session = await requireAdminToken();
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  if (!name) return NextResponse.json({ error: "Work type required" }, { status: 400 });
  const hidden = hiddenFrom(request); hidden.add(name);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(hiddenCookie, JSON.stringify([...hidden]), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60*60*24*365*5 });
  return response;
}
