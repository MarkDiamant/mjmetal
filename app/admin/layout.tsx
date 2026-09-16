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
  return <><AdminBrandBar />{children}</>;
}
