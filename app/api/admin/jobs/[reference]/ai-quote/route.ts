import {requirePermission,supabaseRequest} from "@/lib/crm/supabase-server";
import {createQuoteTidyHandler} from "@/business-software-core/server/quote-tidy-handler";

// Tenant adapter only. Quotation AI behaviour and validation are owned by BMS core.
const tenantRequest=(path:string,init:RequestInit={},token?:string)=>supabaseRequest(path.replaceAll("/rest/v1/bms_jobs","/rest/v1/mj_jobs").replaceAll("bms_customers","mj_customers").replaceAll("/storage/v1/object/bms-job-files/","/storage/v1/object/mj-job-files/"),init,token);
export const POST=createQuoteTidyHandler({requirePermission,supabaseRequest:tenantRequest});
