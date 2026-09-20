"use client";
import {useCallback,useEffect,useState} from "react";

type AccessState={blocked?:boolean;reason?:"payment"|"account"|"signed_out";message?:string;businessName?:string;billing?:{interval?:string;resumeUrl?:string};error?:boolean};

export default function BillingAccessGate({children}:{children:React.ReactNode}){
  const [state,setState]=useState<AccessState|null>(null);
  const check=useCallback(()=>{setState(null);fetch("/api/admin/billing-access",{cache:"no-store"}).then(async r=>{
    const body=await r.json().catch(()=>({}));
    if(r.status===401){window.location.href="/admin/login";return;}
    if(r.ok)setState(body);else setState({error:true,message:body.message||"We couldn't check your account just now."});
  }).catch(()=>setState({error:true,message:"We couldn't check your account just now. Please try again."}));},[]);
  useEffect(()=>{check();},[check]);
  if(!state)return <main className="min-h-[60vh] bg-[#f4f4f1] p-10 text-center"><p className="text-sm font-bold text-black/55">Opening your CRM...</p></main>;
  if(state.error)return <main className="min-h-[60vh] bg-[#e7e7e4] px-5 py-16"><div className="mx-auto max-w-lg rounded-3xl border border-black/10 bg-white p-7 text-center shadow-xl"><h1 className="text-2xl font-black">We couldn't open your CRM</h1><p className="mt-3 text-sm leading-6 text-black/60">{state.message||"There was a temporary problem checking your account. Your account has not been marked as unpaid. Please try again."}</p><button onClick={check} className="mt-6 rounded-xl bg-black px-5 py-3 text-sm font-black text-white">Try again</button></div></main>;
  if(!state.blocked)return <>{children}</>;
  const interval=state.billing?.interval==="annual"?"annual":"monthly";
  return <main className="fixed inset-0 z-[100] bg-black/30 px-5 py-16 backdrop-blur-[2px] backdrop-grayscale"><div className="mx-auto max-w-lg rounded-3xl border border-black/10 bg-white p-7 text-center shadow-xl"><h1 className="text-2xl font-black">Payment needed to continue</h1><p className="mt-3 text-sm leading-6 text-black/60">We couldn't collect the {interval} subscription payment for {state.businessName||"your account"}. Update your payment details or complete the payment to restore access.</p>{state.billing?.resumeUrl?<a href={state.billing.resumeUrl} className="mt-6 inline-block rounded-xl bg-black px-5 py-3 text-sm font-black text-white">Update payment and restore access</a>:<p className="mt-6 rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-900">Please contact Diamant Solutions and we'll help restore your access.</p>}</div></main>;
}