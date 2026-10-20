/** Resolve BMS logical resources to a tenant's isolated database tables and file bucket. */
export type TenantResources={jobs:string;customers:string;quotes:string;filesBucket:string};
export function createTenantResourceAdapter<T>(request:(path:string,init?:RequestInit,token?:string)=>Promise<T>,resources:TenantResources){
 for(const value of Object.values(resources))if(!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(value))throw Error("Invalid tenant resource identifier");
 return (path:string,init:RequestInit={},token?:string)=>{
  const translated=path.replace(/^\/rest\/v1\/bms_jobs(?=[?/]|$)/,`/rest/v1/${resources.jobs}`)
   .replace(/^\/rest\/v1\/bms_customers(?=[?/]|$)/,`/rest/v1/${resources.customers}`)
   .replace(/^\/rest\/v1\/bms_quotes(?=[?/]|$)/,`/rest/v1/${resources.quotes}`)
   .replace(/\bbms_customers\(/g,`${resources.customers}(`)
   .replace(/^\/storage\/v1\/object\/bms-job-files\//,`/storage/v1/object/${resources.filesBucket}/`);
  return request(translated,init,token);
 };
}
