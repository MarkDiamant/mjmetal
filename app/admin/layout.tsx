import type { Metadata } from "next";
import AdminBrandBar from "@/components/admin/AdminBrandBar";
import AdminPrimaryNav from "@/components/admin/AdminPrimaryNav";
import DiamantCredit from "@/components/admin/DiamantCredit";
import BillingAccessGate from "@/components/admin/BillingAccessGate";

export const metadata: Metadata = {
  title: "Business Management Software",
  manifest: "/manifest.webmanifest",
  applicationName: "M&J Metal Business Software",
  appleWebApp: { capable: true, title: "M&J", statusBarStyle: "default" },
  alternates: { canonical: "https://mjmetal.diamantsolutions.co.uk/admin" },
  robots: {index:false,follow:false,nocache:true,googleBot:{index:false,follow:false,noimageindex:true}},
  openGraph: { title: "M&J Metal Business Software", url: "https://mjmetal.diamantsolutions.co.uk/admin" },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>
    <AdminBrandBar />
    <AdminPrimaryNav />
    <BillingAccessGate>{children}</BillingAccessGate>
    <footer className="border-t border-black/10 bg-white px-4 py-2 text-center text-black/40 print:hidden"><DiamantCredit /></footer>
  </>;
}
