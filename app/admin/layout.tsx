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
      <footer className="border-t border-white/10 bg-[#071426] px-4 py-4 text-center text-white/75 print:hidden">
        <DiamantCredit />
      </footer>
    </>
  );
}
