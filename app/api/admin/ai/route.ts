import {createTenantResourceAdapter} from "@markdiamant/business-software-core/lib/tenant-resource-adapter";
import {requirePermission,supabaseRequest} from "@/lib/crm/supabase-server";
import {createRubyHandler} from "@markdiamant/business-software-core/server/ruby-handler";

// Tenant adapter only: the complete Ruby workflow is owned by the BMS core.
const tenantRequest=createTenantResourceAdapter(supabaseRequest,{jobs:"mj_jobs",customers:"mj_customers",quotes:"mj_quotes",filesBucket:"mj-job-files"});
export const POST=createRubyHandler({requirePermission,supabaseRequest:tenantRequest});
