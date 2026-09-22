import { NextRequest, NextResponse } from "next/server";
import { canonicalSoftwareUrl, isLegacySoftwareHost, M_AND_J_SOFTWARE_HOST } from "@/lib/crm/product";

const cleanSections=new Set(["archive","customers","files","integrations","invoices","jobs","login","payments","quotes","settings","team","users"]);
function hostOnly(value:string){return value.split(":")[0].toLowerCase();}

export function middleware(request:NextRequest){
  const host=request.headers.get("host")||"",cleanHost=hostOnly(host),path=request.nextUrl.pathname;
  if(isLegacySoftwareHost(host)&&(path==="/admin"||path.startsWith("/admin/")||path.startsWith("/api/admin/")||path.startsWith("/api/integrations/"))){
    const cleanPath=path==="/admin"?"/":path.startsWith("/admin/")?path.slice(6):path;
    const target=new URL(canonicalSoftwareUrl(cleanPath));
    target.search=request.nextUrl.search;
    return NextResponse.redirect(target,308);
  }
  if(cleanHost===M_AND_J_SOFTWARE_HOST){
    if(path==="/admin"||path.startsWith("/admin/")){
      const target=request.nextUrl.clone();
      target.pathname=path==="/admin"?"/":path.slice(6);
      return NextResponse.redirect(target,308);
    }
    if(path==="/"){
      const target=request.nextUrl.clone();target.pathname="/admin";
      return NextResponse.rewrite(target);
    }
    const first=path.split("/").filter(Boolean)[0]||"";
    if(cleanSections.has(first)){
      const target=request.nextUrl.clone();target.pathname="/admin"+path;
      return NextResponse.rewrite(target);
    }
  }
  return NextResponse.next();
}
export const config={matcher:["/((?!_next/static|_next/image|favicon.ico|images/).*)"]};
