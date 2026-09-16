import Link from "next/link";
import JobDetail from "@/components/admin/JobDetail";
import JobWorkflowPanel from "@/components/admin/JobWorkflowPanel";

export default async function JobPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const ref = reference.toUpperCase();
  return <>
    <JobWorkflowPanel reference={ref} />
    <JobDetail reference={ref} />
    <Link href={`/admin/jobs/${ref}/xero`} className="fixed bottom-5 right-5 z-40 rounded-xl bg-[#13b5ea] px-4 py-3 text-sm font-black text-white shadow-lg print:hidden">Xero invoice</Link>
  </>;
}
