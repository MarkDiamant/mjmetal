import { NextResponse } from "next/server";
import { requireAdminToken, supabaseRequest } from "@/lib/crm/supabase-server";

function asNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
function normalisePhone(value: unknown) { return String(value || "").replace(/\D/g, ""); }
function normaliseEmail(value: unknown) { return String(value || "").trim().toLowerCase(); }

export async function GET(request: Request) {
  const session = await requireAdminToken();
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const url = new URL(request.url);
  const archived = url.searchParams.get("archived") === "1";
  const archiveFilter = archived ? "archived_at=not.is.null" : "archived_at=is.null";

  const [jobsResponse, paymentsResponse, assignmentsResponse, peopleResponse, costsResponse] = await Promise.all([
    supabaseRequest(`/rest/v1/mj_jobs?${archiveFilter}&select=*,mj_customers(*)&order=sequence_number.asc`, { method: "GET" }, session.token),
    supabaseRequest("/rest/v1/mj_payments?select=id,job_id,direction,payment_type,amount,payment_method,counterparty,paid_at,due_at,notes,created_at&order=created_at.desc", { method: "GET" }, session.token),
    supabaseRequest("/rest/v1/mj_job_subcontractors?select=id,job_id,subcontractor_id,scope,agreed_cost,deposit_amount,paid_amount,status,scheduled_at,completed_at,materials_included,assignment_role&order=created_at.asc", { method: "GET" }, session.token),
    supabaseRequest("/rest/v1/mj_subcontractors?active=eq.true&select=id,name,company,phone,email,capabilities,relationship_type&order=name.asc", { method: "GET" }, session.token),
    supabaseRequest("/rest/v1/mj_job_costs?category=eq.Commission&select=id,job_id,category,supplier,estimated_amount,actual_amount,paid_amount,paid_at,due_at,notes,created_at&order=created_at.asc", { method: "GET" }, session.token),
  ]);

  if (!jobsResponse.ok) return NextResponse.json({ error: "Unable to load jobs" }, { status: 500 });
  const jobs = await jobsResponse.json() as Array<Record<string, any>>;
  const payments = paymentsResponse.ok ? await paymentsResponse.json() as Array<Record<string, any>> : [];
  const assignments = assignmentsResponse.ok ? await assignmentsResponse.json() as Array<Record<string, any>> : [];
  const people = peopleResponse.ok ? await peopleResponse.json() as Array<Record<string, any>> : [];
  const costs = costsResponse.ok ? await costsResponse.json() as Array<Record<string, any>> : [];
  const personById = new Map(people.map((s) => [s.id, s]));

  const paymentsByJob = new Map<string, Array<Record<string, any>>>();
  const paidByJob = new Map<string, number>();
  for (const payment of payments) {
    if (!paymentsByJob.has(payment.job_id)) paymentsByJob.set(payment.job_id, []);
    paymentsByJob.get(payment.job_id)!.push(payment);
    const countsAsPaid = payment.direction === "customer_in" && (payment.paid_at || payment.payment_type === "historical_xero_paid");
    if (countsAsPaid) paidByJob.set(payment.job_id, (paidByJob.get(payment.job_id) ?? 0) + Number(payment.amount ?? 0));
  }

  const assignmentsByJob = new Map<string, Array<Record<string, any>>>();
  for (const assignment of assignments) {
    if (!assignmentsByJob.has(assignment.job_id)) assignmentsByJob.set(assignment.job_id, []);
    const person = personById.get(assignment.subcontractor_id) || {};
    const agreed = Number(assignment.agreed_cost || 0);
    const paid = Number(assignment.paid_amount || 0);
    assignmentsByJob.get(assignment.job_id)!.push({
      ...assignment,
      personName: person.name || "Person",
      personCompany: person.company || "",
      relationshipType: person.relationship_type || "subcontractor",
      assignmentRole: assignment.assignment_role || "subcontractor",
      agreedCost: agreed,
      paidAmount: paid,
      outstanding: Math.max(0, agreed - paid),
    });
  }

  const commissionsByJob = new Map<string, Array<Record<string, any>>>();
  for (const cost of costs) {
    if (!commissionsByJob.has(cost.job_id)) commissionsByJob.set(cost.job_id, []);
    const agreed = Number(cost.actual_amount ?? cost.estimated_amount ?? 0);
    const paid = Number(cost.paid_amount || 0);
    commissionsByJob.get(cost.job_id)!.push({ ...cost, agreedAmount: agreed, paidAmount: paid, outstanding: Math.max(0, agreed - paid) });
  }

  const mapped = jobs.map((job) => {
    const customer = job.mj_customers ?? {};
    const agreed = job.agreed_amount === null ? undefined : Number(job.agreed_amount);
    const quoted = job.quoted_amount === null ? undefined : Number(job.quoted_amount);
    const paid = paidByJob.get(job.id) ?? 0;
    const value = agreed ?? quoted ?? 0;
    const placeholder = String(job.internal_notes || "").startsWith("Historical placeholder created for backfill.");
    const jobPayments = paymentsByJob.get(job.id) || [];
    const customerPayments = jobPayments.filter((p) => p.direction === "customer_in");
    const jobAssignments = assignmentsByJob.get(job.id) || [];
    const commissions = commissionsByJob.get(job.id) || [];
    const subAgreed = jobAssignments.filter((a) => a.relationshipType !== "employee").reduce((sum, a) => sum + Number(a.agreedCost || 0), 0);
    const subPaid = jobAssignments.filter((a) => a.relationshipType !== "employee").reduce((sum, a) => sum + Number(a.paidAmount || 0), 0);
    const commissionAgreed = commissions.reduce((sum, c) => sum + Number(c.agreedAmount || 0), 0);
    const commissionPaid = commissions.reduce((sum, c) => sum + Number(c.paidAmount || 0), 0);
    const jobTypes = Array.isArray(job.job_types) && job.job_types.length ? job.job_types : [job.job_type].filter(Boolean);

    return {
      id: job.id,
      reference: job.reference,
      sequenceNumber: job.sequence_number,
      customerId: job.customer_id,
      firstName: customer.first_name || "",
      lastName: customer.last_name || "",
      customerName: [customer.first_name, customer.last_name].filter(Boolean).join(" "),
      customerAddressLine1: customer.address_line_1 || "",
      customerAddressLine2: customer.address_line_2 || "",
      customerCity: customer.city || "",
      customerPostcode: customer.postcode || "",
      siteAddressLine1: job.site_address_line_1 || "",
      siteAddressLine2: job.site_address_line_2 || "",
      siteCity: job.site_city || "",
      sitePostcode: job.site_postcode || "",
      address: [job.site_address_line_1 || customer.address_line_1, job.site_address_line_2 || customer.address_line_2, job.site_city || customer.city].filter(Boolean).join(", "),
      postcode: job.site_postcode || customer.postcode || "",
      phone: customer.phone || "",
      email: customer.email || "",
      jobType: job.job_type,
      jobTypes,
      status: job.status,
      manager: job.manager,
      source: job.enquiry_source,
      enquiryAt: job.enquiry_at,
      finishes: job.finishes ?? [],
      colour: job.colour ?? undefined,
      dimensions: job.dimensions ?? undefined,
      material: job.material ?? undefined,
      customerRequirements: job.customer_requirements ?? undefined,
      internalNotes: job.internal_notes ?? undefined,
      isPlaceholder: placeholder,
      siteVisitRequired: job.site_visit_required,
      siteVisitAt: job.site_visit_at ?? undefined,
      siteVisitCompletedAt: job.site_visit_completed_at ?? undefined,
      preliminaryEstimate: job.preliminary_estimate === null ? undefined : Number(job.preliminary_estimate),
      preliminaryEstimateSentAt: job.preliminary_estimate_sent_at ?? undefined,
      quotedAmount: quoted,
      quoteSentAt: job.quote_sent_at ?? undefined,
      agreedAmount: agreed,
      paymentMethod: job.payment_method ?? undefined,
      nextAction: job.next_action ?? undefined,
      nextActionAt: job.next_action_at ?? undefined,
      nextActionAssignee: job.next_action_assignee ?? undefined,
      scheduledAt: job.scheduled_at ?? undefined,
      expectedCompletionAt: job.expected_completion_at ?? undefined,
      completedAt: job.completed_at ?? undefined,
      balanceOutstanding: Math.max(0, value - paid),
      amountPaid: paid,
      customerPayments,
      workforceAssignments: jobAssignments,
      subcontractorAgreed: subAgreed,
      subcontractorPaid: subPaid,
      subcontractorOutstanding: Math.max(0, subAgreed - subPaid),
      commissions,
      commissionAgreed,
      commissionPaid,
      commissionOutstanding: Math.max(0, commissionAgreed - commissionPaid),
      materialsOrdered: job.materials_ordered,
      archivedAt: job.archived_at ?? undefined,
      createdAt: job.created_at,
      updatedAt: job.updated_at,
    };
  });

  return NextResponse.json({ jobs: mapped, people, admin: session.admin });
}

export async function POST(request: Request) {
  const session = await requireAdminToken();
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  try {
    const body = await request.json() as Record<string, any>;
    const historicalSequence = body.historicalSequenceNumber ? Number(body.historicalSequenceNumber) : null;
    if (historicalSequence !== null) {
      if (!Number.isInteger(historicalSequence) || historicalSequence < 1 || historicalSequence > 18) {
        return NextResponse.json({ error: "Historical MJ reference must be between MJ001 and MJ018." }, { status: 400 });
      }
      const refCheck = await supabaseRequest(`/rest/v1/mj_jobs?sequence_number=eq.${historicalSequence}&select=reference&limit=1`, { method: "GET" }, session.token);
      const existingRefs = refCheck.ok ? await refCheck.json() as Array<{ reference: string }> : [];
      if (existingRefs.length) return NextResponse.json({ error: `${existingRefs[0].reference} already exists.` }, { status: 409 });
    }

    let customerId = body.existingCustomerId as string | undefined;
    if (!customerId) {
      if (!body.firstName) return NextResponse.json({ error: "Customer first name is required" }, { status: 400 });
      const email = normaliseEmail(body.email), phone = normalisePhone(body.phone);
      if (email || phone) {
        const existingResponse = await supabaseRequest("/rest/v1/mj_customers?select=id,first_name,last_name,email,phone,postcode&order=updated_at.desc", { method: "GET" }, session.token);
        if (existingResponse.ok) {
          const existing = await existingResponse.json() as Array<Record<string, any>>;
          const duplicates = existing.filter((customer) => (email && normaliseEmail(customer.email) === email) || (phone && normalisePhone(customer.phone) === phone));
          if (duplicates.length) return NextResponse.json({ error: "Possible existing customer found. Select the existing customer instead of creating a duplicate.", duplicates: duplicates.map((customer) => ({ id: customer.id, name: [customer.first_name, customer.last_name].filter(Boolean).join(" "), email: customer.email, phone: customer.phone, postcode: customer.postcode })) }, { status: 409 });
        }
      }
      const customerResponse = await supabaseRequest("/rest/v1/mj_customers?select=id", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ first_name: body.firstName, last_name: body.lastName || null, phone: body.phone || null, email: body.email || null, address_line_1: body.addressLine1 || null, address_line_2: body.addressLine2 || null, city: body.city || null, postcode: body.postcode || null }) }, session.token);
      if (!customerResponse.ok) return NextResponse.json({ error: "Unable to create customer" }, { status: 500 });
      const customers = await customerResponse.json() as Array<{ id: string }>;
      customerId = customers[0]?.id;
    }
    if (!customerId) return NextResponse.json({ error: "Customer could not be resolved" }, { status: 500 });

    const visitStatus = body.siteVisitRequired ? (body.siteVisitAt ? "booked" : "required") : "not_required";
    const status = body.siteVisitRequired ? (body.siteVisitAt ? "site_visit_booked" : "site_visit_required") : "new_enquiry";
    const jobTypes = Array.isArray(body.jobTypes) && body.jobTypes.length ? body.jobTypes : [body.jobType].filter(Boolean);
    const payload: Record<string, unknown> = {
      customer_id: customerId,
      site_address_line_1: body.siteAddressLine1 || null,
      site_address_line_2: body.siteAddressLine2 || null,
      site_city: body.siteCity || null,
      site_postcode: body.sitePostcode || null,
      job_type: jobTypes[0] || body.jobType || "Other",
      job_types: jobTypes,
      status,
      manager: body.manager,
      enquiry_source: body.source || "Other",
      enquiry_at: body.enquiryAt || new Date().toISOString(),
      finishes: Array.isArray(body.finishes) ? body.finishes : [],
      colour: body.colour || null,
      dimensions: body.dimensions || null,
      material: body.material || null,
      customer_requirements: body.customerRequirements || null,
      internal_notes: body.internalNotes || null,
      site_visit_required: Boolean(body.siteVisitRequired),
      site_visit_status: visitStatus,
      site_visit_at: body.siteVisitAt || null,
      preliminary_estimate: asNumber(body.preliminaryEstimate),
      quoted_amount: asNumber(body.quotedAmount),
      payment_method: body.paymentMethod || null,
      next_action: body.nextAction || null,
      next_action_at: body.nextActionAt || null,
      next_action_assignee: body.nextActionAssignee || body.manager || null,
    };
    if (historicalSequence !== null) payload.sequence_number = historicalSequence;

    const jobResponse = await supabaseRequest("/rest/v1/mj_jobs?select=id,reference", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(payload) }, session.token);
    if (!jobResponse.ok) {
      const detail = await jobResponse.text();
      return NextResponse.json({ error: "Unable to create job", detail }, { status: 500 });
    }
    const jobs = await jobResponse.json() as Array<{ id: string; reference: string }>;
    return NextResponse.json({ job: jobs[0] }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create job" }, { status: 500 });
  }
}
