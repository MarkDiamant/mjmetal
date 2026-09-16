import QuotePrint from "@/components/admin/QuotePrint";

export default async function QuotePage({ params }: { params: Promise<{ reference: string; quoteId: string }> }) {
  const { reference, quoteId } = await params;
  return <QuotePrint reference={reference.toUpperCase()} quoteId={quoteId} />;
}
