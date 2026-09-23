import { NextResponse } from "next/server";
import { setSessionCookies, supabaseRequest } from "@/lib/crm/supabase-server";
import { loadCrmUsers } from "@/lib/crm/user-access";
import { signedTenantHandoff } from "@/lib/crm/tenant-handoff";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json() as { email?: string; password?: string };
    if (!email || !password) return NextResponse.json({ error: "Email and password are required" }, { status: 400 });

    const authResponse = await supabaseRequest("/auth/v1/token?grant_type=password", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (!authResponse.ok) {
      return NextResponse.json({ error: "Incorrect email or password" }, { status: 401 });
    }

    const session = await authResponse.json() as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
      user: { id: string; email?: string };
    };

    const adminResponse = await supabaseRequest(
      `/rest/v1/mj_admin_users?user_id=eq.${encodeURIComponent(session.user.id)}&select=display_name,initials&limit=1`,
      { method: "GET" },
      session.access_token,
    );

    const admins = adminResponse.ok ? await adminResponse.json() as unknown[] : [];
    if (!admins.length) {
      const users = await loadCrmUsers(session.access_token);
      const allowed = users.some((u) => u.status !== "disabled" && (u.userId === session.user.id || (!!session.user.email && u.email?.toLowerCase() === session.user.email.toLowerCase())));
      if (!allowed) return NextResponse.json({ error: "This account is not authorised for this business" }, { status: 403 });
    }

    const actorEmail=String(session.user.email||email).toLowerCase(),origin=new URL(request.url).origin;
    const {ts,sig}=signedTenantHandoff("mjmetal",origin,actorEmail);
    const central=await fetch("https://diamantsolutions.co.uk/api/business-software/tenant",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({slug:"mjmetal"}),cache:"no-store"});
    const centralBody=await central.json().catch(()=>({}));
    if(!central.ok||centralBody?.tenant?.slug!=="mjmetal")return NextResponse.json({error:"Unable to start secure business session"},{status:503});
    await setSessionCookies(session.access_token, session.refresh_token, session.expires_in);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to sign in" }, { status: 500 });
  }
}
