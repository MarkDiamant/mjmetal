import { NextResponse } from "next/server";
import { requireAdminToken, supabaseRequest } from "@/lib/crm/supabase-server";

export async function POST(_request: Request, { params }: { params: Promise<{ reference: string }> }) {
  const session = await requireAdminToken();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI quote drafting is not configured yet. Add OPENAI_API_KEY in Vercel." }, { status: 503 });
  const { reference } = await params;

  const jobResponse = await supabaseRequest(`/rest/v1/mj_jobs?reference=eq.${encodeURIComponent(reference)}&select=*,mj_customers(*)&limit=1`, {}, session.token);
  if (!jobResponse.ok) return NextResponse.json({ error: "Could not load job" }, { status: 500 });
  const rows = await jobResponse.json() as any[];
  const job = rows[0];
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  const customer = job.mj_customers || {};

  const prompt = `Write a concise, professional customer-facing scope of works for an M&J Metal quotation. Use UK English. Do not invent specifications, dimensions, materials, finishes, hardware, access requirements, lead times or guarantees. If information is missing, omit it rather than guessing. Keep internal pricing/subcontractor notes private. Use short paragraphs or clear bullet points suitable for a formal quotation.\n\nJob reference: ${job.reference}\nCustomer: ${[customer.first_name, customer.last_name].filter(Boolean).join(" ")}\nJob type: ${job.job_type || ""}\nDimensions: ${job.dimensions || ""}\nMaterial: ${job.material || ""}\nFinishes: ${(job.finishes || []).join(", ")}\nColour/RAL: ${job.colour || ""}\nCustomer requirements: ${job.customer_requirements || ""}\nSite address: ${[job.site_address_line_1, job.site_address_line_2, job.site_city, job.site_postcode].filter(Boolean).join(", ")}`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gpt-5.6-luna", input: prompt, reasoning: { effort: "low" }, max_output_tokens: 1200 }),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) return NextResponse.json({ error: body?.error?.message || "AI drafting failed" }, { status: 502 });

  const text = body?.output_text || (body?.output || []).flatMap((item: any) => item?.content || []).map((part: any) => part?.text || "").join("\n").trim();
  if (!text) return NextResponse.json({ error: "AI returned no wording" }, { status: 502 });
  return NextResponse.json({ text });
}
