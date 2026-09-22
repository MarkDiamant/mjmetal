export const BUSINESS_SOFTWARE = {
  name: "DS Business Software",
  provider: "Diamant Solutions",
  tenantModel: "shared-product" as const,
  integrationBaseUrl: (process.env.DS_INTEGRATIONS_BASE_URL || "https://diamantsolutions.co.uk").replace(/\/$/, ""),
  tenantRegistryUrl: (process.env.DS_TENANT_REGISTRY_URL || "https://diamantsolutions.co.uk/api/business-software/tenant").replace(/\/$/, ""),
} as const;

export function tenantOrigin(requestUrl:string){
  return new URL(requestUrl).origin.replace(/\/$/, "");
}

export type CentralTenant = {
  id:string;
  slug:string;
  name:string;
  canonicalHost:string;
  status:string;
  billingMode:"free"|"paid";
  referenceTenant:boolean;
};

export async function resolveCentralTenant(params:{slug?:string;host?:string}):Promise<CentralTenant|null>{
  const query=new URLSearchParams();
  if(params.slug)query.set("slug",params.slug);
  if(params.host)query.set("host",params.host);
  if(!query.size)return null;
  try{
    const response=await fetch(`${BUSINESS_SOFTWARE.tenantRegistryUrl}?${query.toString()}`,{cache:"no-store"});
    if(!response.ok)return null;
    const body=await response.json().catch(()=>null);
    return body?.tenant||null;
  }catch{return null;}
}
