"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { DEFAULT_CRM_CONFIG } from "@/lib/crm/config";
import DiamantCredit from "@/components/admin/DiamantCredit";

export default function AdminBrandBar() {
  const pathname = usePathname();
  const [config,setConfig]=useState(DEFAULT_CRM_CONFIG);
  useEffect(()=>{fetch("/api/admin/settings",{cache:"no-store"}).then(async r=>{if(r.ok){const b=await r.json();if(b.settings)setConfig(b.settings);}}).catch(()=>{});},[]);
  const isQuote = pathname.includes("/quote/") || pathname.includes("/quote-preview");
  if (isQuote) return null;

  if (pathname === "/admin") return null;

  return (
    <div className="sticky top-0 z-30 border-b border-white/10 bg-white text-[#141414] shadow-sm print:hidden">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5 lg:px-8">
        <a href="/admin" className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <img src={config.logoUrl} alt={config.businessName} className="h-10 w-auto shrink-0 object-contain sm:h-12" />
          <div className="min-w-0"><p className="text-xs font-black uppercase tracking-[0.12em] sm:tracking-[0.16em]" style={{color:config.accentColour}}>{config.businessName}</p><p className="truncate text-xs font-bold text-black/50 sm:text-sm">{config.systemName}</p><div className="mt-1"><DiamantCredit compact /></div></div>
        </a>
        <div className="flex w-full gap-2 sm:w-auto sm:shrink-0"><a href="/admin/archive" className="flex-1 rounded-lg border border-black/10 px-3 py-2 text-center text-xs font-bold text-black sm:flex-none">Archive</a><a href="/admin/integrations" className="flex-1 rounded-lg border border-black/10 px-3 py-2 text-center text-xs font-bold sm:flex-none">Integrations</a><a href="/admin/users" className="flex-1 rounded-lg border border-black/10 px-3 py-2 text-center text-xs font-bold sm:flex-none">Users</a><a href="/admin/settings" className="flex-1 rounded-lg border border-black/10 px-3 py-2 text-center text-xs font-bold sm:flex-none">Settings</a></div>
      </div>
    </div>
  );
}
