import {requirePermission,supabaseRequest} from "@/lib/crm/supabase-server";
import {DEFAULT_CRM_CONFIG,normaliseCrmConfig} from "@/lib/crm/config";
import {createQuotePdfHandlers} from "@/business-software-core/server/quote-pdf-handler";

// Tenant-specific database and file bucket mappings only. PDF behaviour is BMS-wide.
const tenantRequest=(path:string,init:RequestInit={},token?:string)=>supabaseRequest(path.replaceAll("/rest/v1/bms_jobs","/rest/v1/mj_jobs").replaceAll("/rest/v1/bms_customers","/rest/v1/mj_customers").replaceAll("/rest/v1/bms_quotes","/rest/v1/mj_quotes").replaceAll("/storage/v1/object/bms-job-files/","/storage/v1/object/mj-job-files/"),init,token);
export const {POST,GET}=createQuotePdfHandlers({requirePermission,supabaseRequest:tenantRequest,DEFAULT_CRM_CONFIG,normaliseCrmConfig});
