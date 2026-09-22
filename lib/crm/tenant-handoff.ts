import crypto from "crypto";
export function signedTenantHandoff(slug:string,origin:string,email:string){
  const secret=process.env.DS_TENANT_HANDOFF_SECRET;
  if(!secret)throw new Error("Tenant handoff is not configured");
  const ts=Date.now();
  const payload=[slug.toLowerCase(),origin,email.toLowerCase(),String(ts)].join("|");
  const sig=crypto.createHmac("sha256",secret).update(payload).digest("base64url");
  return {ts,sig};
}
