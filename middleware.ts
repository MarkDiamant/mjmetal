import { NextRequest, NextResponse } from "next/server";
import { canonicalSoftwareUrl, isLegacySoftwareHost } from "@/lib/crm/product";

export function middleware(request:NextRequest){
  const host=request.headers.get("host")||"",path=request.nextUrl.pathname;
  if(isLegacySoftwareHost(host)&&(path==="/admin"||path.startsWith("/admin/")||path.startsWith("/api/admin/")||path.startsWith("/api/integrations/"))){
    const target=new URL(canonicalSoftwareUrl(path));
    target.search=request.nextUrl.search;
    return NextResponse.redirect(target,308);
  }
  return NextResponse.next();
}
export const config={matcher:["/admin/:path*","/api/admin/:path*","/api/integrations/:path*"]};
