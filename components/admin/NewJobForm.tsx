"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FINISH_TYPES, JOB_TYPES } from "@/lib/crm/constants";

const sources = ["WhatsApp", "Email", "Website", "Referral", "Existing customer", "Phone", "Other"];
type CustomerOption = { id:string; firstName:string; lastName:string; phone:string; email:string; addressLine1:string; addressLine2:string; city:string; postcode:string };

export default function NewJobForm() {
  const router = useRouter();
  const [finishes, setFinishes] = useState<string[]>([]);
  const [existingCustomer, setExistingCustomer] = useState(false);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [siteVisitRequired, setSiteVisitRequired] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/customers", { cache: "no-store" }).then(async (response) => {
      if (response.status === 401) { router.replace("/admin/login"); return; }
      if (response.ok) setCustomers((await response.json()).customers || []);
    });
  }, [router]);

  function toggleFinish(value: string) { setFinishes((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]); }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError("");
    const data = Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<string, string>;
    const payload = { ...data, finishes, existingCustomerId: existingCustomer ? selectedCustomerId : undefined, siteVisitRequired, preliminaryEstimate: data.preliminaryEstimate || null, quotedAmount: data.quotedAmount || null };
    const response = await fetch("/api/admin/jobs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (response.status === 401) { router.replace("/admin/login"); return; }
    const result = await response.json().catch(() => ({}));
    if (!response.ok) { setError(result.error || "Unable to create job"); setSaving(false); return; }
    router.push(`/admin/jobs/${result.job.reference}`); router.refresh();
  }

  const selected = customers.find((customer) => customer.id === selectedCustomerId);

  return <main className="min-h-screen bg-[#f5f5f2] text-[#141414]"><div className="mx-auto max-w-5xl px-5 py-7 lg:px-8"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#e66a24]">M&J Metal CRM</p><h1 className="mt-1 text-3xl font-black">New job</h1><p className="mt-2 text-sm text-black/55">The next MJ reference is allocated automatically when you create the job.</p></div><a href="/admin" className="rounded-xl border border-black/15 bg-white px-4 py-2.5 text-sm font-bold">Back</a></div>
    <form className="mt-6 space-y-5" onSubmit={submit}><Section title="Customer"><label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2 lg:col-span-3"><input type="checkbox" checked={existingCustomer} onChange={(e) => { setExistingCustomer(e.target.checked); if (!e.target.checked) setSelectedCustomerId(""); }} />Repeat customer, select existing record</label>{existingCustomer && <Field label="Existing customer" wide><select value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} required><option value="">Select customer</option>{customers.map((c) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName} {c.postcode ? `• ${c.postcode}` : ""}</option>)}</select></Field>}{existingCustomer && selected ? <div className="sm:col-span-2 lg:col-span-3 rounded-xl bg-[#f5f5f2] p-4 text-sm"><b>{selected.firstName} {selected.lastName}</b><br />{selected.addressLine1} {selected.addressLine2} {selected.city} {selected.postcode}<br />{selected.phone} {selected.email}</div> : !existingCustomer && <><Field label="First name"><input name="firstName" required /></Field><Field label="Surname"><input name="lastName" /></Field><Field label="Phone"><input name="phone" inputMode="tel" /></Field><Field label="Email"><input name="email" type="email" /></Field><Field label="Address line 1"><input name="addressLine1" /></Field><Field label="Address line 2"><input name="addressLine2" /></Field><Field label="City"><input name="city" defaultValue="London" /></Field><Field label="Postcode"><input name="postcode" /></Field></>}</Section>
    <Section title="Job"><Field label="Job type"><select name="jobType">{JOB_TYPES.map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Managed by"><select name="manager"><option value="MD">Mark</option><option value="JB">Jonathan</option></select></Field><Field label="Enquiry source"><select name="source">{sources.map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Enquiry date / time"><input name="enquiryAt" type="datetime-local" /></Field><Field label="Approx dimensions"><input name="dimensions" placeholder="e.g. 3.8m wide x 1.2m high" /></Field><Field label="Material"><select name="material"><option>Mild steel</option><option>Stainless steel</option><option>Aluminium</option><option>Other</option></select></Field><Field label="Colour / RAL"><input name="colour" placeholder="e.g. Black / RAL 9005" /></Field><div className="sm:col-span-2 lg:col-span-3"><p className="mb-2 text-sm font-bold">Finish, choose all that apply</p><div className="flex flex-wrap gap-2">{FINISH_TYPES.map((item) => <button key={item} type="button" onClick={() => toggleFinish(item)} className={`rounded-full border px-3 py-2 text-xs font-bold ${finishes.includes(item) ? "border-[#e66a24] bg-[#fff1e8] text-[#b84b12]" : "border-black/15 bg-white"}`}>{item}</button>)}</div></div><Field label="Customer requirements" wide><textarea name="customerRequirements" rows={4} placeholder="What the customer wants, design, locks, access, special requirements..." /></Field><Field label="Internal job notes" wide><textarea name="internalNotes" rows={4} placeholder="Measurements, pricing thoughts, subcontractor notes, anything not customer-facing..." /></Field></Section>
    <Section title="Site visit and next action"><label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={siteVisitRequired} onChange={(e) => setSiteVisitRequired(e.target.checked)} />Site visit required</label>{siteVisitRequired && <Field label="Site visit date / time"><input name="siteVisitAt" type="datetime-local" /></Field>}<Field label="Next action"><input name="nextAction" placeholder="e.g. Call customer to arrange survey" /></Field><Field label="Next action date / time"><input name="nextActionAt" type="datetime-local" /></Field></Section>
    <Section title="Initial commercial details"><Field label="Preliminary estimate"><input name="preliminaryEstimate" type="number" min="0" step="0.01" placeholder="£" /></Field><Field label="Expected quote value"><input name="quotedAmount" type="number" min="0" step="0.01" placeholder="£" /></Field><Field label="Expected payment method"><select name="paymentMethod"><option>Bank transfer</option><option>Cash</option><option>Card</option><option>Other</option></select></Field></Section>
    {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}<div className="flex justify-end gap-3 pb-10"><button type="submit" disabled={saving || (existingCustomer && !selectedCustomerId)} className="rounded-xl bg-[#e66a24] px-5 py-3 text-sm font-black text-white disabled:opacity-50">{saving ? "Creating..." : "Create job"}</button></div></form></div></main>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"><h2 className="mb-4 text-lg font-black">{title}</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div></section>; }
function Field({ label, children, wide = false }: { label: string; children: React.ReactElement; wide?: boolean }) { return <label className={`block ${wide ? "sm:col-span-2 lg:col-span-3" : ""}`}><span className="mb-1.5 block text-sm font-bold">{label}</span><div className="[&>input]:h-11 [&>input]:w-full [&>input]:rounded-xl [&>input]:border [&>input]:border-black/15 [&>input]:px-3 [&>input]:outline-none [&>select]:h-11 [&>select]:w-full [&>select]:rounded-xl [&>select]:border [&>select]:border-black/15 [&>select]:bg-white [&>select]:px-3 [&>textarea]:w-full [&>textarea]:rounded-xl [&>textarea]:border [&>textarea]:border-black/15 [&>textarea]:p-3 [&>textarea]:outline-none">{children}</div></label>; }
