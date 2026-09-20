import { redirect } from "next/navigation";

export default async function QuotePreviewPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  redirect(`/admin/jobs/${encodeURIComponent(reference.toUpperCase())}`);
}
