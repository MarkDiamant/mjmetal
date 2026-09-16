"use client";

import { usePathname } from "next/navigation";

export default function AdminBrandBar() {
  const pathname = usePathname();
  const isQuote = pathname.includes("/quote/") || pathname.includes("/quote-preview");
  if (isQuote) return null;

  if (pathname === "/admin") {
    return <div className="border-b border-black/10 bg-white print:hidden"><div className="mx-auto flex max-w-[1500px] justify-end gap-2 px-5 py-2 lg:px-8"><a href="/admin/archive" className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-bold">Archive</a><a href="/admin/integrations" className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-bold">Integrations</a></div></div>;
  }

  return (
    <div className="border-b border-black/10 bg-white print:hidden">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-5 py-3 lg:px-8">
        <a href="/admin" className="inline-flex items-center gap-3">
          <img src="/images/logo.png" alt="M&J Metal" className="h-12 w-auto object-contain" />
          <div><p className="text-xs font-black uppercase tracking-[0.16em] text-[#e66a24]">M&J Metal</p><p className="text-sm font-bold text-black/55">CRM & Job Management</p></div>
        </a>
        <div className="flex gap-2"><a href="/admin/archive" className="rounded-lg border border-black/10 px-3 py-2 text-xs font-bold">Archive</a><a href="/admin/integrations" className="rounded-lg border border-black/10 px-3 py-2 text-xs font-bold">Integrations</a></div>
      </div>
    </div>
  );
}
