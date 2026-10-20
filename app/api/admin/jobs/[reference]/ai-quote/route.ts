import {createTenantResourceAdapter} from "@markdiamant/business-software-core/lib/tenant-resource-adapter";
import {requirePermission,supabaseRequest} from "@/lib/crm/supabase-server";
import {createQuoteTidyHandler} from "@markdiamant/business-software-core/server/quote-tidy-handler";

// Tenant adapter only. Quotation AI behaviour and validation are owned by BMS core.
const tenantRequest=createTenantResourceAdapter(supabaseRequest,{jobs:"mj_jobs",customers:"mj_customers",quotes:"mj_quotes",filesBucket:"mj-job-files"});
export const POST=createQuoteTidyHandler({requirePermission,supabaseRequest:tenantRequest});
