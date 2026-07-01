const services = [
  "Gates",
  "Railings",
  "Steel staircases",
  "Fire escapes",
  "Fencing",
  "Custom fabrication",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col justify-between px-6 py-8">
        <header className="flex items-center justify-between">
          <div className="text-2xl font-black tracking-tight">
            M&J <span className="text-orange-500">Metal</span>
          </div>

          <a
            href="tel:"
            className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold hover:border-orange-500"
          >
            Get a quote
          </a>
        </header>

        <div className="max-w-4xl py-24">
          <p className="mb-5 text-sm font-bold uppercase tracking-[0.35em] text-orange-500">
            Gates • Railings • Fabrication
          </p>

          <h1 className="text-5xl font-black tracking-tight sm:text-7xl">
            Bespoke metalwork built strong.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-300">
            M&J Metal designs, supplies and installs gates, railings, steel
            staircases, fire escapes, fencing and custom metal fabrication for
            homes and businesses.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="#contact"
              className="rounded-full bg-orange-500 px-7 py-3 font-bold text-neutral-950 hover:bg-orange-400"
            >
              Request a quote
            </a>

            <a
              href="#services"
              className="rounded-full border border-white/20 px-7 py-3 font-bold hover:border-orange-500"
            >
              View services
            </a>
          </div>
        </div>

        <div
          id="services"
          className="grid gap-3 border-t border-white/10 pt-8 sm:grid-cols-2 lg:grid-cols-6"
        >
          {services.map((service) => (
            <div
              key={service}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
            >
              <p className="font-bold">{service}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="contact" className="border-t border-white/10 px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-black">Need metalwork done?</h2>
          <p className="mt-3 max-w-2xl text-neutral-300">
            Send details of the job and we’ll come back to you with the next
            step.
          </p>
        </div>
      </section>
    </main>
  );
}