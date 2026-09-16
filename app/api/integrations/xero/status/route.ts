import { NextResponse } from "next/server";
import { requireAdminToken } from "@/lib/crm/supabase-server";
import { disconnectXero, getStoredXeroConnection } from "@/lib/crm/xero";

export async function GET() {
  const session = await requireAdminToken();
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  try {
    const connection = await getStoredXeroConnection(session.token);
    return NextResponse.json({ connected: Boolean(connection), tenantName: connection?.tenant_name || null, connectedAt: connection?.connected_at || null });
  } catch {
    return NextResponse.json({ error: "Unable to load Xero status" }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await requireAdminToken();
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  try {
    await disconnectXero(session.token);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to disconnect Xero" }, { status: 500 });
  }
}
