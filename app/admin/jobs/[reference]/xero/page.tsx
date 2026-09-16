import XeroInvoicePage from "@/components/admin/XeroInvoicePage";

export default async function JobXeroPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  return <XeroInvoicePage reference={reference.toUpperCase()} />;
}
