import {createTenantResourceAdapter} from "@/business-software-core/lib/tenant-resource-adapter";
import {requirePermission,supabaseRequest} from "@/lib/crm/supabase-server";
import {DEFAULT_CRM_CONFIG,normaliseCrmConfig} from "@/lib/crm/config";
import {createQuotePdfHandlers} from "@/business-software-core/server/quote-pdf-handler";

// Tenant-specific database and file bucket mappings only. PDF behaviour is BMS-wide.
const tenantRequest=createTenantResourceAdapter(supabaseRequest,{jobs:"mj_jobs",customers:"mj_customers",quotes:"mj_quotes",filesBucket:"mj-job-files"});
export const {POST,GET}=createQuotePdfHandlers({requirePermission,supabaseRequest:tenantRequest,DEFAULT_CRM_CONFIG,normaliseCrmConfig});
