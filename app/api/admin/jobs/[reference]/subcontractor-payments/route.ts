import { NextResponse } from "next/server";
import { requirePermission, supabaseRequest } from "@/lib/crm/supabase-server";

async function jsonOrEmpty(response: Response) {
  if (!response.ok) return [] as Array<Record<string, any>>;
  return await response.json().catch(() => []) as Array<Record<string, any>>;
}

export async function GET(_request: Request, { params }: { params: Promise<{ reference: string }> }) {
  const session = await requirePermission("view_payments_invoices");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if(!session.permissions.includes("view_workforce")) return NextResponse.json({error:"You do not have permission to view workforce payment details"},{status:403});

  const { reference } = await params;
  const jobs = await jsonOrEmpty(await supabaseRequest(`/rest/v1/mj_jobs?reference=eq.${encodeURIComponent(reference)}&select=id&limit=1`, {}, session.token));
  const job = jobs[0];
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  const [payments, assignments, people] = await Promise.all([
    jsonOrEmpty(await supabaseRequest(`/rest/v1/mj_payments?job_id=eq.${job.id}&direction=eq.subcontractor_out&select=id,payment_type,amount,payment_method,paid_at,created_at,notes&order=paid_at.asc`, {}, session.token)),
    jsonOrEmpty(await supabaseRequest(`/rest/v1/mj_job_subcontractors?job_id=eq.${job.id}&select=id,subcontractor_id,assignment_role`, {}, session.token)),
    jsonOrEmpty(await supabaseRequest(`/rest/v1/mj_subcontractors?select=id,name,company`, {}, session.token)),
  ]);

  const personById = new Map(people.map((person) => [String(person.id), person]));
  const assignmentById = new Map(assignments.map((assignment) => [String(assignment.id), assignment]));

  const items = payments.map((payment) => {
    const match = String(payment.notes || "").match(/^Assignment\s+([0-9a-f-]{36})/i);
    const assignmentId = match?.[1] || null;
    const assignment = assignmentId ? assignmentById.get(assignmentId) : null;
    const person = assignment ? personById.get(String(assignment.subcontractor_id)) : null;
    return {
      ...payment,
      assignmentId,
      personName: person?.name || "Subcontractor",
      personCompany: person?.company || "",
      assignmentRole: assignment?.assignment_role || null,
    };
  });

  return NextResponse.json({ items });
}
