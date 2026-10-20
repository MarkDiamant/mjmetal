import {requirePermission,supabaseRequest} from "@/lib/crm/supabase-server";
import {createRubyHandler} from "@/business-software-core/server/ruby-handler";

// Tenant adapter only: the complete Ruby workflow is owned by the BMS core.
const tenantRequest=(path:string,init:RequestInit={},token?:string)=>supabaseRequest(path.replaceAll("/rest/v1/bms_jobs","/rest/v1/mj_jobs").replaceAll("/rest/v1/bms_customers","/rest/v1/mj_customers").replaceAll("/rest/v1/bms_quotes","/rest/v1/mj_quotes").replaceAll("/storage/v1/object/bms-job-files/","/storage/v1/object/mj-job-files/"),init,token);
export const POST=createRubyHandler({requirePermission,supabaseRequest:tenantRequest});
