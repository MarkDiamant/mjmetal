export type PermissionKey =
  | "view_jobs" | "edit_jobs" | "view_completed_jobs" | "view_history"
  | "view_customer_details" | "view_pricing" | "view_costs_profit"
  | "view_money_overview" | "view_payments_invoices" | "view_files"
  | "view_workforce" | "manage_users" | "manage_business_settings" | "manage_subscription";

export type UserRole = "owner" | "admin" | "manager" | "office" | "sales" | "field" | "custom";

export const PERMISSION_LABELS: Record<PermissionKey,string> = {
 view_jobs:"View jobs", edit_jobs:"Edit jobs", view_completed_jobs:"View completed / closed jobs",
 view_history:"View job history & activity", view_customer_details:"View customer contact details",
 view_pricing:"View quotes & customer pricing", view_costs_profit:"View costs & profit",
 view_money_overview:"View money overview", view_payments_invoices:"View payments & invoices",
 view_files:"View photos & files", view_workforce:"View assigned team / contractors",
 manage_users:"Add users & change permissions", manage_business_settings:"Change business & CRM settings",
 manage_subscription:"Manage subscription & billing",
};

const all=Object.keys(PERMISSION_LABELS) as PermissionKey[];
export const ROLE_PERMISSIONS: Record<UserRole,PermissionKey[]> = {
 owner: all,
 admin: all.filter(x=>x!=="manage_subscription"),
 manager: all.filter(x=>!["manage_users","manage_business_settings","manage_subscription"].includes(x)),
 office: ["view_jobs","edit_jobs","view_completed_jobs","view_history","view_customer_details","view_pricing","view_money_overview","view_payments_invoices","view_files","view_workforce"],
 sales: ["view_jobs","edit_jobs","view_completed_jobs","view_history","view_customer_details","view_pricing","view_files"],
 field: ["view_jobs","edit_jobs","view_customer_details","view_files","view_workforce"],
 custom: [],
};
export const ROLE_LABELS:Record<UserRole,string>={owner:"Owner",admin:"Admin",manager:"Manager",office:"Office",sales:"Sales",field:"Field / engineer",custom:"Custom"};
export const USER_PLANS=[{id:"users_1_2",label:"1–2 users",min:1,max:2},{id:"users_3_5",label:"3–5 users",min:3,max:5}] as const;
