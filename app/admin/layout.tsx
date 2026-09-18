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
        <a href="https://diamantsolutions.co.uk" target="_blank" rel="noopener noreferrer" className="builtBy"><span className="builtByLine"><span>Built by</span><img src="https://www.samcerts.co.uk/diamant-solutions-logo.svg" alt="Diamant Solutions"/></span><span className="builtByTag">Websites • CRM Systems • Direction</span><strong className="builtByCta">Want something built?</strong></a>
      </footer>
    </>
  );
}
