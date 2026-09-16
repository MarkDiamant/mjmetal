"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FINISH_TYPES, JOB_TYPES } from "@/lib/crm/constants";

const sources = ["WhatsApp", "Email", "Website", "Referral", "Existing customer", "Phone", "Other"];
type CustomerOption = { id:string; firstName:string; lastName:string; phone:string; email:string; addressLine1:string; addressLine2:string; city:string; postcode:string };

const input = "h-11 w-full rounded-xl border border-black/15 bg-white px-3 outline-none focus:border-[#e66a24]";

function Field({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return <label className={wide ? "sm:col-span-2 lg:col-span-3" : ""}><span className="mb-1.5 block text-sm font-bold">{label}</span>{children}</label>;
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"><h2 className="mb-4 text-lg font-black">{title}</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div></section>;
}

export default function NewJobFormV2() {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [existingCustomer, setExistingCustomer] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [sameSite, setSameSite] = useState(true);
  const [finishes, setFinishes] = useState<string[]>([]);
  const [siteVisitRequired, setSiteVisitRequired] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [duplicates, setDuplicates] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/admin/customers", { cache: "no-store" }).then(async (response) => {
      if (response.status === 401) { router.replace("/admin/login"); return; }
      if (response.ok) setCustomers((await response.json()).customers || []);
    });
  }, [router]);

  const selected = useMemo(() => customers.find((c) => c.id === selectedCustomerId), [customers, selectedCustomerId]);
  function toggleFinish(value: string) { setFinishes((current) => current.includes(value) ? current.filter((x) => x !== value) : [...current, value]); }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setError(""); setDuplicates([]);
    const fd = new FormData(event.currentTarget);
    const raw = Object.fromEntries(fd.entries()) as Record<string, string>;

    const customerAddress = existingCustomer && selected ? {
      addressLine1: selected.addressLine1 || "", addressLine2: selected.addressLine2 || "", city: selected.city || "", postcode: selected.postcode || "",
    } : {
      addressLine1: raw.addressLine1 || "", addressLine2: raw.addressLine2 || "", city: raw.city || "", postcode: raw.postcode || "",
    };

    const payload = {
      ...raw,
      finishes,
      existingCustomerId: existingCustomer ? selectedCustomerId : undefined,
      siteVisitRequired,
      siteAddressLine1: sameSite ? customerAddress.addressLine1 : raw.siteAddressLine1 || null,
      siteAddressLine2: sameSite ? customerAddress.addressLine2 : raw.siteAddressLine2 || null,
      siteCity: sameSite ? customerAddress.city : raw.siteCity || null,
      sitePostcode: sameSite ? customerAddress.postcode : raw.sitePostcode || null,
      preliminaryEstimate: raw.preliminaryEstimate || null,
      quotedAmount: raw.quotedAmount || null,
    };

    const response = await fetch("/api/admin/jobs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (response.status === 401) { router.replace("/admin/login"); return; }
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(result.error || "Unable to create job");
      setDuplicates(result.duplicates || []);
      setSaving(false);
      return;
    }
    router.push(`/admin/jobs/${result.job.reference}`); router.refresh();
  }

  function useDuplicate(id: string) {
    setExistingCustomer(true); setSelectedCustomerId(id); setDuplicates([]); setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return <main className="min-h-screen bg-[#f5f5f2] text-[#141414]"><div className="mx-auto max-w-5xl px-5 py-7 lg:px-8">
    <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#e66a24]">M&J Metal CRM</p><h1 className="mt-1 text-3xl font-black">New job</h1><p className="mt-2 text-sm text-black/55">The next MJ reference is allocated only when the job is created.</p></div><a href="/admin" className="rounded-xl border border-black/15 bg-white px-4 py-2.5 text-sm font-bold">Back</a></div>

    <form className="mt-6 space-y-5" onSubmit={submit}>
      <Section title="Customer">
        <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2 lg:col-span-3"><input type="checkbox" checked={existingCustomer} onChange={(e) => { setExistingCustomer(e.target.checked); if (!e.target.checked) setSelectedCustomerId(""); }} />Repeat customer, select existing record</label>
        {existingCustomer ? <>
          <Field label="Existing customer" wide><select value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} required className={input}><option value="">Select customer</option>{customers.map((c) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}{c.postcode ? ` • ${c.postcode}` : ""}{c.phone ? ` • ${c.phone}` : ""}</option>)}</select></Field>
          {selected && <div className="rounded-xl bg-[#f5f5f2] p-4 text-sm sm:col-span-2 lg:col-span-3"><b>{selected.firstName} {selected.lastName}</b><br />{[selected.addressLine1, selected.addressLine2, selected.city, selected.postcode].filter(Boolean).join(", ")}<br />{[selected.phone, selected.email].filter(Boolean).join(" • ")}</div>}
        </> : <>
          <Field label="First name"><input name="firstName" required className={input} /></Field><Field label="Surname"><input name="lastName" className={input} /></Field><Field label="Phone"><input name="phone" inputMode="tel" className={input} /></Field><Field label="Email"><input name="email" type="email" className={input} /></Field><Field label="Address line 1"><input name="addressLine1" className={input} /></Field><Field label="Address line 2"><input name="addressLine2" className={input} /></Field><Field label="City"><input name="city" defaultValue="London" className={input} /></Field><Field label="Postcode"><input name="postcode" className={input} /></Field>
        </>}
      </Section>

      <Section title="Job site">
        <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2 lg:col-span-3"><input type="checkbox" checked={sameSite} onChange={(e) => setSameSite(e.target.checked)} />Site address is the same as the customer address</label>
        {!sameSite && <><Field label="Site address line 1"><input name="siteAddressLine1" className={input} required /></Field><Field label="Site address line 2"><input name="siteAddressLine2" className={input} /></Field><Field label="Site city"><input name="siteCity" defaultValue="London" className={input} /></Field><Field label="Site postcode"><input name="sitePostcode" className={input} /></Field></>}
      </Section>

      <Section title="Job">
        <Field label="Job type"><select name="jobType" className={input}>{JOB_TYPES.map((item) => <option key={item}>{item}</option>)}</select></Field>
        <Field label="Managed by"><select name="manager" className={input}><option value="MD">Mark</option><option value="JB">Jonathan</option></select></Field>
        <Field label="Enquiry source"><select name="source" className={input}>{sources.map((item) => <option key={item}>{item}</option>)}</select></Field>
        <Field label="Enquiry date / time"><input name="enquiryAt" type="datetime-local" className={input} /></Field>
        <Field label="Approx dimensions"><input name="dimensions" className={input} placeholder="e.g. 3.8m wide x 1.2m high" /></Field>
        <Field label="Material"><select name="material" className={input}><option>Mild steel</option><option>Stainless steel</option><option>Aluminium</option><option>Other</option></select></Field>
        <Field label="Colour / RAL"><input name="colour" className={input} placeholder="e.g. Black / RAL 9005" /></Field>
        <div className="sm:col-span-2 lg:col-span-3"><p className="mb-2 text-sm font-bold">Finish, choose all that apply</p><div className="flex flex-wrap gap-2">{FINISH_TYPES.map((item) => <button key={item} type="button" onClick={() => toggleFinish(item)} className={`rounded-full border px-3 py-2 text-xs font-bold ${finishes.includes(item) ? "border-[#e66a24] bg-[#fff1e8] text-[#b84b12]" : "border-black/15 bg-white"}`}>{item}</button>)}</div></div>
        <Field label="Customer requirements" wide><textarea name="customerRequirements" rows={4} className="w-full rounded-xl border border-black/15 p-3" /></Field>
        <Field label="Internal job notes" wide><textarea name="internalNotes" rows={4} className="w-full rounded-xl border border-black/15 p-3" /></Field>
      </Section>

      <Section title="Site visit and next action">
        <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={siteVisitRequired} onChange={(e) => setSiteVisitRequired(e.target.checked)} />Site visit required</label>
        {siteVisitRequired && <Field label="Booked / proposed date"><input name="siteVisitAt" type="datetime-local" className={input} /></Field>}
        <Field label="Next action"><input name="nextAction" className={input} placeholder="e.g. Call customer to arrange survey" /></Field>
        <Field label="Next action date / time"><input name="nextActionAt" type="datetime-local" className={input} /></Field>
      </Section>

      <Section title="Initial commercial details">
        <Field label="Preliminary estimate"><input name="preliminaryEstimate" type="number" min="0" step="0.01" className={input} /></Field>
        <Field label="Expected quote value"><input name="quotedAmount" type="number" min="0" step="0.01" className={input} /></Field>
        <Field label="Expected payment method"><select name="paymentMethod" className={input}><option>Bank transfer</option><option>Cash</option><option>Card</option><option>Other</option></select></Field>
      </Section>

      {error && <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700"><p>{error}</p>{duplicates.length > 0 && <div className="mt-3 space-y-2">{duplicates.map((d) => <button key={d.id} type="button" onClick={() => useDuplicate(d.id)} className="block w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-left text-black"><b>Use {d.name}</b><span className="block text-xs text-black/55">{[d.phone, d.email, d.postcode].filter(Boolean).join(" • ")}</span></button>)}</div>}</div>}
      <div className="flex justify-end gap-3 pb-10"><button type="submit" disabled={saving || (existingCustomer && !selectedCustomerId)} className="rounded-xl bg-[#e66a24] px-5 py-3 text-sm font-black text-white disabled:opacity-50">{saving ? "Creating..." : "Create job"}</button></div>
    </form>
  </div></main>;
}
