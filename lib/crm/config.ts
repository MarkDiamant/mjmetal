export type CrmModuleKey = "photos" | "workforce" | "commission" | "payments" | "costs" | "finishes" | "siteVisits";

export type CrmConfig = {
  businessName: string;
  systemName: string;
  logoUrl: string;
  accentColour: string;
  workforceTitle: string;
  workforceSingular: string;
  workforceRoles: string[];
  modules: Record<CrmModuleKey, boolean>;
};

export const DEFAULT_CRM_CONFIG: CrmConfig = {
  businessName: "M&J Metal",
  systemName: "CRM & Job Management",
  logoUrl: "/images/logo.png",
  accentColour: "#e66a24",
  workforceTitle: "Fabricators / installers / subcontractors",
  workforceSingular: "team member",
  workforceRoles: ["Installer", "Engineer", "Technician", "Contractor", "Subcontractor", "Surveyor", "Project manager", "Fabricator", "Other"],
  modules: {
    photos: true,
    workforce: true,
    commission: true,
    payments: true,
    costs: true,
    finishes: true,
    siteVisits: true,
  },
};

export function normaliseCrmConfig(value: Partial<CrmConfig> | null | undefined): CrmConfig {
  return {
    ...DEFAULT_CRM_CONFIG,
    ...(value || {}),
    modules: { ...DEFAULT_CRM_CONFIG.modules, ...(value?.modules || {}) },
    workforceRoles: Array.isArray(value?.workforceRoles) && value!.workforceRoles!.length ? value!.workforceRoles! : DEFAULT_CRM_CONFIG.workforceRoles,
  };
}
