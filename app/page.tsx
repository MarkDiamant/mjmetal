import Image from "next/image";

const services = [
  "Gates",
  "Railings",
  "Steel Staircases",
  "Fire Escapes",
  "Fencing",
  "Custom Fabrication",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-neutral-950">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Image
          src="/images/logo.png"
          alt="M&J Metal"
          width={180}
          height={80}
          priority
          className="h-auto w-52 sm:w-64 lg:w-72"
        />

        <nav className="hidden items-center gap-10 text-sm font-bold uppercase md:flex">
          <a href="#services" className="hover:text-orange-600">Services</a>
          <a href="#projects" className="hover:text-orange-600">Projects</a>
          <a href="#about" className="hover:text-orange-600">About</a>
          <a href="#contact" className="hover:text-orange-600">Contact</a>
        </nav>

        <a
          href="#contact"
          className="rounded bg-orange-600 px-5 py-3 text-sm font-black uppercase text-white hover:bg-orange-700"
        >
          Get a quote
        </a>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-y-0 right-0 hidden w-2/3 md:block">
          <Image
            src="/images/hero-gate.png"
            alt="Modern black metal driveway gate"
            fill
            priority
            className="object-cover"
          />
        </div>

        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/20" />

        <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32">
          <p className="mb-4 text-base font-black uppercase text-orange-600">
            Bespoke Gates & Metalwork
          </p>

          <h1 className="max-w-2xl text-5xl font-black uppercase leading-[0.95] tracking-tight sm:text-7xl">
            Built Strong.
            <br />
            <span className="text-orange-600">Built to Last.</span>
          </h1>

          <p className="mt-8 max-w-md text-lg leading-8 text-neutral-700">
            Designed, fabricated and installed across London and the South East.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="#contact"
              className="rounded bg-orange-600 px-8 py-4 text-sm font-black uppercase text-white hover:bg-orange-700"
            >
              Get a quote
            </a>

            <a
              href="#services"
              className="rounded border-2 border-orange-600 px-8 py-4 text-sm font-black uppercase text-orange-600 hover:bg-orange-50"
            >
              Our services
            </a>
          </div>
        </div>
      </section>

      <section id="services" className="mx-auto max-w-7xl px-6 py-20">
        <p className="font-black uppercase text-orange-600">What we do</p>
        <h2 className="mt-2 text-4xl font-black">Our Metalwork Services</h2>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <div
              key={service}
              className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
            >
              <h3 className="font-black uppercase">{service}</h3>
              <p className="mt-3 text-sm leading-6 text-neutral-600">
                High quality metalwork designed for strength, style and long
                lasting performance.
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="projects" className="bg-neutral-50 px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <p className="font-black uppercase text-orange-600">Our work</p>
          <h2 className="mt-2 text-4xl font-black">Recent Projects</h2>

          <div className="mt-8 overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
            <Image
              src="/images/hero-gate.png"
              alt="M&J Metal gate project"
              width={1400}
              height={700}
              className="h-auto w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section id="about" className="mx-auto max-w-7xl px-6 py-20 text-center">
        <p className="font-black uppercase text-orange-600">
          Why choose M&J Metal?
        </p>

        <h2 className="mt-2 text-4xl font-black">
          Quality. Strength. Reliability.
        </h2>

        <div className="mt-12 grid gap-8 md:grid-cols-4">
          {[
            "Built to last",
            "Bespoke design",
            "Expert workmanship",
            "Residential & commercial",
          ].map((item) => (
            <div key={item}>
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border-2 border-orange-600 text-xl font-black text-orange-600">
                ✓
              </div>
              <h3 className="font-black uppercase">{item}</h3>
              <p className="mt-3 text-sm leading-6 text-neutral-600">
                Professional metalwork made carefully around your project.
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="contact" className="bg-orange-600 px-6 py-12 text-white">
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

      <footer className="border-t border-neutral-200 bg-white px-6 py-10 text-neutral-800">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-3">
          <Image
            src="/images/logo.png"
            alt="M&J Metal"
            width={150}
            height={70}
            className="h-auto w-32"
          />

          <div>
            <h3 className="font-black uppercase">Services</h3>
            <p className="mt-3 text-sm leading-7 text-neutral-600">
              Gates<br />
              Railings<br />
              Steel Staircases<br />
              Fire Escapes<br />
              Fencing<br />
              Custom Fabrication
            </p>
          </div>

          <div>
            <h3 className="font-black uppercase">Contact</h3>
            <p className="mt-3 text-sm leading-7 text-neutral-600">
              info@mjmetal.co.uk<br />
              London, UK
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}