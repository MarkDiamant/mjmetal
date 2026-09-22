export type CrmModuleKey = "photos" | "workforce" | "commission" | "payments" | "costs" | "finishes" | "siteVisits" | "scheduling" | "quotes" | "invoices";

export type CrmConfig = {
  businessName: string;
  systemName: string;
  logoUrl: string;
  accentColour: string;
  workforceTitle: string;
  workforceSingular: string;
  workforceRoles: string[];
  workTypes: string[];
  finishOptions: string[];
  enquirySources: string[];
  fileCategories: string[];
  quoteTemplate: "mj-signature" | "clean" | "classic";
  invoiceTemplate: "mj-signature" | "clean" | "classic";
  tenantKey: string;
  plan: { includedUsers:number; licensedUsers:number; additionalUserMonthly:number; aiAssistantMonthly:number; annualMonthsCharged:number; aiIncluded:boolean; };
  ai: { enabled:boolean; textAssist:boolean; voiceAssist:boolean; includedTextActions:number|null; includedVoiceMinutes:number|null; };
  billing: { mode:"free"|"paid"; interval:"monthly"|"annual"|null; status:"active"|"past_due"|"unpaid"|"cancelled"|"trialing"; resumeUrl:string; customerId:string; subscriptionId:string; currentPeriodEnd:string; cancelAtPeriodEnd:boolean; };
  businessDetails: { phone:string; email:string; website:string; companyNumber:string; officeAddress:string; registeredAddress:string; bankName:string; accountNumber:string; sortCode:string; vatRegistered:boolean; vatNumber:string; defaultDepositPercent:number; quoteValidityDays:number; paymentTerms:string; defaultVatRate:number; emailSignatureName:string; emailSignatureTagline:string; };
  modules: Record<CrmModuleKey, boolean>;
};

export const M_AND_J_TENANT_CONFIG: CrmConfig = {
  businessName: "M&J Metal",
  systemName: "Business Management Software",
  logoUrl: "/images/logo.png",
  accentColour: "#e66a24",
  workforceTitle: "Fabricators / installers / subcontractors",
  workforceSingular: "team member",
  workforceRoles: ["Installer", "Engineer", "Technician", "Contractor", "Subcontractor", "Surveyor", "Project manager", "Fabricator", "Other"],
  workTypes: ["Driveway Gates","Commercial Gates","Gate Automation","Side Passage Gates","Bar Grille Doors","Security Window Grilles","Retractable Security Gates","Railings","Staircases","Fire Escapes","Bespoke Fabrication","Other"],
  finishOptions: ["Primed & painted","Spray painted","Powder coated","Galvanised","Zinc primer","Stainless steel","Brushed stainless","Polished stainless","Raw steel","Other"],
  enquirySources: ["WhatsApp","Email","Website","Phone","Referral","Existing Customer","We reached out","Other"],
  fileCategories: ["Site Survey","Before","Drawing","Fabrication","Installation","After","Other"],
  quoteTemplate: "mj-signature",
  invoiceTemplate: "mj-signature",
  tenantKey: "mj-metal",
  plan: { includedUsers:1, licensedUsers:2, additionalUserMonthly:10, aiAssistantMonthly:15, annualMonthsCharged:10, aiIncluded:true },
  ai: { enabled:true, textAssist:true, voiceAssist:false, includedTextActions:null, includedVoiceMinutes:null },
  billing: { mode:"free", interval:null, status:"active", resumeUrl:"", customerId:"", subscriptionId:"", currentPeriodEnd:"", cancelAtPeriodEnd:false },
  businessDetails: { phone:"020 3284 5045", email:"info@mjmetal.co.uk", website:"mjmetal.co.uk", companyNumber:"17330239", officeAddress:"Office 6, 1st Floor, Sutherland House, 70-78 West Hendon Broadway, London, NW9 7BT", registeredAddress:"4 Eastville Avenue, London NW11 0HD", bankName:"M&J Metal Ltd", accountNumber:"37245425", sortCode:"60-83-71", vatRegistered:false, vatNumber:"", defaultDepositPercent:50, quoteValidityDays:30, paymentTerms:"50% deposit, with the remaining balance due on completion.", defaultVatRate:20, emailSignatureName:"The M&J Metal Team", emailSignatureTagline:"| Built Strong. Built to last |" },
  modules: {
    photos: true,
    workforce: true,
    commission: true,
    payments: true,
    costs: true,
    finishes: true,
    siteVisits: true,
    scheduling: true,
    quotes: true,
    invoices: true,
  },
};

export const SHARED_BUSINESS_SOFTWARE_DEFAULTS: CrmConfig = {
  ...M_AND_J_TENANT_CONFIG,
  businessName: "Your Business",
  logoUrl: "/favicon.svg",
  workforceTitle: "Team",
  workforceSingular: "team member",
  workforceRoles: ["Engineer","Technician","Contractor","Subcontractor","Surveyor","Project manager","Electrician","Plumber","Carpenter","Builder","Cleaner","Driver","Consultant","Salesperson","Other"],
  workTypes: ["Installation","Repair","Maintenance","Service","Survey","Consultation","Project","Other"],
  finishOptions: ["Standard","Other"],
  invoiceTemplate: "clean",
  tenantKey: "new-tenant",
  plan: { ...M_AND_J_TENANT_CONFIG.plan, includedUsers:1, licensedUsers:1, aiIncluded:false },
  ai: { ...M_AND_J_TENANT_CONFIG.ai, enabled:false, textAssist:false, voiceAssist:false },
  billing: { ...M_AND_J_TENANT_CONFIG.billing, mode:"paid" },
  businessDetails: { ...M_AND_J_TENANT_CONFIG.businessDetails, phone:"", email:"", website:"", companyNumber:"", officeAddress:"", registeredAddress:"", bankName:"", accountNumber:"", sortCode:"", vatRegistered:false, vatNumber:"" },
};

// This live deployment is tenant #1. New tenants start from the shared defaults
// and persist their own tenant configuration.
export const DEFAULT_CRM_CONFIG = M_AND_J_TENANT_CONFIG;

export function normaliseCrmConfig(value: Partial<CrmConfig> | null | undefined): CrmConfig {
  const tenantKey = value?.tenantKey || DEFAULT_CRM_CONFIG.tenantKey;
  const quoteTemplate = value?.quoteTemplate || DEFAULT_CRM_CONFIG.quoteTemplate;
  const invoiceTemplate = value?.invoiceTemplate === "mj-signature" && tenantKey !== "mj-metal" ? "clean" : (value?.invoiceTemplate || DEFAULT_CRM_CONFIG.invoiceTemplate);
  return {
    ...DEFAULT_CRM_CONFIG,
    ...(value || {}),
    tenantKey,
    quoteTemplate,
    invoiceTemplate,
    modules: { ...DEFAULT_CRM_CONFIG.modules, ...(value?.modules || {}) },
    businessDetails: { ...DEFAULT_CRM_CONFIG.businessDetails, ...(value?.businessDetails || {}) },
    plan: { ...DEFAULT_CRM_CONFIG.plan, ...(value?.plan || {}) },
    ai: { ...DEFAULT_CRM_CONFIG.ai, ...(value?.ai || {}) },
    billing: { ...DEFAULT_CRM_CONFIG.billing, ...(value?.billing || {}) },
    workTypes: Array.isArray(value?.workTypes) && value!.workTypes!.length ? value!.workTypes! : DEFAULT_CRM_CONFIG.workTypes,
    finishOptions: Array.isArray(value?.finishOptions) && value!.finishOptions!.length ? value!.finishOptions! : DEFAULT_CRM_CONFIG.finishOptions,
    enquirySources: Array.isArray(value?.enquirySources) && value!.enquirySources!.length ? value!.enquirySources! : DEFAULT_CRM_CONFIG.enquirySources,
    fileCategories: Array.isArray(value?.fileCategories) && value!.fileCategories!.length ? value!.fileCategories! : DEFAULT_CRM_CONFIG.fileCategories,
    workforceRoles: Array.isArray(value?.workforceRoles) && value!.workforceRoles!.length ? value!.workforceRoles! : DEFAULT_CRM_CONFIG.workforceRoles,
  };
}
