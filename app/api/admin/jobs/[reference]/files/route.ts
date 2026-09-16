import { NextRequest, NextResponse } from "next/server";
import { requireAdminToken, supabaseRequest } from "@/lib/crm/supabase-server";

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").slice(0, 120) || "file";
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ reference: string }> }) {
  const session = await requireAdminToken();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { reference } = await params;
  const form = await request.formData();
  const file = form.get("file");
  const category = String(form.get("category") || "other");
  const includeInQuote = String(form.get("include_in_quote") || "false") === "true";
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a file" }, { status: 400 });
  if (file.size > 20 * 1024 * 1024) return NextResponse.json({ error: "Maximum file size is 20 MB" }, { status: 400 });

  const jobResponse = await supabaseRequest(`/rest/v1/mj_jobs?reference=eq.${encodeURIComponent(reference)}&select=id&limit=1`, {}, session.token);
  const jobs = jobResponse.ok ? await jobResponse.json() : [];
  const job = jobs[0];
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  const storagePath = `${job.id}/${Date.now()}-${safeName(file.name)}`;
  const encodedPath = storagePath.split("/").map(encodeURIComponent).join("/");
  const upload = await supabaseRequest(`/storage/v1/object/mj-job-files/${encodedPath}`, {
    method: "POST",
    headers: { "Content-Type": file.type || "application/octet-stream", "x-upsert": "false" },
    body: file,
  }, session.token);
  if (!upload.ok) {
    const error = await upload.json().catch(() => null);
    return NextResponse.json({ error: error?.message || "Upload failed" }, { status: 500 });
  }

  const metadata = await supabaseRequest("/rest/v1/mj_files", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ job_id: job.id, category, storage_path: storagePath, file_name: file.name, mime_type: file.type || null, include_in_quote: includeInQuote, uploaded_by: session.admin.initials }),
  }, session.token);
  const rows = metadata.ok ? await metadata.json() : null;
  if (!metadata.ok) return NextResponse.json({ error: "File uploaded but metadata could not be saved" }, { status: 500 });

  await supabaseRequest("/rest/v1/mj_audit_events", {
    method: "POST", headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ job_id: job.id, actor: session.admin.initials, action: "uploaded", entity_type: "file", entity_id: rows[0]?.id || null, changes: { file_name: file.name, category } }),
  }, session.token);

  return NextResponse.json({ item: rows[0] });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ reference: string }> }) {
  const session = await requireAdminToken();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { reference } = await params;
  const fileId = request.nextUrl.searchParams.get("id");
  if (!fileId) return NextResponse.json({ error: "Missing file id" }, { status: 400 });

  const jobResponse = await supabaseRequest(`/rest/v1/mj_jobs?reference=eq.${encodeURIComponent(reference)}&select=id&limit=1`, {}, session.token);
  const jobs = jobResponse.ok ? await jobResponse.json() : [];
  const job = jobs[0];
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  const fileResponse = await supabaseRequest(`/rest/v1/mj_files?id=eq.${encodeURIComponent(fileId)}&job_id=eq.${job.id}&select=*`, {}, session.token);
  const files = fileResponse.ok ? await fileResponse.json() : [];
  const item = files[0];
  if (!item) return NextResponse.json({ error: "File not found" }, { status: 404 });

  const encodedPath = item.storage_path.split("/").map(encodeURIComponent).join("/");
  const storageDelete = await supabaseRequest(`/storage/v1/object/mj-job-files/${encodedPath}`, { method: "DELETE" }, session.token);
  if (!storageDelete.ok) return NextResponse.json({ error: "Could not delete stored file" }, { status: 500 });
  await supabaseRequest(`/rest/v1/mj_files?id=eq.${encodeURIComponent(fileId)}`, { method: "DELETE" }, session.token);
  await supabaseRequest("/rest/v1/mj_audit_events", {
    method: "POST", body: JSON.stringify({ job_id: job.id, actor: session.admin.initials, action: "deleted", entity_type: "file", entity_id: fileId, changes: { file_name: item.file_name } }),
  }, session.token);
  return NextResponse.json({ ok: true });
}
