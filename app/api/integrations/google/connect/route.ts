import crypto from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/crm/supabase-server";
import { googleAuthorizeUrl } from "@/lib/crm/gmail";
export async function GET(request:Request){const session=await requirePermission("manage_business_settings");const base=process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/,"")||new URL(request.url).origin;if(!session)return NextResponse.redirect(`${base}/admin/login`);try{const state=crypto.randomBytes(24).toString("base64url"),store=await cookies();store.set("mj_google_oauth_state",state,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:600});return NextResponse.redirect(googleAuthorizeUrl(state));}catch(e){return NextResponse.redirect(`${base}/admin/integrations?google=config_error`);}}