export default async function QuotePreviewPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const ref = reference.toUpperCase();

  return (
    <main className="min-h-screen bg-[#ecece8] px-4 py-8 text-[#171717] print:bg-white print:p-0">
      <article className="mx-auto max-w-[850px] bg-white p-8 shadow-xl print:max-w-none print:shadow-none sm:p-12">
        <header className="flex items-start justify-between gap-8 border-b-4 border-[#e66a24] pb-6">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#e66a24]">M&J Metal Ltd</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight">Quotation</h1>
          </div>
          <div className="text-right text-sm leading-6 text-black/60">
            <p className="font-black text-black">{ref}</p>
            <p>4 Eastville Avenue</p>
            <p>London, NW11 0HD</p>
            <p>mjmetal.co.uk</p>
          </div>
        </header>

        <section className="grid gap-8 py-8 sm:grid-cols-2">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.1em] text-black/40">Prepared for</p>
            <p className="mt-2 text-lg font-black">Example Customer</p>
            <p className="mt-1 text-sm leading-6 text-black/60">North West London<br />NW11</p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-black uppercase tracking-[0.1em] text-black/40">Quote details</p>
            <p className="mt-2 text-sm"><strong>Date:</strong> 16 September 2026</p>
            <p className="mt-1 text-sm"><strong>Valid for:</strong> 30 days</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-black">Proposed works</h2>
          <div className="mt-3 rounded-2xl bg-[#f7f7f4] p-5 text-sm leading-7 text-black/75">
            Supply, fabricate and install the agreed metalwork in accordance with the final confirmed measurements and specification. Final customer-facing wording will be generated from the structured job record and reviewed by M&J Metal before issue.
          </div>
        </section>

        <section className="mt-7 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-black/10 p-5">
            <p className="text-xs font-black uppercase tracking-[0.1em] text-black/40">Finish</p>
            <p className="mt-2 font-bold">Galvanised + powder coated black</p>
          </div>
          <div className="rounded-2xl border border-black/10 p-5">
            <p className="text-xs font-black uppercase tracking-[0.1em] text-black/40">Estimated lead time</p>
            <p className="mt-2 font-bold">To be confirmed</p>
          </div>
        </section>

        <section className="mt-8 flex items-end justify-between gap-8 border-y border-black/10 py-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.1em] text-black/40">Total</p>
            <p className="mt-1 text-sm text-black/50">Subject to final approved scope</p>
          </div>
          <p className="text-4xl font-black">£TBC</p>
        </section>

        <section className="mt-7 text-sm leading-6 text-black/60">
          <p className="font-black text-black">Notes</p>
          <p className="mt-2">Any exclusions, deposit terms, access requirements and job-specific conditions will appear here when the quote is generated.</p>
        </section>

        <footer className="mt-12 border-t border-black/10 pt-5 text-xs leading-5 text-black/45">
          <p className="font-bold text-black/65">M&J METAL LTD · Company No. 17330239</p>
          <p>Registered office: 4 Eastville Avenue, London, England, NW11 0HD</p>
        </footer>
      </article>
    </main>
  );
}
