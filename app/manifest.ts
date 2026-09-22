import type { MetadataRoute } from "next";
import { M_AND_J_TENANT_CONFIG } from "@/lib/crm/config";

export default function manifest(): MetadataRoute.Manifest {
  const tenant = M_AND_J_TENANT_CONFIG;
  return {
    id: `/admin?tenant=${encodeURIComponent(tenant.tenantKey)}`,
    name: `${tenant.businessName} Business Software`,
    short_name: tenant.businessName,
    description: `${tenant.businessName} business management software.`,
    start_url: "/admin",
    scope: "/admin",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: tenant.accentColour,
    icons: [{ src: tenant.logoUrl, sizes: "any" }],
  };
}
