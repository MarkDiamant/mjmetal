import CrmDashboardV3 from "@/components/admin/CrmDashboardV3";
import SetupRequired from "@/components/admin/SetupRequired";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

  if (!configured) return <SetupRequired />;

  return <CrmDashboardV3 />;
}
