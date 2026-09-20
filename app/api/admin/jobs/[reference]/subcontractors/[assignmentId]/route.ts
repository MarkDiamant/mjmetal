import { NextResponse } from "next/server";
import { requirePermission, supabaseRequest } from "@/lib/crm/supabase-server";

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

async function recalculatePaidAmount(jobId: string, assignmentId: string, token: string) {
  const rows = await jsonOrError(await supabaseRequest(`/rest/v1/mj_payments?job_id=eq.${jobId}&direction=eq.subcontractor_out&notes=eq.${encodeURIComponent(`Assignment ${assignmentId}`)}&select=amount`, {}, token));
  const paid = rows.reduce((sum: number, row: any) => sum + Number(row.amount || 0), 0);
  await jsonOrError(await supabaseRequest(`/rest/v1/mj_job_subcontractors?id=eq.${encodeURIComponent(assignmentId)}`, {
    method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ paid_amount: paid }),
  }, token));
  return paid;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ reference: string; assignmentId: string }> }) {
  const session = await requirePermission("view_workforce");
  if(session&&!session.permissions.includes("edit_jobs")) return NextResponse.json({error:"You do not have permission to change job assignments"},{status:403});
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
    if (addPayment > 0) {
      const paidAt = body.paid_at || new Date().toISOString();
      const note = `Assignment ${assignmentId}`;
      const recent = await jsonOrError(await supabaseRequest(`/rest/v1/mj_payments?job_id=eq.${job.id}&direction=eq.subcontractor_out&notes=eq.${encodeURIComponent(note)}&amount=eq.${addPayment}&paid_at=eq.${encodeURIComponent(paidAt)}&select=id&limit=1`, {}, session.token));
      if (recent.length) return NextResponse.json({ error: "That subcontractor payment is already recorded." }, { status: 409 });

      await jsonOrError(await supabaseRequest("/rest/v1/mj_payments", {
        method: "POST", headers: { Prefer: "return=representation" },
        body: JSON.stringify({ job_id: job.id, direction: "subcontractor_out", payment_type: body.payment_type || "Subcontractor payment", amount: addPayment, payment_method: body.payment_method || "Bank transfer", counterparty: body.counterparty || null, paid_at: paidAt, notes: note }),
      }, session.token));
      patch.paid_amount = await recalculatePaidAmount(job.id, assignmentId, session.token);
    }

    const rows = Object.keys(patch).length ? await jsonOrError(await supabaseRequest(`/rest/v1/mj_job_subcontractors?id=eq.${encodeURIComponent(assignmentId)}`, {
      method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(patch),
    }, session.token)) : [assignment];

    await supabaseRequest("/rest/v1/mj_audit_events", {
      method: "POST", headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ job_id: job.id, actor: session.admin?.initials || session.accessUser?.name || session.accessUser?.email || "CRM user", action: "updated", entity_type: "subcontractor_assignment", entity_id: assignmentId, changes: { ...patch, add_payment: addPayment || undefined, paid_at: body.paid_at || undefined } }),
    }, session.token);

    return NextResponse.json({ assignment: rows[0] });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update subcontractor" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ reference: string; assignmentId: string }> }) {
  const session = await requirePermission("view_workforce");
  if(session&&!session.permissions.includes("edit_jobs")) return NextResponse.json({error:"You do not have permission to change job assignments"},{status:403});
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
      body: JSON.stringify({ job_id: job.id, actor: session.admin?.initials || session.accessUser?.name || session.accessUser?.email || "CRM user", action: "removed", entity_type: "subcontractor_assignment", entity_id: assignmentId, changes: { subcontractor_id: assignment.subcontractor_id, assignment_role: assignment.assignment_role || null } }),
    }, session.token);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not remove subcontractor" }, { status: 500 });
  }
}
