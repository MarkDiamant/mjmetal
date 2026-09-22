export default function SetupRequired() {
  return (
    <main className="min-h-screen bg-[#f5f5f2] px-5 py-10 text-[#141414]">
      <div className="mx-auto max-w-3xl rounded-3xl border border-black/10 bg-white p-7 shadow-[0_12px_40px_rgba(0,0,0,0.06)] sm:p-10">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#e66a24]">Demo Metal</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">CRM setup ready</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-black/65">
          The admin system is built separately from the public website and is waiting for the dedicated Demo Supabase project before live customer data is enabled.
        </p>

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          {[
            "Separate Alex and Sam logins",
            "Automatic MJ job references starting after MJ018",
            "Customers and repeat-customer history",
            "Job pipeline, filters and next actions",
            "Site visits and customer follow-ups",
            "Quotes, payments, costs and subcontractors",
            "Photos and job files",
            "Email and Xero integration hooks",
          ].map((item) => (
            <div key={item} className="rounded-2xl bg-[#f5f5f2] px-4 py-3 text-sm font-semibold">{item}</div>
          ))}
        </div>

        <div className="mt-7 rounded-2xl border border-[#e66a24]/25 bg-[#fff7f1] p-5">
          <p className="font-black">Next connection step</p>
          <p className="mt-2 text-sm leading-6 text-black/65">Create the new Demo Supabase project and add its URL and publishable key to Vercel. The CRM can then be switched from setup mode to live mode.</p>
        </div>
      </div>
    </main>
  );
}
