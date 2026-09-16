import type { Metadata } from "next";
import AdminBrandBar from "@/components/admin/AdminBrandBar";

export const metadata: Metadata = {
  title: "M&J Metal Admin",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminBrandBar />
      {children}
      <footer className="border-t border-black/10 bg-white px-5 py-5 text-center text-xs text-black/50 print:hidden">
        <a href="https://diamantsolutions.co.uk" target="_blank" rel="noopener noreferrer" className="inline-flex flex-col items-center gap-1 transition hover:opacity-75">
          <span className="font-bold text-black/60">Built by <strong>Diamant Solutions</strong></span>
          <span>Websites • CRM Systems • Direction</span>
        </a>
      </footer>
    </>
  );
}
