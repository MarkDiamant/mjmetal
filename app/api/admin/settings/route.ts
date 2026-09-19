import { NextRequest, NextResponse } from "next/server";
import { requirePermission, supabaseRequest } from "@/lib/crm/supabase-server";
import { DEFAULT_CRM_CONFIG, normaliseCrmConfig } from "@/lib/crm/config";

const SETTINGS_PATH = "_crm/settings.json";
const LOGO_PREFIX = "_crm/logo";

async function readSettings(token: string) {
  const encoded = SETTINGS_PATH.split("/").map(encodeURIComponent).join("/");
  const response = await supabaseRequest(`/storage/v1/object/mj-job-files/${encoded}`, { method: "GET" }, token);
  if (!response.ok) return DEFAULT_CRM_CONFIG;
  const body = await response.json().catch(() => null);
  return normaliseCrmConfig(body);
}

async function writeSettings(token: string, settings: unknown) {
  const encoded = SETTINGS_PATH.split("/").map(encodeURIComponent).join("/");
  return supabaseRequest(`/storage/v1/object/mj-job-files/${encoded}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-upsert": "true" },
    body: JSON.stringify(normaliseCrmConfig(settings as any)),
  }, token);
}

export async function GET() {
  const session = await requirePermission("manage_business_settings");
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  return NextResponse.json({ settings: await readSettings(session.token) });
}

export async function PUT(request: NextRequest) {
  const session = await requirePermission("manage_business_settings");
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const settings = normaliseCrmConfig(await request.json().catch(() => ({})));
  const saved = await writeSettings(session.token, settings);
  if (!saved.ok) return NextResponse.json({ error: "Could not save CRM settings" }, { status: 500 });
  return NextResponse.json({ settings });
}

export async function POST(request: NextRequest) {
  const session = await requirePermission("manage_business_settings");
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const form = await request.formData();
  const file = form.get("logo");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a logo" }, { status: 400 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Logo must be an image" }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Maximum logo size is 5 MB" }, { status: 400 });
  const ext = (file.name.split(".").pop() || "png").replace(/[^a-z0-9]/gi, "").toLowerCase();
  const path = `${LOGO_PREFIX}.${ext || "png"}`;
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  const upload = await supabaseRequest(`/storage/v1/object/mj-job-files/${encoded}`, {
    method: "POST",
    headers: { "Content-Type": file.type, "x-upsert": "true" },
    body: file,
  }, session.token);
  if (!upload.ok) return NextResponse.json({ error: "Could not upload logo" }, { status: 500 });
  const current = await readSettings(session.token);
  const settings = { ...current, logoUrl: "/api/admin/settings/logo" };
  const saved = await writeSettings(session.token, settings);
  if (!saved.ok) return NextResponse.json({ error: "Logo uploaded but settings could not be updated" }, { status: 500 });
  return NextResponse.json({ settings });
}
