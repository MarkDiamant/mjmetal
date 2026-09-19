"use client";

import { usePathname } from "next/navigation";

export default function AdminBrandBar() {
  const pathname = usePathname();
  const isQuote = pathname.includes("/quote/") || pathname.includes("/quote-preview");
  if (isQuote) return null;

  if (pathname === "/admin") return null;

  return (
    <div className="border-b border-black/10 bg-white print:hidden">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5 lg:px-8">
        <a href="/admin" className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <img src="/images/logo.png" alt="M&J Metal" className="h-10 w-auto shrink-0 object-contain sm:h-12" />
          <div className="min-w-0"><p className="text-xs font-black uppercase tracking-[0.12em] text-[#e66a24] sm:tracking-[0.16em]">M&J Metal</p><p className="truncate text-xs font-bold text-black/55 sm:text-sm">CRM & Job Management</p></div>
        </a>
        <div className="flex w-full gap-2 sm:w-auto sm:shrink-0"><a href="/admin/archive" className="flex-1 rounded-lg border border-black/10 px-3 py-2 text-center text-xs font-bold sm:flex-none">Archive</a><a href="/admin/integrations" className="flex-1 rounded-lg border border-black/10 px-3 py-2 text-center text-xs font-bold sm:flex-none">Integrations</a></div>
      </div>
    </div>
  );
}
