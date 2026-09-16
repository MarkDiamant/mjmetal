"use client";

import { useState } from "react";
import { ALL_STATUSES, FINISH_TYPES } from "@/lib/crm/constants";

const tabs = ["Overview", "Activity", "Quote", "Costs & Payments", "Files", "Subcontractors"] as const;
type Tab = (typeof tabs)[number];

export default function JobDetail({ reference }: { reference: string }) {
  const [tab, setTab] = useState<Tab>("Overview");

  return (
    <main className="min-h-screen bg-[#f5f5f2] text-[#141414]">
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <div className="flex items-center gap-4">
            <a href="/admin" className="rounded-lg border border-black/15 px-3 py-2 text-sm font-bold">Back</a>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#e66a24]">{reference}</p>
              <h1 className="text-2xl font-black">Example Customer · Fencing</h1>
              <p className="mt-1 text-sm text-black/50">North West London · Managed by Jonathan</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="rounded-xl border border-black/15 bg-white px-4 py-2.5 text-sm font-bold">Log activity</button>
            <button className="rounded-xl bg-[#e66a24] px-4 py-2.5 text-sm font-black text-white">Create quote</button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-5 py-6 lg:px-8">
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Summary label="Status"><select className="w-full bg-transparent font-black outline-none">{ALL_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Summary>
          <Summary label="Agreed value"><span className="text-2xl font-black">£TBC</span></Summary>
          <Summary label="Balance"><span className="text-2xl font-black">£TBC</span></Summary>
          <Summary label="Next action"><span className="font-black">Complete installation</span><span className="mt-1 block text-xs text-black/50">17 Sep, 09:00</span></Summary>
        </section>

        <nav className="mt-5 flex gap-1 overflow-x-auto rounded-2xl border border-black/10 bg-white p-1.5">
          {tabs.map((item) => (
            <button key={item} onClick={() => setTab(item)} className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold ${tab === item ? "bg-[#141414] text-white" : "text-black/60 hover:bg-black/5"}`}>{item}</button>
          ))}
        </nav>

        <div className="mt-5">
          {tab === "Overview" && <Overview />}
          {tab === "Activity" && <Activity />}
          {tab === "Quote" && <Quote />}
          {tab === "Costs & Payments" && <Costs />}
          {tab === "Files" && <Files />}
          {tab === "Subcontractors" && <Subcontractors />}
        </div>
      </div>
    </main>
  );
}

function Summary({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"><p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-black/45">{label}</p>{children}</div>;
}

function Card({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-black/10 bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] ${className}`}><h2 className="mb-4 text-lg font-black">{title}</h2>{children}</section>;
}

function Input({ label, value = "" }: { label: string; value?: string }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.06em] text-black/45">{label}</span><input defaultValue={value} className="h-11 w-full rounded-xl border border-black/15 px-3 outline-none focus:border-[#e66a24]" /></label>;
}

function Overview() {
  return (
    <div className="grid gap-5 xl:grid-cols-3">
      <Card title="Customer" className="xl:col-span-1">
        <div className="space-y-3"><Input label="First name" value="Example" /><Input label="Surname" value="Customer" /><Input label="Phone" /><Input label="Email" /><Input label="Site address" value="North West London" /><Input label="Postcode" value="NW11" /></div>
        <button className="mt-4 text-sm font-black text-[#e66a24]">View customer history</button>
      </Card>
      <Card title="Job details" className="xl:col-span-2">
        <div className="grid gap-4 md:grid-cols-2"><Input label="Job type" value="Fencing" /><Input label="Managed by" value="Jonathan" /><Input label="Dimensions" value="40m" /><Input label="Material" value="Mild steel" /><Input label="Colour / RAL" value="Black" /><Input label="Enquiry source" value="WhatsApp" /></div>
        <div className="mt-5"><p className="mb-2 text-xs font-bold uppercase tracking-[0.06em] text-black/45">Finish</p><div className="flex flex-wrap gap-2">{FINISH_TYPES.slice(0, 6).map((finish) => <label key={finish} className="rounded-full border border-black/15 px-3 py-2 text-xs font-bold"><input type="checkbox" className="mr-2" defaultChecked={finish === "Galvanised" || finish === "Powder coated"} />{finish}</label>)}</div></div>
        <label className="mt-5 block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.06em] text-black/45">Customer requirements</span><textarea className="min-h-28 w-full rounded-xl border border-black/15 p-3" defaultValue="40m palisade fencing including 3 pedestrian gates and a double-leaf swing driveway gate." /></label>
        <label className="mt-4 block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.06em] text-black/45">Internal notes</span><textarea className="min-h-28 w-full rounded-xl border border-black/15 p-3" placeholder="Pricing, measurements, fabricator notes and anything customer should not see." /></label>
      </Card>
      <Card title="Site visit">
        <div className="space-y-3"><Input label="Required" value="Yes" /><Input label="Booked" value="11 Sep 2026, 11:00" /><Input label="Completed" value="11 Sep 2026, 12:10" /><Input label="Attended by" value="Jonathan" /></div>
      </Card>
      <Card title="Scheduling">
        <div className="space-y-3"><Input label="Installation date" /><Input label="Expected completion" /><Input label="Materials ordered" value="Yes" /><Input label="Fabricator / installer" /></div>
      </Card>
      <Card title="Next action">
        <Input label="Action" value="Complete installation and upload after photos" /><div className="mt-3"><Input label="Due date / time" value="17 Sep 2026, 09:00" /></div><div className="mt-3"><Input label="Assigned to" value="Jonathan" /></div>
      </Card>
    </div>
  );
}

function Activity() {
  return <Card title="Activity timeline"><div className="space-y-3">{[
    ["16 Sep, 12:00", "Jonathan", "Job updated", "Materials confirmed on site."],
    ["15 Sep, 16:20", "Mark", "WhatsApp follow-up", "Customer confirmed access arrangements."],
    ["11 Sep, 12:10", "Jonathan", "Site visit completed", "Measurements and site photos added."],
  ].map(([date, actor, title, note]) => <div key={date + title} className="grid gap-1 rounded-xl border border-black/10 p-4 sm:grid-cols-[150px_110px_1fr]"><span className="text-sm text-black/45">{date}</span><span className="text-sm font-black">{actor}</span><div><p className="font-bold">{title}</p><p className="mt-1 text-sm text-black/55">{note}</p></div></div>)}</div><button className="mt-4 rounded-xl bg-[#141414] px-4 py-2.5 text-sm font-black text-white">+ Log follow-up</button></Card>;
}

function Quote() {
  return <div className="grid gap-5 xl:grid-cols-3"><Card title="Quote builder" className="xl:col-span-2"><div className="grid gap-4 md:grid-cols-2"><Input label="Quote amount" /><Input label="Deposit required" /><Input label="Lead time" /><Input label="Valid until" /></div><label className="mt-4 block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.06em] text-black/45">Scope of works</span><textarea className="min-h-48 w-full rounded-xl border border-black/15 p-3" placeholder="AI-generated customer-facing scope will be editable here before PDF creation." /></label><div className="mt-4 flex flex-wrap gap-2"><button className="rounded-xl border border-black/15 px-4 py-2.5 text-sm font-bold">Generate wording with AI</button><button className="rounded-xl bg-[#e66a24] px-4 py-2.5 text-sm font-black text-white">Generate PDF</button></div></Card><Card title="Quote history"><p className="text-sm text-black/50">No quote versions yet.</p><p className="mt-4 text-xs leading-5 text-black/45">Each revision will keep its own PDF and sent date.</p></Card></div>;
}

function Costs() {
  return <div className="grid gap-5 xl:grid-cols-2"><Card title="Customer payments"><div className="grid gap-4 md:grid-cols-2"><Input label="Agreed price" /><Input label="Payment method" /><Input label="Deposit required" /><Input label="Deposit received" /><Input label="Final payment received" /><Input label="Balance outstanding" /></div><button className="mt-4 rounded-xl bg-[#141414] px-4 py-2.5 text-sm font-black text-white">+ Add payment</button></Card><Card title="Job costs and margin"><div className="grid gap-4 md:grid-cols-2"><Input label="Materials" /><Input label="Fabrication" /><Input label="Installation" /><Input label="Powder coat / galvanising" /><Input label="Transport" /><Input label="Other costs" /></div><div className="mt-5 rounded-xl bg-[#f5f5f2] p-4"><p className="text-sm text-black/45">Estimated gross profit</p><p className="mt-1 text-2xl font-black">£TBC</p></div></Card></div>;
}

function Files() {
  return <Card title="Photos & files"><div className="rounded-2xl border-2 border-dashed border-black/15 p-10 text-center"><p className="font-black">Drop photos, drawings or PDFs here</p><p className="mt-2 text-sm text-black/50">Before, survey, drawing, fabrication, installation and after categories will be available.</p><button className="mt-4 rounded-xl border border-black/15 px-4 py-2.5 text-sm font-bold">Choose files</button></div></Card>;
}

function Subcontractors() {
  return <div className="grid gap-5 xl:grid-cols-2"><Card title="Assigned subcontractors"><p className="text-sm text-black/50">No subcontractor assigned yet.</p><button className="mt-4 rounded-xl bg-[#141414] px-4 py-2.5 text-sm font-black text-white">+ Assign subcontractor</button></Card><Card title="Subcontractor payment"><div className="grid gap-4 md:grid-cols-2"><Input label="Agreed cost" /><Input label="Materials included" /><Input label="Amount paid" /><Input label="Payment method" /><Input label="Paid date / time" /><Input label="Balance due" /></div></Card></div>;
}
