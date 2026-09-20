import { NextRequest, NextResponse } from "next/server";
import { requirePermission, supabaseRequest } from "@/lib/crm/supabase-server";

async function jsonOrError(response: Response) {
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message || body?.error_description || body?.hint || "Database request failed");
  return body;
}

async function audit(token: string, actor: "MD" | "JB", jobId: string, action: string, entityType: string, entityId?: string, changes: Record<string, unknown> = {}) {
  await supabaseRequest("/rest/v1/mj_audit_events", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ job_id: jobId, actor, action, entity_type: entityType, entity_id: entityId || null, changes }),
  }, token);
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ reference: string }> }) {
  const session = await requirePermission("view_jobs");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { reference } = await params;
  try {
    const jobRows = await jsonOrError(await supabaseRequest(`/rest/v1/mj_jobs?reference=eq.${encodeURIComponent(reference)}&select=*&limit=1`, {}, session.token));
    const job = jobRows[0];
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    const coreOnly = request.nextUrl.searchParams.get("mode") === "core";
    const canPayments=session.permissions.includes("view_payments_invoices"), canCosts=session.permissions.includes("view_costs_profit"), canPricing=session.permissions.includes("view_pricing"), canFiles=session.permissions.includes("view_files"), canWorkforce=session.permissions.includes("view_workforce"), canHistory=session.permissions.includes("view_history");
    if (coreOnly) {
      const [customers, payments, costs, assignments] = await Promise.all([
        jsonOrError(await supabaseRequest(`/rest/v1/mj_customers?id=eq.${job.customer_id}&select=*`, {}, session.token)),
        canPayments?jsonOrError(await supabaseRequest(`/rest/v1/mj_payments?job_id=eq.${job.id}&select=*&order=created_at.desc`, {}, session.token)):Promise.resolve([]),
        canCosts?jsonOrError(await supabaseRequest(`/rest/v1/mj_job_costs?job_id=eq.${job.id}&select=*&order=created_at.desc`, {}, session.token)):Promise.resolve([]),
        canWorkforce?jsonOrError(await supabaseRequest(`/rest/v1/mj_job_subcontractors?job_id=eq.${job.id}&select=*&order=created_at.desc`, {}, session.token)):Promise.resolve([]),
      ]);
      return NextResponse.json({
        job, customer: customers[0] || null, payments, costs, assignments,
        activities: [], quotes: [], files: [], subcontractors: [], materialOrders: [], suppliers: [], auditEvents: [],
        currentAdmin: session.admin, _full: false,
      });
    }

    const [customers, activities, payments, costs, quotes, files, assignments, subcontractors, materialOrders, auditEvents, suppliers, xeroInvoices] = await Promise.all([
      jsonOrError(await supabaseRequest(`/rest/v1/mj_customers?id=eq.${job.customer_id}&select=*`, {}, session.token)),
      canHistory?jsonOrError(await supabaseRequest(`/rest/v1/mj_activities?job_id=eq.${job.id}&select=*&order=occurred_at.desc`, {}, session.token)):Promise.resolve([]),
      jsonOrError(await supabaseRequest(`/rest/v1/mj_payments?job_id=eq.${job.id}&select=*&order=created_at.desc`, {}, session.token)),
      jsonOrError(await supabaseRequest(`/rest/v1/mj_job_costs?job_id=eq.${job.id}&select=*&order=created_at.desc`, {}, session.token)),
      canPricing?jsonOrError(await supabaseRequest(`/rest/v1/mj_quotes?job_id=eq.${job.id}&select=*&order=version.desc`, {}, session.token)):Promise.resolve([]),
      canFiles?jsonOrError(await supabaseRequest(`/rest/v1/mj_files?job_id=eq.${job.id}&select=*&order=created_at.desc`, {}, session.token)):Promise.resolve([]),
      jsonOrError(await supabaseRequest(`/rest/v1/mj_job_subcontractors?job_id=eq.${job.id}&select=*&order=created_at.desc`, {}, session.token)),
      canWorkforce?jsonOrError(await supabaseRequest(`/rest/v1/mj_subcontractors?active=eq.true&select=*&order=name.asc`, {}, session.token)):Promise.resolve([]),
      canCosts?jsonOrError(await supabaseRequest(`/rest/v1/mj_material_orders?job_id=eq.${job.id}&select=*&order=created_at.desc`, {}, session.token)):Promise.resolve([]),
      canHistory?jsonOrError(await supabaseRequest(`/rest/v1/mj_audit_events?job_id=eq.${job.id}&select=*&order=created_at.desc&limit=100`, {}, session.token)):Promise.resolve([]),
      canCosts?jsonOrError(await supabaseRequest(`/rest/v1/mj_suppliers?active=eq.true&select=*&order=name.asc`, {}, session.token)):Promise.resolve([]),
      canPayments?jsonOrError(await supabaseRequest(`/rest/v1/mj_xero_invoices?job_id=eq.${job.id}&select=*&order=created_at.desc`, {}, session.token)):Promise.resolve([]),
    ]);

    const filesWithUrls = await Promise.all(files.map(async (file: any) => {
      const signed = await supabaseRequest(`/storage/v1/object/sign/mj-job-files/${encodeURIComponent(file.storage_path).replace(/%2F/g, "/")}`, {
        method: "POST",
        body: JSON.stringify({ expiresIn: 3600 }),
      }, session.token);
      const signedBody = signed.ok ? await signed.json() : null;
      return { ...file, signed_url: signedBody?.signedURL || signedBody?.signedUrl || null };
    }));

    return NextResponse.json({
      job, customer: customers[0] || null, activities, payments, costs, quotes, files: filesWithUrls,
      assignments, subcontractors, materialOrders, suppliers, auditEvents, xeroInvoices, currentAdmin: session.admin, _full: true,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to load job" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ reference: string }> }) {
  const session = await requirePermission("edit_jobs");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { reference } = await params;
  const body = await request.json();
  const permissionForAction:Record<string,any>={payment:"view_payments_invoices",cost_summary:"view_costs_profit",cost:"view_costs_profit",quote:"view_pricing",subcontractor:"view_workforce",material_order:"view_costs_profit"};
  const needed=permissionForAction[String(body.type||"")];
  if(needed&&!session.permissions.includes(needed))return NextResponse.json({error:"You do not have permission for this action"},{status:403});
  try {
    const rows = await jsonOrError(await supabaseRequest(`/rest/v1/mj_jobs?reference=eq.${encodeURIComponent(reference)}&select=id,customer_id`, {}, session.token));
    const job = rows[0];
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    if (body.customer && Object.keys(body.customer).length) {
      await jsonOrError(await supabaseRequest(`/rest/v1/mj_customers?id=eq.${job.customer_id}`, {
        method: "PATCH", headers: { Prefer: "return=representation" },
        body: JSON.stringify({ ...body.customer, updated_at: new Date().toISOString() }),
      }, session.token));
      await audit(session.token, session.admin?.initials || session.accessUser?.name || session.accessUser?.email || "CRM user", job.id, "updated", "customer", job.customer_id, body.customer);
    }

    if (body.job && Object.keys(body.job).length) {
      const patch = { ...body.job } as Record<string, unknown>;
      if (["declined", "cancelled", "completed"].includes(String(patch.status || ""))) {
        patch.next_action = null;
        patch.next_action_at = null;
        patch.next_action_assignee = null;
        if (patch.status === "completed" && !("completed_at" in patch)) patch.completed_at = new Date().toISOString();
      }
      const updated = await jsonOrError(await supabaseRequest(`/rest/v1/mj_jobs?id=eq.${job.id}`, {
        method: "PATCH", headers: { Prefer: "return=representation" },
        body: JSON.stringify({ ...patch, updated_at: new Date().toISOString() }),
      }, session.token));
      await audit(session.token, session.admin?.initials || session.accessUser?.name || session.accessUser?.email || "CRM user", job.id, "updated", "job", job.id, patch);
      return NextResponse.json({ job: updated[0] });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to save changes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ reference: string }> }) {
  const session = await requirePermission("edit_jobs");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { reference } = await params;
  const body = await request.json();
  try {
    const rows = await jsonOrError(await supabaseRequest(`/rest/v1/mj_jobs?reference=eq.${encodeURIComponent(reference)}&select=id,agreed_amount`, {}, session.token));
    const job = rows[0];
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
    const now = new Date().toISOString();

    if (body.type === "activity") {
      const created = await jsonOrError(await supabaseRequest("/rest/v1/mj_activities", {
        method: "POST", headers: { Prefer: "return=representation" },
        body: JSON.stringify({ job_id: job.id, activity_type: body.activity_type || "note", actor: session.admin?.initials || session.accessUser?.name || session.accessUser?.email || "CRM user", summary: body.summary, details: body.details || null, occurred_at: body.occurred_at || now, next_action_at: body.next_action_at || null }),
      }, session.token));
      if (body.next_action || body.next_action_at) {
        await supabaseRequest(`/rest/v1/mj_jobs?id=eq.${job.id}`, { method: "PATCH", body: JSON.stringify({ next_action: body.next_action || body.summary, next_action_at: body.next_action_at || null, updated_at: now }) }, session.token);
      }
      await audit(session.token, session.admin?.initials || session.accessUser?.name || session.accessUser?.email || "CRM user", job.id, "created", "activity", created[0]?.id, body);
      return NextResponse.json({ item: created[0] });
    }

    if (body.type === "payment") {
      const created = await jsonOrError(await supabaseRequest("/rest/v1/mj_payments", {
        method: "POST", headers: { Prefer: "return=representation" },
        body: JSON.stringify({ job_id: job.id, direction: body.direction || "customer_in", payment_type: body.payment_type || "payment", amount: Number(body.amount || 0), payment_method: body.payment_method || null, counterparty: body.counterparty || null, paid_at: body.paid_at || null, due_at: body.due_at || null, notes: body.notes || null }),
      }, session.token));
      if ((body.direction || "customer_in") === "customer_in" && body.paid_at) {
        const paymentType = String(body.payment_type || "").toLowerCase();
        const patch: Record<string, unknown> = { updated_at: now };
        if (paymentType.includes("deposit")) { patch.status = "deposit_paid"; patch.next_action = "Order materials"; }
        if (paymentType.includes("final") || paymentType.includes("balance")) { patch.status = "completed"; patch.completed_at = body.paid_at || now; patch.next_action = null; patch.next_action_at = null; patch.next_action_assignee = null; }
        if (Object.keys(patch).length > 1) await supabaseRequest(`/rest/v1/mj_jobs?id=eq.${job.id}`, { method: "PATCH", body: JSON.stringify(patch) }, session.token);
      }
      await audit(session.token, session.admin?.initials || session.accessUser?.name || session.accessUser?.email || "CRM user", job.id, "created", "payment", created[0]?.id, body);
      return NextResponse.json({ item: created[0] });
    }

    if (body.type === "cost_summary") {
      await supabaseRequest(`/rest/v1/mj_job_costs?job_id=eq.${job.id}&category=eq.Job%20total`, { method: "DELETE" }, session.token);
      if (body.estimated_amount !== null || body.actual_amount !== null) {
        await jsonOrError(await supabaseRequest("/rest/v1/mj_job_costs", {
          method: "POST", headers: { Prefer: "return=representation" },
          body: JSON.stringify({ job_id: job.id, category: "Job total", estimated_amount: body.estimated_amount, actual_amount: body.actual_amount }),
        }, session.token));
      }
      await audit(session.token, session.admin?.initials || session.accessUser?.name || session.accessUser?.email || "CRM user", job.id, "updated", "cost_summary", job.id, body);
      return NextResponse.json({ ok: true });
    }

    if (body.type === "cost") {
      const paidAmount = body.paid_amount ? Number(body.paid_amount) : 0;
      const created = await jsonOrError(await supabaseRequest("/rest/v1/mj_job_costs", {
        method: "POST", headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          job_id: job.id, category: body.category, supplier: body.supplier || null,
          estimated_amount: body.estimated_amount ? Number(body.estimated_amount) : null,
          actual_amount: body.actual_amount ? Number(body.actual_amount) : null,
          paid_amount: paidAmount, paid_at: body.paid_at || null, due_at: body.due_at || null, notes: body.notes || null,
        }),
      }, session.token));
      if (String(body.category).toLowerCase() === "commission" && paidAmount > 0) {
        await supabaseRequest("/rest/v1/mj_payments", {
          method: "POST", headers: { Prefer: "return=minimal" },
          body: JSON.stringify({ job_id: job.id, direction: "commission_out", payment_type: "Commission", amount: paidAmount, payment_method: body.payment_method || "Bank transfer", counterparty: body.supplier || null, paid_at: body.paid_at || now, notes: `Commission cost ${created[0]?.id || ""}`.trim() }),
        }, session.token);
      }
      await audit(session.token, session.admin?.initials || session.accessUser?.name || session.accessUser?.email || "CRM user", job.id, "created", "cost", created[0]?.id, body);
      return NextResponse.json({ item: created[0] });
    }

    if (body.type === "quote") {
      const existing = await jsonOrError(await supabaseRequest(`/rest/v1/mj_quotes?job_id=eq.${job.id}&select=version&order=version.desc&limit=1`, {}, session.token));
      const version = (existing[0]?.version || 0) + 1;
      const created = await jsonOrError(await supabaseRequest("/rest/v1/mj_quotes", {
        method: "POST", headers: { Prefer: "return=representation" },
        body: JSON.stringify({ job_id: job.id, version, status: body.status || "draft", vat_rate: Number(body.vat_rate || 0), scope_text: body.scope_text, exclusions: body.exclusions || null, amount: Number(body.amount || 0), deposit_amount: body.deposit_amount ? Number(body.deposit_amount) : null, lead_time: body.lead_time || null, valid_until: body.valid_until || null, created_by: session.admin?.initials || session.accessUser?.name || session.accessUser?.email || "CRM user" }),
      }, session.token));
      await supabaseRequest(`/rest/v1/mj_jobs?id=eq.${job.id}`, { method: "PATCH", body: JSON.stringify({ quoted_amount: Number(body.amount || 0), vat_rate: Number(body.vat_rate || 0), status: "quote_preparing", next_action: "Send quote", updated_at: now }) }, session.token);
      await audit(session.token, session.admin?.initials || session.accessUser?.name || session.accessUser?.email || "CRM user", job.id, "created", "quote", created[0]?.id, { version, amount: body.amount });
      return NextResponse.json({ item: created[0] });
    }

    if (body.type === "subcontractor") {
      let subcontractorId = body.subcontractor_id;
      if (!subcontractorId && body.name) {
        const createdSub = await jsonOrError(await supabaseRequest("/rest/v1/mj_subcontractors", {
          method: "POST", headers: { Prefer: "return=representation" },
          body: JSON.stringify({
            name: body.name, company: body.company || null, phone: body.phone || null, email: body.email || null,
            capabilities: body.capabilities || null, notes: body.notes || null, relationship_type: body.relationship_type || "subcontractor",
          }),
        }, session.token));
        subcontractorId = createdSub[0]?.id;
      }
      if (!subcontractorId) return NextResponse.json({ error: "Choose or add a person" }, { status: 400 });

      const role = body.assignment_role || "subcontractor";
      const existingAssignments = await jsonOrError(await supabaseRequest(`/rest/v1/mj_job_subcontractors?job_id=eq.${job.id}&subcontractor_id=eq.${encodeURIComponent(subcontractorId)}&assignment_role=eq.${encodeURIComponent(role)}&select=id&limit=1`, {}, session.token));
      if (existingAssignments.length) return NextResponse.json({ error: "That person is already assigned to this job in that role." }, { status: 409 });

      const created = await jsonOrError(await supabaseRequest("/rest/v1/mj_job_subcontractors", {
        method: "POST", headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          job_id: job.id, subcontractor_id: subcontractorId, scope: body.scope || null,
          agreed_cost: body.agreed_cost ? Number(body.agreed_cost) : null,
          materials_included: Boolean(body.materials_included), assignment_role: role,
          scheduled_at: body.scheduled_at || null,
        }),
      }, session.token));
      await audit(session.token, session.admin?.initials || session.accessUser?.name || session.accessUser?.email || "CRM user", job.id, "assigned", "workforce", created[0]?.id, body);
      return NextResponse.json({ item: created[0] });
    }

    if (body.type === "material_order") {
      let supplierId = body.supplier_id || null;
      if (!supplierId && body.supplier_name) {
        const createdSupplier = await jsonOrError(await supabaseRequest("/rest/v1/mj_suppliers", {
          method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ name: body.supplier_name }),
        }, session.token));
        supplierId = createdSupplier[0]?.id || null;
      }
      const created = await jsonOrError(await supabaseRequest("/rest/v1/mj_material_orders", {
        method: "POST", headers: { Prefer: "return=representation" },
        body: JSON.stringify({ job_id: job.id, supplier_id: supplierId, supplier_name: body.supplier_name || null, description: body.description, amount: body.amount ? Number(body.amount) : null, ordered_at: body.ordered_at || now, expected_at: body.expected_at || null, status: body.status || "ordered", notes: body.notes || null }),
      }, session.token));
      await supabaseRequest(`/rest/v1/mj_jobs?id=eq.${job.id}`, { method: "PATCH", body: JSON.stringify({ materials_ordered: true, materials_ordered_at: body.ordered_at || now, updated_at: now }) }, session.token);
      await audit(session.token, session.admin?.initials || session.accessUser?.name || session.accessUser?.email || "CRM user", job.id, "created", "material_order", created[0]?.id, body);
      return NextResponse.json({ item: created[0] });
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to update job" }, { status: 500 });
  }
}
