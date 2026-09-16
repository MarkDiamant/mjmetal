"use client";

import { useState } from "react";
import { FINISH_TYPES, JOB_TYPES } from "@/lib/crm/constants";

const sources = ["WhatsApp", "Email", "Website", "Referral", "Existing customer", "Phone", "Other"];

export default function NewJobForm() {
  const [finishes, setFinishes] = useState<string[]>([]);
  const [existingCustomer, setExistingCustomer] = useState(false);
  const [siteVisitRequired, setSiteVisitRequired] = useState(false);

  function toggleFinish(value: string) {
    setFinishes((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  }

  return (
    <main className="min-h-screen bg-[#f5f5f2] text-[#141414]">
      <div className="mx-auto max-w-5xl px-5 py-7 lg:px-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#e66a24]">M&J Metal CRM</p>
            <h1 className="mt-1 text-3xl font-black">New job</h1>
            <p className="mt-2 text-sm text-black/55">The live system will allocate the next reference automatically after MJ018.</p>
          </div>
          <a href="/admin" className="rounded-xl border border-black/15 bg-white px-4 py-2.5 text-sm font-bold">Back</a>
        </div>

        <form className="mt-6 space-y-5" onSubmit={(event) => event.preventDefault()}>
          <Section title="Customer">
            <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2 lg:col-span-3">
              <input type="checkbox" checked={existingCustomer} onChange={(e) => setExistingCustomer(e.target.checked)} />
              Repeat customer, select existing record
            </label>
            {existingCustomer && <Field label="Existing customer"><select><option>Select customer</option></select></Field>}
            <Field label="First name"><input required /></Field>
            <Field label="Surname"><input /></Field>
            <Field label="Phone"><input inputMode="tel" /></Field>
            <Field label="Email"><input type="email" /></Field>
            <Field label="Address line 1"><input /></Field>
            <Field label="Address line 2"><input /></Field>
            <Field label="City"><input defaultValue="London" /></Field>
            <Field label="Postcode"><input /></Field>
          </Section>

          <Section title="Job">
            <Field label="Job type"><select>{JOB_TYPES.map((item) => <option key={item}>{item}</option>)}</select></Field>
            <Field label="Managed by"><select><option value="MD">Mark</option><option value="JB">Jonathan</option></select></Field>
            <Field label="Enquiry source"><select>{sources.map((item) => <option key={item}>{item}</option>)}</select></Field>
            <Field label="Enquiry date / time"><input type="datetime-local" /></Field>
            <Field label="Approx dimensions"><input placeholder="e.g. 3.8m wide x 1.2m high" /></Field>
            <Field label="Material"><select><option>Mild steel</option><option>Stainless steel</option><option>Aluminium</option><option>Other</option></select></Field>
            <Field label="Colour / RAL"><input placeholder="e.g. Black / RAL 9005" /></Field>
            <div className="sm:col-span-2 lg:col-span-3">
              <p className="mb-2 text-sm font-bold">Finish, choose all that apply</p>
              <div className="flex flex-wrap gap-2">
                {FINISH_TYPES.map((item) => (
                  <button key={item} type="button" onClick={() => toggleFinish(item)} className={`rounded-full border px-3 py-2 text-xs font-bold ${finishes.includes(item) ? "border-[#e66a24] bg-[#fff1e8] text-[#b84b12]" : "border-black/15 bg-white"}`}>
                    {item}
                  </button>
                ))}
              </div>
            </div>
            <Field label="Customer requirements" wide><textarea rows={4} placeholder="What the customer wants, design, locks, access, special requirements..." /></Field>
            <Field label="Internal job notes" wide><textarea rows={4} placeholder="Measurements, pricing thoughts, subcontractor notes, anything not customer-facing..." /></Field>
          </Section>

          <Section title="Site visit and next action">
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={siteVisitRequired} onChange={(e) => setSiteVisitRequired(e.target.checked)} />
              Site visit required
            </label>
            {siteVisitRequired && <Field label="Site visit date / time"><input type="datetime-local" /></Field>}
            <Field label="Next action"><input placeholder="e.g. Call customer to arrange survey" /></Field>
            <Field label="Next action date / time"><input type="datetime-local" /></Field>
          </Section>

          <Section title="Initial commercial details">
            <Field label="Preliminary estimate"><input type="number" min="0" step="0.01" placeholder="£" /></Field>
            <Field label="Expected quote value"><input type="number" min="0" step="0.01" placeholder="£" /></Field>
            <Field label="Expected payment method"><select><option>Bank transfer</option><option>Cash</option><option>Card</option><option>Other</option></select></Field>
          </Section>

          <div className="flex justify-end gap-3 pb-10">
            <button type="button" className="rounded-xl border border-black/15 bg-white px-5 py-3 text-sm font-bold">Save draft</button>
            <button type="submit" className="rounded-xl bg-[#e66a24] px-5 py-3 text-sm font-black text-white">Create job</button>
          </div>
        </form>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
      <h2 className="mb-4 text-lg font-black">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  );
}

function Field({ label, children, wide = false }: { label: string; children: React.ReactElement; wide?: boolean }) {
  return (
    <label className={`block ${wide ? "sm:col-span-2 lg:col-span-3" : ""}`}>
      <span className="mb-1.5 block text-sm font-bold">{label}</span>
      <div className="[&>input]:h-11 [&>input]:w-full [&>input]:rounded-xl [&>input]:border [&>input]:border-black/15 [&>input]:px-3 [&>input]:outline-none [&>select]:h-11 [&>select]:w-full [&>select]:rounded-xl [&>select]:border [&>select]:border-black/15 [&>select]:bg-white [&>select]:px-3 [&>textarea]:w-full [&>textarea]:rounded-xl [&>textarea]:border [&>textarea]:border-black/15 [&>textarea]:p-3 [&>textarea]:outline-none">
        {children}
      </div>
    </label>
  );
}
