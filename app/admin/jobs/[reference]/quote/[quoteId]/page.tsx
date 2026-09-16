import QuotePrint from "@/components/admin/QuotePrint";
import QuotePdfActions from "@/components/admin/QuotePdfActions";

export default async function QuotePage({ params }: { params: Promise<{ reference: string; quoteId: string }> }) {
  const { reference, quoteId } = await params;
  const ref = reference.toUpperCase();
  return <><QuotePrint reference={ref} quoteId={quoteId} /><QuotePdfActions reference={ref} quoteId={quoteId} /></>;
}
