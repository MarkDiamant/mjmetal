import { NextResponse } from "next/server";
import { requirePermission, supabaseRequest } from "@/lib/crm/supabase-server";

export async function GET() {
  const session = await requirePermission("view_jobs");
  if (!session) return new NextResponse(null, { status: 401 });
  for (const ext of ["png","jpg","jpeg","webp","svg"]) {
    const path = `_crm/logo.${ext}`.split("/").map(encodeURIComponent).join("/");
    const response = await supabaseRequest(`/storage/v1/object/mj-job-files/${path}`, { method: "GET" }, session.token);
    if (response.ok) return new NextResponse(response.body, { headers: { "Content-Type": response.headers.get("Content-Type") || "image/png", "Cache-Control": "private, no-cache" } });
  }
  return NextResponse.redirect(new URL("/images/logo.png", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"));
}
