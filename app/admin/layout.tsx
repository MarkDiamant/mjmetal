import type { Metadata } from "next";
import AdminBrandBar from "@/components/admin/AdminBrandBar";
import DiamantCredit from "@/components/admin/DiamantCredit";
import BillingAccessGate from "@/components/admin/BillingAccessGate";

export const metadata: Metadata = {
  title: "CRM",
  manifest: "/manifest.webmanifest",
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
      <BillingAccessGate>{children}</BillingAccessGate>
      <footer className="border-t border-black/10 bg-white px-4 py-0.5 text-center text-[9px] leading-none text-black/40 print:hidden">
        <DiamantCredit />
      </footer>
    </>
  );
}
