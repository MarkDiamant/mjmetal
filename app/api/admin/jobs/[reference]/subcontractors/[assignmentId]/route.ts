import { NextResponse } from "next/server";
import { requireAdminToken, supabaseRequest } from "@/lib/crm/supabase-server";

async function jsonOrError(response: Response) {
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message || body?.error_description || "Database request failed");
  return body;
}

async function resolveAssignment(reference: string, assignmentId: string, token: string) {
  const jobs = await jsonOrError(await supabaseRequest(`/rest/v1/mj_jobs?reference=eq.${encodeURIComponent(reference)}&select=id&limit=1`, {}, token));
  const job = jobs[0];
  if (!job) return { job: null, assignment: null };
  const assignments = await jsonOrError(await supabaseRequest(`/rest/v1/mj_job_subcontractors?id=eq.${encodeURIComponent(assignmentId)}&job_id=eq.${job.id}&select=*&limit=1`, {}, token));
  return { job, assignment: assignments[0] || null };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ reference: string; assignmentId: string }> }) {
  const session = await requireAdminToken();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { reference, assignmentId } = await params;
    const body = await request.json();
    const { job, assignment } = await resolveAssignment(reference, assignmentId, session.token);
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
    if (!assignment) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });

    const patch: Record<string, unknown> = {};
    for (const key of ["status","scope","materials_included","scheduled_at","completed_at","deposit_amount","paid_amount","agreed_cost","assignment_role"]) {
      if (key in body) patch[key] = body[key];
    }

    const addPayment = Number(body.add_payment || 0);
    if (addPayment > 0 && !("paid_amount" in patch)) patch.paid_amount = Number(assignment.paid_amount || 0) + addPayment;

    const rows = await jsonOrError(await supabaseRequest(`/rest/v1/mj_job_subcontractors?id=eq.${encodeURIComponent(assignmentId)}`, {
      method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(patch),
    }, session.token));

    if (addPayment > 0) {
      await supabaseRequest("/rest/v1/mj_payments", {
        method: "POST", headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ job_id: job.id, direction: "subcontractor_out", payment_type: body.payment_type || "Subcontractor payment", amount: addPayment, payment_method: body.payment_method || "Bank transfer", counterparty: body.counterparty || null, paid_at: body.paid_at || new Date().toISOString(), notes: `Assignment ${assignmentId}` }),
      }, session.token);
    }

    await supabaseRequest("/rest/v1/mj_audit_events", {
      method: "POST", headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ job_id: job.id, actor: session.admin.initials, action: "updated", entity_type: "subcontractor_assignment", entity_id: assignmentId, changes: { ...patch, add_payment: addPayment || undefined, paid_at: body.paid_at || undefined } }),
    }, session.token);

    return NextResponse.json({ assignment: rows[0] });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update subcontractor" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ reference: string; assignmentId: string }> }) {
  const session = await requireAdminToken();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { reference, assignmentId } = await params;
    const { job, assignment } = await resolveAssignment(reference, assignmentId, session.token);
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
    if (!assignment) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });

    const deleted = await supabaseRequest(`/rest/v1/mj_job_subcontractors?id=eq.${encodeURIComponent(assignmentId)}`, { method: "DELETE", headers: { Prefer: "return=minimal" } }, session.token);
    if (!deleted.ok) return NextResponse.json({ error: "Could not remove assignment" }, { status: 500 });

    await supabaseRequest("/rest/v1/mj_audit_events", {
      method: "POST", headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ job_id: job.id, actor: session.admin.initials, action: "removed", entity_type: "subcontractor_assignment", entity_id: assignmentId, changes: { subcontractor_id: assignment.subcontractor_id, assignment_role: assignment.assignment_role || null } }),
    }, session.token);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not remove assignment" }, { status: 500 });
  }
}
