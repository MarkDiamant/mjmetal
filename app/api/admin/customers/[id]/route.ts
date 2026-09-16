import { NextResponse } from "next/server";
import { requireAdminToken, supabaseRequest } from "@/lib/crm/supabase-server";

async function jsonOrError(response: Response) {
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message || body?.error_description || "Database request failed");
  return body;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminToken();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const customers = await jsonOrError(await supabaseRequest(`/rest/v1/mj_customers?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, {}, session.token));
    const customer = customers[0];
    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    const jobs = await jsonOrError(await supabaseRequest(`/rest/v1/mj_jobs?customer_id=eq.${encodeURIComponent(id)}&select=*&order=created_at.desc`, {}, session.token));
    const jobIds = jobs.map((j: any) => j.id);
    let activities: any[] = [], quotes: any[] = [], payments: any[] = [];
    if (jobIds.length) {
      const list = jobIds.join(",");
      [activities, quotes, payments] = await Promise.all([
        jsonOrError(await supabaseRequest(`/rest/v1/mj_activities?job_id=in.(${list})&select=*&order=occurred_at.desc&limit=250`, {}, session.token)),
        jsonOrError(await supabaseRequest(`/rest/v1/mj_quotes?job_id=in.(${list})&select=*&order=created_at.desc`, {}, session.token)),
        jsonOrError(await supabaseRequest(`/rest/v1/mj_payments?job_id=in.(${list})&select=*&order=created_at.desc`, {}, session.token)),
      ]);
    }
    return NextResponse.json({ customer, jobs, activities, quotes, payments });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load customer history" }, { status: 500 });
  }
}
