import Image from "next/image";
import QuoteForm from "@/components/QuoteForm";

const currentYear = new Date().getFullYear();

const services = [
  {
    title: "Driveway Gates",
    text: "Strong, secure and professionally finished gates for residential properties.",
    image: "/images/driveway-gate.jpeg",
  },
{
  title: "Commercial Gates",
  text: "Heavy-duty gates manufactured for commercial, industrial and multi-site premises.",
  image: "/images/commercial.jpg",
},
  {
    title: "Gate Automation",
    text: "Automated gate systems for convenience, security and everyday use.",
    image: "/images/gate.jpeg",
  },
{
  title: "Side Passage Gates",
  text: "Secure steel side gates designed to protect side access while complementing your property.",
  image: "/images/side-passage.jpg",
},
  {
    title: "Bar Grille Doors",
    text: "Security grille doors built for strength, protection and durability.",
    image: "/images/bar-grille-door.jpeg",
  },
  {
    title: "Security Window Grilles",
    text: "Bespoke window grilles made to measure for added protection.",
    image: "/images/security-window-grille.jpeg",
  },
  {
    title: "Retractable Security Gates",
    text: "Practical retractable gates for doors, windows and commercial spaces.",
    image: "/images/retractable-security-gate.jpeg",
  },
  {
    title: "High Quality Railings",
    text: "Clean, strong and stylish railings made to suit your property.",
    image: "/images/high-quality-railing.jpeg",
  },
  {
    title: "Bespoke Fabrication",
    text: "Including steel staircases, fire escapes and custom metalwork projects.",
    image: "/images/bespoke-fabrication.jpeg",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-neutral-950">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
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
          <a href="#about" className="hover:text-orange-600">About</a>
          <a href="#contact" className="hover:text-orange-600">Contact</a>
        </nav>

        <a
          href="#contact"
          className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded bg-orange-600 px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-white hover:bg-orange-700 sm:px-5 sm:py-3 sm:text-sm"
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

        <div className="relative mx-auto max-w-7xl px-6 py-16 sm:py-24">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-orange-600">
            Bespoke Gates & Metalwork
          </p>

          <h1 className="max-w-2xl text-5xl font-black uppercase leading-[0.95] tracking-tight sm:text-7xl">
            Built Strong.
            <br />
            <span className="text-orange-600">Built to Last.</span>
          </h1>

          <p className="mt-8 max-w-md text-lg leading-8 text-neutral-700">
            Driveway gates, security gates, railings, grilles, automation and access control across London and the South East.
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

      <section id="services" className="mx-auto max-w-7xl px-6 py-10 sm:py-14">
        <p className="font-black uppercase text-orange-600">What we do</p>
        <h2 className="mt-2 text-4xl font-black">Gates & Security Metalwork</h2>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
{services.map((service) => (
  <div
    key={service.title}
    className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm"
  >
    <div className="relative h-44 w-full">
      <Image
        src={service.image}
        alt={service.title}
        fill
        className="object-cover"
      />
    </div>

    <div className="p-6">
      <h3 className="font-semibold text-neutral-950">{service.title}</h3>
      <p className="mt-3 text-sm leading-6 text-neutral-600">
        {service.text}
      </p>
    </div>
  </div>
))}
        </div>
      </section>

      <section id="about" className="mx-auto max-w-7xl px-6 py-10 sm:py-14 text-center">
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

      <section id="company" className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="font-black uppercase text-orange-600">
              About M&J Metal
            </p>
            <h2 className="mt-2 text-4xl font-black">
              Gates, grilles and security metalwork built properly.
            </h2>
          </div>

          <p className="text-lg leading-8 text-neutral-700">
M&J Metal specialises in driveway gates, security gates, railings,
bar grille doors, window grilles, retractable security gates,
automation and access control systems. We also undertake bespoke
metal fabrication, steel staircases and fire escapes, delivering
high quality workmanship for both residential and commercial
projects.
          </p>
        </div>
      </section>

      <section id="contact" className="bg-orange-600 px-6 py-16 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-2xl">
            <h2 className="text-3xl font-black uppercase">
              Speak to our team
            </h2>
            <p className="mt-2 text-white/90">
              Get in touch today to discuss your project or request a quote.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl bg-white p-6 text-neutral-950 shadow-sm">
              <Image
                src="/images/team/mark.png"
                alt="Mark from M&J Metal"
                width={500}
                height={500}
                className="w-full rounded-2xl border border-neutral-200 object-contain bg-neutral-100 p-3"
              />
              <h3 className="mt-5 text-2xl font-black">Mark</h3>
<p className="mt-1 text-sm font-semibold uppercase tracking-wide text-orange-600">
  Director
</p>
              <a
                href="tel:07784468113"
                className="mt-4 inline-block rounded bg-orange-600 px-6 py-3 text-sm font-black uppercase text-white hover:bg-orange-700"
              >
                Call Mark
              </a>
              <p className="mt-3 text-lg font-bold">07784 468113</p>
<a
  href="mailto:mark@mjmetal.co.uk"
  className="mt-2 block text-sm text-neutral-600 hover:text-orange-600"
>
  mark@mjmetal.co.uk
</a>
            </div>

            <div className="rounded-3xl bg-white p-6 text-neutral-950 shadow-sm">
              <Image
                src="/images/team/jonathan.png"
                alt="Jonathan from M&J Metal"
                width={500}
                height={500}
                className="w-full rounded-2xl border border-neutral-200 object-contain bg-neutral-100 p-3"
              />
              <h3 className="mt-5 text-2xl font-black">Jonathan</h3>
<p className="mt-1 text-sm font-semibold uppercase tracking-wide text-orange-600">
  Director
</p>
              <a
                href="tel:07834826608"
                className="mt-4 inline-block rounded bg-orange-600 px-6 py-3 text-sm font-black uppercase text-white hover:bg-orange-700"
              >
                Call Jonathan
              </a>
              <p className="mt-3 text-lg font-bold">07834 826608</p>
<a
  href="mailto:jonathan@mjmetal.co.uk"
  className="mt-2 block text-sm text-neutral-600 hover:text-orange-600"
>
  jonathan@mjmetal.co.uk
</a>
            </div>
          </div>

<QuoteForm />
        </div>
      </section>

      <footer className="border-t border-neutral-200 bg-white px-6 py-10 text-neutral-800">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 md:grid-cols-3">
<div className="col-span-2 md:col-span-1">
  <Image
    src="/images/logo.png"
    alt="M&J Metal"
    width={220}
    height={100}
    className="h-auto w-44"
  />
</div>

          <div>
            <h3 className="font-black uppercase">Services</h3>
            <p className="mt-3 text-sm leading-7 text-neutral-600">
Driveway Gates<br />
Security Gates<br />
Gate Automation<br />
Access Control Systems<br />
Bar Grille Doors<br />
Security Window Grilles<br />
Retractable Security Gates<br />
High Quality Railings
            </p>
          </div>

          <div>
            <h3 className="font-black uppercase">Contact</h3>
<p className="mt-3 text-sm leading-7 text-neutral-600">
  info@mjmetal.co.uk<br />
  Office 6, 1st Floor, Sutherland House<br />
  70–78 West Hendon Broadway<br />
  London, NW9 7BT<br />
  United Kingdom
</p>
          </div>
        </div>
        <div className="mx-auto mt-10 max-w-7xl border-t border-neutral-200 pt-6 text-sm text-neutral-500">
  © {currentYear} M&J Metal. All rights reserved.
</div>
      </footer>
    </main>
  );
}