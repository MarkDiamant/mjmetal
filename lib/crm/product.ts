export const BUSINESS_SOFTWARE = {
  name: "DS Business Software",
  provider: "Diamant Solutions",
  integrationBaseUrl: (process.env.DS_INTEGRATIONS_BASE_URL || "https://diamantsolutions.co.uk").replace(/\/$/, ""),
} as const;

export function tenantOrigin(requestUrl:string){
  return new URL(requestUrl).origin.replace(/\/$/, "");
}
