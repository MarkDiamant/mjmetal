import { NextResponse } from "next/server";
import { requireAdminToken, supabaseRequest } from "@/lib/crm/supabase-server";

async function jsonOrError(response: Response) {
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message || body?.error_description || "Database request failed");
  return body;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ reference: string; assignmentId: string }> }) {
  const session = await requireAdminToken();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { reference, assignmentId } = await params;
    const body = await request.json();
    const jobs = await jsonOrError(await supabaseRequest(`/rest/v1/mj_jobs?reference=eq.${encodeURIComponent(reference)}&select=id&limit=1`, {}, session.token));
    const job = jobs[0];
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
    const assignments = await jsonOrError(await supabaseRequest(`/rest/v1/mj_job_subcontractors?id=eq.${encodeURIComponent(assignmentId)}&job_id=eq.${job.id}&select=*&limit=1`, {}, session.token));
    const assignment = assignments[0];
    if (!assignment) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });

    const patch: Record<string, unknown> = {};
    for (const key of ["status","scope","materials_included","scheduled_at","completed_at","deposit_amount","paid_amount","agreed_cost"]) {
      if (key in body) patch[key] = body[key];
    }
    const rows = await jsonOrError(await supabaseRequest(`/rest/v1/mj_job_subcontractors?id=eq.${encodeURIComponent(assignmentId)}`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(patch) }, session.token));

    if (body.add_payment && Number(body.add_payment) > 0) {
      await supabaseRequest("/rest/v1/mj_payments", {
        method: "POST", headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ job_id: job.id, direction: "subcontractor_out", payment_type: body.payment_type || "Subcontractor payment", amount: Number(body.add_payment), payment_method: body.payment_method || "Bank transfer", counterparty: body.counterparty || null, paid_at: new Date().toISOString(), notes: `Assignment ${assignmentId}` }),
      }, session.token);
    }

    await supabaseRequest("/rest/v1/mj_audit_events", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ job_id: job.id, actor: session.admin.initials, action: "updated", entity_type: "subcontractor_assignment", entity_id: assignmentId, changes: patch }) }, session.token);
    return NextResponse.json({ assignment: rows[0] });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update subcontractor" }, { status: 500 });
  }
}
