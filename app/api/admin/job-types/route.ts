import { NextResponse } from "next/server";
import { requireAdminToken, supabaseRequest } from "@/lib/crm/supabase-server";
import { DEFAULT_CRM_CONFIG, normaliseCrmConfig } from "@/lib/crm/config";

async function settings(token:string){
  const path="_crm/settings.json".split("/").map(encodeURIComponent).join("/");
  const response=await supabaseRequest(`/storage/v1/object/mj-job-files/${path}`,{method:"GET"},token);
  return response.ok?normaliseCrmConfig(await response.json().catch(()=>null)):DEFAULT_CRM_CONFIG;
}

export async function GET() {
  const session=await requireAdminToken();
  if(!session)return NextResponse.json({error:"Unauthorised"},{status:401});
  const [response,config]=await Promise.all([
    supabaseRequest("/rest/v1/mj_jobs?select=job_type,job_types",{method:"GET"},session.token),
    settings(session.token),
  ]);
  const jobs=response.ok?await response.json() as Array<{job_type?:string;job_types?:string[]}>:[];
  const counts=new Map<string,number>();
  const configured=new Set(config.workTypes);
  for(const name of config.workTypes)counts.set(name,0);
  // Historical values remain available only when they are still used by an existing job.
  for(const job of jobs){
    const types=Array.isArray(job.job_types)&&job.job_types.length?job.job_types:[job.job_type].filter(Boolean) as string[];
    for(const raw of types){const name=String(raw||"").trim();if(!name)continue;counts.set(name,(counts.get(name)||0)+1);}
  }
  const options=[...counts.entries()].filter(([name,count])=>configured.has(name)||count>0).map(([name,count])=>({name,count}));
  return NextResponse.json({options});
}
