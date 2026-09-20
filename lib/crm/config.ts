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
  ai: { enabled:boolean; textAssist:boolean; voiceAssist:boolean; includedTextActions:number|null; includedVoiceMinutes:number|null; };
  billing: { mode:"free"|"paid"; interval:"monthly"|"annual"|null; status:"active"|"past_due"|"unpaid"|"cancelled"|"trialing"; resumeUrl:string; };
  businessDetails: { phone:string; email:string; website:string; companyNumber:string; officeAddress:string; registeredAddress:string; bankName:string; accountNumber:string; sortCode:string; vatRegistered:boolean; vatNumber:string; defaultDepositPercent:number; quoteValidityDays:number; paymentTerms:string; defaultVatRate:number; };
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
  workTypes: ["Driveway Gates","Commercial Gates","Gate Automation","Side Passage Gates","Bar Grille Doors","Security Window Grilles","Retractable Security Gates","Railings","Staircases","Fire Escapes","Bespoke Fabrication","Other"],
  finishOptions: ["Primed & painted","Spray painted","Powder coated","Galvanised","Zinc primer","Stainless steel","Brushed stainless","Polished stainless","Raw steel","Other"],
  enquirySources: ["WhatsApp","Email","Website","Phone","Referral","Existing Customer","We reached out","Other"],
  fileCategories: ["Site Survey","Before","Drawing","Fabrication","Installation","After","Other"],
  quoteTemplate: "mj-signature",
  invoiceTemplate: "mj-signature",
  tenantKey: "mj-metal",
  ai: { enabled:true, textAssist:true, voiceAssist:false, includedTextActions:null, includedVoiceMinutes:null },
  billing: { mode:"free", interval:null, status:"active", resumeUrl:"" },
  businessDetails: { phone:"020 3284 5045", email:"info@mjmetal.co.uk", website:"mjmetal.co.uk", companyNumber:"17330239", officeAddress:"Office 6, 1st Floor, Sutherland House, 70-78 West Hendon Broadway, London, NW9 7BT", registeredAddress:"4 Eastville Avenue, London NW11 0HD", bankName:"M&J Metal Ltd", accountNumber:"37245425", sortCode:"60-83-71", vatRegistered:false, vatNumber:"", defaultDepositPercent:50, quoteValidityDays:30, paymentTerms:"50% deposit, with the remaining balance due on completion.", defaultVatRate:20 },
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

export function normaliseCrmConfig(value: Partial<CrmConfig> | null | undefined): CrmConfig {
  const tenantKey = value?.tenantKey || DEFAULT_CRM_CONFIG.tenantKey;
  const quoteTemplate = value?.quoteTemplate === "mj-signature" && tenantKey !== "mj-metal" ? "clean" : (value?.quoteTemplate || DEFAULT_CRM_CONFIG.quoteTemplate);
  const invoiceTemplate = value?.invoiceTemplate === "mj-signature" && tenantKey !== "mj-metal" ? "clean" : (value?.invoiceTemplate || DEFAULT_CRM_CONFIG.invoiceTemplate);
  return {
    ...DEFAULT_CRM_CONFIG,
    ...(value || {}),
    tenantKey,
    quoteTemplate,
    invoiceTemplate,
    modules: { ...DEFAULT_CRM_CONFIG.modules, ...(value?.modules || {}) },
    businessDetails: { ...DEFAULT_CRM_CONFIG.businessDetails, ...(value?.businessDetails || {}) },
    ai: { ...DEFAULT_CRM_CONFIG.ai, ...(value?.ai || {}) },
    billing: { ...DEFAULT_CRM_CONFIG.billing, ...(value?.billing || {}) },
    workTypes: Array.isArray(value?.workTypes) && value!.workTypes!.length ? value!.workTypes! : DEFAULT_CRM_CONFIG.workTypes,
    finishOptions: Array.isArray(value?.finishOptions) && value!.finishOptions!.length ? value!.finishOptions! : DEFAULT_CRM_CONFIG.finishOptions,
    enquirySources: Array.isArray(value?.enquirySources) && value!.enquirySources!.length ? value!.enquirySources! : DEFAULT_CRM_CONFIG.enquirySources,
    fileCategories: Array.isArray(value?.fileCategories) && value!.fileCategories!.length ? value!.fileCategories! : DEFAULT_CRM_CONFIG.fileCategories,
    workforceRoles: Array.isArray(value?.workforceRoles) && value!.workforceRoles!.length ? value!.workforceRoles! : DEFAULT_CRM_CONFIG.workforceRoles,
  };
}
