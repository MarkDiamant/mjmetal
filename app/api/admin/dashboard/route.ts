import { NextResponse } from "next/server";
import { requireAdminToken, supabaseRequest } from "@/lib/crm/supabase-server";

export async function GET() {
  const session = await requireAdminToken();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [activityResponse, auditResponse] = await Promise.all([
    supabaseRequest("/rest/v1/mj_activities?select=id,job_id,activity_type,actor,summary,details,occurred_at,mj_jobs(reference)&order=occurred_at.desc&limit=100", {}, session.token),
    supabaseRequest("/rest/v1/mj_audit_events?select=id,job_id,actor,action,entity_type,created_at,mj_jobs(reference)&order=created_at.desc&limit=100", {}, session.token),
  ]);

  const manual = activityResponse.ok ? await activityResponse.json() as Array<Record<string, any>> : [];
  const audit = auditResponse.ok ? await auditResponse.json() as Array<Record<string, any>> : [];

  const activities = [
    ...manual.map((item) => ({
      id: `activity-${item.id}`,
      job_id: item.job_id,
      actor: item.actor,
      summary: item.summary,
      details: item.details,
      occurred_at: item.occurred_at,
      mj_jobs: item.mj_jobs,
      source: "activity",
    })),
    ...audit.map((item) => ({
      id: `audit-${item.id}`,
      job_id: item.job_id,
      actor: item.actor,
      summary: `${item.actor === "MD" ? "Mark" : item.actor === "JB" ? "Jonathan" : "CRM"} ${String(item.action || "updated").replaceAll("_", " ")} ${String(item.entity_type || "record").replaceAll("_", " ")}`,
      details: null,
      occurred_at: item.created_at,
      mj_jobs: item.mj_jobs,
      source: "audit",
    })),
  ]
    .sort((a, b) => new Date(b.occurred_at || 0).getTime() - new Date(a.occurred_at || 0).getTime())
    .slice(0, 100);

  return NextResponse.json({ activities, admin: session.admin });
}
