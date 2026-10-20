"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

function money(v: any) { return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(Number(v || 0)); }

export default function CustomerHistoryPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [editing,setEditing]=useState(false),[saving,setSaving]=useState(false),[saveMessage,setSaveMessage]=useState("");
  const [firstName,setFirstName]=useState(""),[lastName,setLastName]=useState("");

  useEffect(() => {
    fetch(`/api/admin/customers/${encodeURIComponent(id)}`, { cache: "no-store" }).then(async (response) => {
      if (response.status === 401) { window.location.href = "/admin/login"; return; }
      const body = await response.json().catch(() => ({}));
      if (!response.ok) setError(body.error || "Unable to load customer"); else {setData(body);setFirstName(body.customer?.first_name||"");setLastName(body.customer?.last_name||"");}
    });
  }, [id]);

  async function saveCustomer(){if(saving)return;setSaving(true);setSaveMessage("");try{const response=await fetch(`/api/admin/customers/${encodeURIComponent(id)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({first_name:firstName,last_name:lastName})});const body=await response.json().catch(()=>({}));if(!response.ok)throw new Error(body.error||"Customer name could not be saved");setData((previous:any)=>({...previous,customer:body.customer}));setEditing(false);setSaveMessage("Customer name saved successfully");}catch(error){setSaveMessage(error instanceof Error?error.message:"Save failed");}finally{setSaving(false);}}
  const totals = useMemo(() => {
    if (!data) return { quoted: 0, agreed: 0, paid: 0 };
    const quoted = data.jobs.reduce((s:number,j:any)=>s+Number(j.quoted_amount||0),0);
    const agreed = data.jobs.reduce((s:number,j:any)=>s+Number(j.agreed_amount||0),0);
    const paid = data.payments.filter((p:any)=>p.direction==="customer_in"&&p.paid_at).reduce((s:number,p:any)=>s+Number(p.amount||0),0);
    return { quoted, agreed, paid };
  }, [data]);

  if (error) return <main className="p-8">{error}</main>;
  if (!data) return <main className="p-8">Loading customer history...</main>;
  const c = data.customer;
  const name = [c.first_name, c.last_name].filter(Boolean).join(" ");

  return <main className="min-h-screen bg-[#f5f5f2] px-5 py-8 text-[#141414]"><div className="mx-auto max-w-6xl">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#e66a24]">Customer history</p><h1 className="mt-1 text-3xl font-black">{name}</h1><button type="button" onClick={()=>{setEditing(!editing);setSaveMessage("");}} className="mt-2 rounded-lg border border-black/15 bg-white px-3 py-1.5 text-sm font-bold">Edit customer name</button>{editing&&<div className="mt-3 flex flex-wrap items-end gap-2"><label className="text-sm">First name<input className="block rounded-lg border border-black/20 p-2" value={firstName} onChange={e=>setFirstName(e.target.value)}/></label><label className="text-sm">Last name<input className="block rounded-lg border border-black/20 p-2" value={lastName} onChange={e=>setLastName(e.target.value)}/></label><button type="button" disabled={saving||!firstName.trim()} onClick={()=>void saveCustomer()} className="rounded-lg bg-black px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{saving?"Saving...":"Save customer"}</button></div>}{saveMessage&&<p role="status" className="mt-2 text-sm font-semibold">{saveMessage}</p>}<p className="mt-2 text-sm text-black/55">{[c.phone,c.email,c.postcode].filter(Boolean).join(" • ")}</p></div><a href="/admin" className="rounded-xl border border-black/15 bg-white px-4 py-2.5 text-sm font-bold">Back to CRM</a></div>
    <section className="mt-6 grid gap-3 sm:grid-cols-3"><Stat label="Jobs" value={String(data.jobs.length)} /><Stat label="Agreed value" value={money(totals.agreed || totals.quoted)} /><Stat label="Payments received" value={money(totals.paid)} /></section>
    <section className="mt-6 rounded-2xl border border-black/10 bg-white p-5"><h2 className="text-lg font-black">Jobs</h2><div className="mt-4 space-y-3">{data.jobs.map((j:any)=><a key={j.id} href={`/admin/jobs/${j.reference}`} className="block rounded-xl border border-black/10 p-4 hover:bg-[#fffaf6]"><div className="flex flex-wrap justify-between gap-3"><div><b className="text-[#e66a24]">{j.reference}</b><span className="ml-3 font-bold">{j.job_type}</span><p className="mt-1 text-xs text-black/45">{[j.site_address_line_1,j.site_postcode].filter(Boolean).join(" • ")}</p></div><div className="text-right"><b>{money(j.agreed_amount ?? j.quoted_amount)}</b><p className="text-xs text-black/45">{String(j.status).replaceAll("_"," ")}</p></div></div></a>)}{data.jobs.length===0&&<p className="text-sm text-black/45">No jobs.</p>}</div></section>
    <section className="mt-5 rounded-2xl border border-black/10 bg-white p-5"><h2 className="text-lg font-black">Recent activity across all jobs</h2><div className="mt-4 space-y-2">{data.activities.slice(0,50).map((a:any)=><div key={a.id} className="rounded-xl bg-[#f5f5f2] p-3 text-sm"><div className="flex justify-between gap-3"><b>{a.summary}</b><span className="text-xs text-black/45">{new Date(a.occurred_at).toLocaleString("en-GB")}</span></div>{a.details&&<p className="mt-1 text-black/60">{a.details}</p>}</div>)}{data.activities.length===0&&<p className="text-sm text-black/45">No activity yet.</p>}</div></section>
  </div></main>;
}

function Stat({label,value}:{label:string;value:string}) { return <div className="rounded-2xl border border-black/10 bg-white p-5"><p className="text-sm font-semibold text-black/45">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div>; }
