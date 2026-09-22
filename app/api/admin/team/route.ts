import { NextRequest, NextResponse } from "next/server";
import { requirePermission, supabaseRequest } from "@/lib/crm/supabase-server";

async function workforceEditor() {
  const session = await requirePermission("view_workforce");
  if (!session) return null;
  if (!session.permissions.includes("edit_jobs")) return null;
  return session;
}

export async function POST(request: NextRequest) {
  const session = await workforceEditor();
  if (!session) return NextResponse.json({ error: "You do not have permission to manage the team" }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  const relationshipType = String(body.relationshipType || "employee") === "subcontractor" ? "subcontractor" : "employee";
  const response = await supabaseRequest("/rest/v1/mj_subcontractors", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      name,
      company: String(body.company || "").trim() || null,
      phone: String(body.phone || "").trim() || null,
      email: String(body.email || "").trim() || null,
      relationship_type: relationshipType,
      active: true,
    }),
  }, session.token);
  if (!response.ok) return NextResponse.json({ error: "Unable to add team member" }, { status: 500 });
  return NextResponse.json({ person: (await response.json())?.[0] }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const session = await workforceEditor();
  if (!session) return NextResponse.json({ error: "You do not have permission to manage the team" }, { status: 403 });
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Team member is required" }, { status: 400 });
  const response = await supabaseRequest("/rest/v1/mj_subcontractors?id=eq." + encodeURIComponent(id), {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ active: false }),
  }, session.token);
  if (!response.ok) return NextResponse.json({ error: "Unable to remove team member" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
