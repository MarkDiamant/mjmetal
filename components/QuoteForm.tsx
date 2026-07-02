"use client";

import { useState } from "react";

export default function QuoteForm() {
  const [status, setStatus] = useState("idle");

  return (
    <form className="mt-10 grid gap-4 rounded-3xl bg-white p-6 text-neutral-950 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <input name="name" required placeholder="Your name" className="rounded border border-neutral-300 px-4 py-3" />
        <input name="phone" required placeholder="Phone number" className="rounded border border-neutral-300 px-4 py-3" />
      </div>

      <input name="email" type="email" placeholder="Email address" className="rounded border border-neutral-300 px-4 py-3" />

      <textarea
        name="message"
        required
        rows={5}
        placeholder="Tell us what you need..."
        className="rounded border border-neutral-300 px-4 py-3"
      />

      <input
        name="files"
        type="file"
        multiple
        accept="image/*,.pdf"
        className="rounded border border-neutral-300 bg-white px-4 py-3"
      />

      <button
        type="submit"
        className="inline-flex items-center justify-center rounded bg-orange-600 px-8 py-4 text-sm font-semibold uppercase tracking-wide text-white hover:bg-orange-700"
      >
        Send quote request
      </button>
    </form>
  );
}