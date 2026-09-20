import JobDetail from "@/components/admin/JobDetail";

export default async function JobPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const ref = reference.toUpperCase();
  return <>
    <JobDetail reference={ref} />
  </>;
}
