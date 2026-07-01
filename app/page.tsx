const services = [
  {
    title: "Gates",
    text: "Bespoke gates built for security, style and durability.",
    img: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Railings",
    text: "Contemporary or classic railings for any property.",
    img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Steel Staircases",
    text: "Precision engineered staircases built to last.",
    img: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Fire Escapes",
    text: "Safe, compliant and built to meet high standards.",
    img: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Fencing",
    text: "Strong, long lasting fencing to suit your space.",
    img: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Custom Fabrication",
    text: "Tailored metal solutions built exactly to your requirements.",
    img: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=900&q=80",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-neutral-950">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div>
          <div className="text-4xl font-black tracking-tight">
            M<span className="text-orange-600">&</span>J
          </div>
          <div className="tracking-[0.45em] text-sm font-bold">METAL</div>
          <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.22em] text-neutral-500">
            Built strong. Built to last.
          </div>
        </div>

        <nav className="hidden gap-10 text-sm font-bold uppercase md:flex">
          <a href="#services">Services</a>
          <a href="#projects">Projects</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </nav>

        <a
          href="#contact"
          className="rounded bg-orange-600 px-6 py-3 text-sm font-black uppercase text-white"
        >
          Get a quote
        </a>
      </header>

      <section className="relative overflow-hidden">
        <div
          className="absolute inset-y-0 right-0 hidden w-2/3 bg-cover bg-center md:block"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1600&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/20" />

        <div className="relative mx-auto max-w-7xl px-6 py-28">
          <p className="mb-4 text-lg font-black uppercase text-orange-600">
            Bespoke Metalwork
          </p>

          <h1 className="max-w-2xl text-6xl font-black uppercase leading-[0.95] tracking-tight md:text-7xl">
            Built Strong.
            <br />
            <span className="text-orange-600">Built to Last.</span>
          </h1>

          <p className="mt-8 max-w-md text-lg leading-8">
            M&J Metal designs, fabricates and installs high quality metalwork
            for homes and businesses across London and beyond.
          </p>

          <div className="mt-10 flex gap-4">
            <a
              href="#contact"
              className="rounded bg-orange-600 px-8 py-4 text-sm font-black uppercase text-white"
            >
              Get a quote
            </a>
            <a
              href="#services"
              className="rounded border-2 border-orange-600 px-8 py-4 text-sm font-black uppercase text-orange-600"
            >
              Our services
            </a>
          </div>
        </div>
      </section>

      <section id="services" className="mx-auto max-w-7xl px-6 py-20">
        <p className="font-black uppercase text-orange-600">What we do</p>
        <h2 className="mt-2 text-4xl font-black">Our Metalwork Services</h2>

        <div className="mt-8 grid gap-5 md:grid-cols-3 lg:grid-cols-6">
          {services.map((service) => (
            <div
              key={service.title}
              className="overflow-hidden rounded bg-white shadow-lg ring-1 ring-neutral-200"
            >
              <img
                src={service.img}
                alt={service.title}
                className="h-36 w-full object-cover"
              />
              <div className="p-4">
                <h3 className="text-sm font-black uppercase">{service.title}</h3>
                <p className="mt-2 text-sm leading-6 text-neutral-600">
                  {service.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="projects" className="mx-auto max-w-7xl px-6 pb-20">
        <div className="flex items-end justify-between">
          <div>
            <p className="font-black uppercase text-orange-600">Our work</p>
            <h2 className="mt-2 text-4xl font-black">Recent Projects</h2>
          </div>
          <a
            href="#contact"
            className="hidden rounded border-2 border-orange-600 px-8 py-3 text-sm font-black uppercase text-orange-600 md:block"
          >
            View all projects
          </a>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-4">
          {services.slice(0, 4).map((service) => (
            <img
              key={service.title}
              src={service.img}
              alt={service.title}
              className="h-44 w-full rounded object-cover"
            />
          ))}
        </div>
      </section>

      <section id="about" className="bg-neutral-50 px-6 py-20">
        <div className="mx-auto max-w-7xl text-center">
          <p className="font-black uppercase text-orange-600">
            Why choose M&J Metal?
          </p>
          <h2 className="mt-2 text-4xl font-black">
            Quality. Strength. Reliability.
          </h2>

          <div className="mt-12 grid gap-10 md:grid-cols-4">
            {[
              "Built to last",
              "Bespoke design",
              "Expert workmanship",
              "Residential & commercial",
            ].map((item) => (
              <div key={item}>
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border-2 border-orange-600 text-2xl font-black text-orange-600">
                  ✓
                </div>
                <h3 className="font-black uppercase">{item}</h3>
                <p className="mt-3 text-sm leading-6 text-neutral-600">
                  Professional metalwork designed around your project and built
                  to a high standard.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="bg-orange-600 px-6 py-10 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
          <div>
            <h2 className="text-3xl font-black uppercase">
              Ready to start your project?
            </h2>
            <p className="mt-2 text-white/90">
              Get in touch today for a free, no obligation quote.
            </p>
          </div>

          <a
            href="mailto:info@mjmetal.co.uk"
            className="rounded bg-white px-10 py-4 text-sm font-black uppercase text-orange-600"
          >
            Get a quote
          </a>
        </div>
      </section>

      <footer className="bg-neutral-950 px-6 py-12 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-3">
          <div>
            <div className="text-4xl font-black">
              M<span className="text-orange-600">&</span>J
            </div>
            <div className="tracking-[0.45em] text-sm font-bold">METAL</div>
          </div>

          <div>
            <h3 className="font-black uppercase">Services</h3>
            <p className="mt-4 leading-7 text-neutral-400">
              Gates
              <br />
              Railings
              <br />
              Steel Staircases
              <br />
              Fire Escapes
              <br />
              Fencing
              <br />
              Custom Fabrication
            </p>
          </div>

          <div>
            <h3 className="font-black uppercase">Contact</h3>
            <p className="mt-4 leading-7 text-neutral-400">
              info@mjmetal.co.uk
              <br />
              London, UK
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}