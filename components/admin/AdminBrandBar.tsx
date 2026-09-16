"use client";

import { usePathname } from "next/navigation";

export default function AdminBrandBar() {
  const pathname = usePathname();
  const hide = pathname === "/admin" || pathname.includes("/quote/") || pathname.includes("/quote-preview");
  if (hide) return null;

  return (
    <div className="border-b border-black/10 bg-white print:hidden">
      <div className="mx-auto flex max-w-[1500px] items-center px-5 py-3 lg:px-8">
        <a href="/admin" className="inline-flex items-center gap-3">
          <img src="/images/logo.png" alt="M&J Metal" className="h-12 w-auto object-contain" />
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#e66a24]">M&J Metal</p>
            <p className="text-sm font-bold text-black/55">CRM & Job Management</p>
          </div>
        </a>
      </div>
    </div>
  );
}
