import { NextResponse } from "next/server";
import { requireAdminToken, supabaseRequest } from "@/lib/crm/supabase-server";

export async function GET() {
  const session = await requireAdminToken();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const response = await supabaseRequest("/rest/v1/mj_activities?select=id,job_id,activity_type,actor,summary,details,occurred_at,mj_jobs(reference)&order=occurred_at.desc&limit=15", {}, session.token);
  const activities = response.ok ? await response.json() : [];
  return NextResponse.json({ activities, admin: session.admin });
}
