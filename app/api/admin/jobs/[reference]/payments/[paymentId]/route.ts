import { NextRequest, NextResponse } from "next/server";
import { requireAdminToken, supabaseRequest } from "@/lib/crm/supabase-server";

async function jsonOrError(response: Response) {
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message || body?.error_description || body?.hint || "Database request failed");
  return body;
}

async function resolveJob(token: string, reference: string) {
  const response = await supabaseRequest(`/rest/v1/mj_jobs?reference=eq.${encodeURIComponent(reference)}&select=id&limit=1`, {}, token);
  const rows = await jsonOrError(response) as Array<{ id: string }>;
  return rows[0] || null;
}

async function audit(token: string, actor: "MD" | "JB", jobId: string, action: string, paymentId: string, changes: Record<string, unknown>) {
  await supabaseRequest("/rest/v1/mj_audit_events", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ job_id: jobId, actor, action, entity_type: "payment", entity_id: paymentId, changes }),
  }, token);
}

function assignmentIdFromPayment(payment: Record<string, any>) {
  if (payment.direction !== "subcontractor_out") return null;
  const match = String(payment.notes || "").match(/^Assignment\s+([0-9a-f-]+)$/i);
  return match?.[1] || null;
}

async function syncAssignmentPaid(token: string, jobId: string, assignmentId: string | null) {
  if (!assignmentId) return;
  const payments = await jsonOrError(await supabaseRequest(`/rest/v1/mj_payments?job_id=eq.${jobId}&direction=eq.subcontractor_out&notes=eq.${encodeURIComponent(`Assignment ${assignmentId}`)}&select=amount`, {}, token));
  const paid = payments.reduce((sum: number, payment: any) => sum + Number(payment.amount || 0), 0);
  await supabaseRequest(`/rest/v1/mj_job_subcontractors?id=eq.${encodeURIComponent(assignmentId)}&job_id=eq.${jobId}`, {
    method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ paid_amount: paid }),
  }, token);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ reference: string; paymentId: string }> }) {
  const session = await requireAdminToken();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { reference, paymentId } = await params;
  try {
    const job = await resolveJob(session.token, reference);
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
    const existing = await jsonOrError(await supabaseRequest(`/rest/v1/mj_payments?id=eq.${encodeURIComponent(paymentId)}&job_id=eq.${job.id}&select=*&limit=1`, {}, session.token));
    if (!existing.length) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    const body = await request.json();
    const patch: Record<string, unknown> = {};
    if ("payment_type" in body) patch.payment_type = String(body.payment_type || "Payment");
    if ("amount" in body) patch.amount = Number(body.amount || 0);
    if ("paid_at" in body) patch.paid_at = body.paid_at || null;
    if ("payment_method" in body) patch.payment_method = body.payment_method || null;
    if ("notes" in body) patch.notes = body.notes || null;
    const updated = await jsonOrError(await supabaseRequest(`/rest/v1/mj_payments?id=eq.${encodeURIComponent(paymentId)}&job_id=eq.${job.id}`, {
      method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(patch),
    }, session.token));
    await syncAssignmentPaid(session.token, job.id, assignmentIdFromPayment(updated[0] || existing[0]));
    await audit(session.token, session.admin.initials, job.id, "updated", paymentId, patch);
    return NextResponse.json({ item: updated[0] });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update payment" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ reference: string; paymentId: string }> }) {
  const session = await requireAdminToken();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { reference, paymentId } = await params;
  try {
    const job = await resolveJob(session.token, reference);
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
    const existing = await jsonOrError(await supabaseRequest(`/rest/v1/mj_payments?id=eq.${encodeURIComponent(paymentId)}&job_id=eq.${job.id}&select=*&limit=1`, {}, session.token));
    if (!existing.length) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    const assignmentId = assignmentIdFromPayment(existing[0]);
    const response = await supabaseRequest(`/rest/v1/mj_payments?id=eq.${encodeURIComponent(paymentId)}&job_id=eq.${job.id}`, { method: "DELETE" }, session.token);
    if (!response.ok) throw new Error("Could not delete payment");
    await syncAssignmentPaid(session.token, job.id, assignmentId);
    await audit(session.token, session.admin.initials, job.id, "deleted", paymentId, existing[0]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not delete payment" }, { status: 500 });
  }
}
