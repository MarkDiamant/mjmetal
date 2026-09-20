"use client";
import {useCallback,useEffect,useState} from "react";

type AccessState={blocked?:boolean;reason?:"payment"|"account"|"signed_out";message?:string;businessName?:string;billing?:{interval?:string;resumeUrl?:string};error?:boolean};

export default function BillingAccessGate({children}:{children:React.ReactNode}){
  const [state,setState]=useState<AccessState>({blocked:false});
  const check=useCallback(()=>{fetch("/api/admin/billing-access",{cache:"no-store"}).then(async r=>{
    const body=await r.json().catch(()=>({}));
    if(r.status===401){window.location.href="/admin/login";return;}
    if(r.ok)setState(body);else if(body.reason==="payment")setState({...body,blocked:true,error:false});else setState({error:true,reason:body.reason,message:body.message||"We couldn’t open your CRM just now. Please try again."});
  }).catch(()=>setState({error:true,message:"We couldn’t open your CRM just now. Please try again."}));},[]);
  useEffect(()=>{check();},[check]);
  if(state.error)return <main className="min-h-[calc(100vh-120px)] bg-[#e7e7e4] px-5 py-16"><div className="mx-auto max-w-lg rounded-3xl border border-black/10 bg-white p-7 text-center shadow-xl"><h1 className="text-2xl font-black">{state.reason==="signed_out"?"Please sign in again":"We couldn’t open your CRM"}</h1><p className="mt-3 text-sm leading-6 text-black/60">{state.message||"We could not load your account just now. This is not a payment block. Please try again. If it continues, contact Diamant Solutions."}</p><button onClick={check} className="mt-6 rounded-xl bg-black px-5 py-3 text-sm font-black text-white">Try again</button></div></main>;
  if(!state.error&&!state.blocked)return <>{children}</>;
  const interval=state.billing?.interval==="annual"?"annual":"monthly";
  return <main className="fixed inset-0 z-[100] bg-black/30 px-5 py-16 backdrop-blur-[2px] backdrop-grayscale"><div className="mx-auto max-w-lg rounded-3xl border border-black/10 bg-white p-7 text-center shadow-xl"><h1 className="text-2xl font-black">Payment needed to continue</h1><p className="mt-3 text-sm leading-6 text-black/60">We couldn't collect the {interval} subscription payment for {state.businessName||"your account"}. Update your payment details or complete the payment to restore access.</p>{state.billing?.resumeUrl?<a href={state.billing.resumeUrl} className="mt-6 inline-block rounded-xl bg-black px-5 py-3 text-sm font-black text-white">Update payment and restore access</a>:<p className="mt-6 rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-900">We could not open the payment page automatically. Please contact Diamant Solutions so we can restore your access.</p>}</div></main>;
}