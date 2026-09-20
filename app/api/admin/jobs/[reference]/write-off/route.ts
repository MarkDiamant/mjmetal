import { NextRequest, NextResponse } from "next/server";
import { requirePermission, supabaseRequest } from "@/lib/crm/supabase-server";

async function jsonOrError(response: Response) {
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message || body?.error_description || body?.hint || "Database request failed");
  return body;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ reference: string }> }) {
  const session = await requirePermission("view_payments_invoices");
  if(session&&!session.permissions.includes("edit_jobs")) return NextResponse.json({error:"You do not have permission to write off balances"},{status:403});
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { reference } = await params;
  try {
    const body = await request.json();
    const amount = Number(body.amount || 0);
    const reason = String(body.reason || "").trim();
    if (!(amount > 0)) return NextResponse.json({ error: "Write-off amount must be greater than zero" }, { status: 400 });
    if (!reason) return NextResponse.json({ error: "Please enter a reason for the write-off" }, { status: 400 });

    const rows = await jsonOrError(await supabaseRequest(`/rest/v1/mj_jobs?reference=eq.${encodeURIComponent(reference)}&select=id,written_off_amount&limit=1`, {}, session.token));
    const job = rows[0];
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
    const now = new Date().toISOString();
    const totalWrittenOff = Number(job.written_off_amount || 0) + amount;
    const updated = await jsonOrError(await supabaseRequest(`/rest/v1/mj_jobs?id=eq.${job.id}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ written_off_amount: totalWrittenOff, written_off_at: now, write_off_reason: reason, next_action: null, next_action_at: null, next_action_assignee: null, updated_at: now }),
    }, session.token));
    await supabaseRequest("/rest/v1/mj_audit_events", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ job_id: job.id, actor: session.admin?.initials || session.accessUser?.name || session.accessUser?.email || "CRM user", action: "written_off", entity_type: "customer_balance", entity_id: job.id, changes: { amount, total_written_off: totalWrittenOff, reason } }),
    }, session.token);
    return NextResponse.json({ job: updated[0] });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not write off balance" }, { status: 500 });
  }
}
