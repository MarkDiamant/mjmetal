"use client";

import { useState } from "react";

type Status = "idle" | "sending" | "sent" | "error";

export default function QuoteForm() {
  const [status, setStatus] = useState<Status>("idle");

async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();

  const form = event.currentTarget;

  setStatus("sending");

  try {
    const formData = new FormData(form);

    const response = await fetch("/api/quote", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error("API returned success=false");
    }

    form.reset();
    setStatus("sent");
  } catch (err) {
    console.error("QUOTE FORM:", err);
    setStatus("error");
  }
}

  return (
<form
      onSubmit={handleSubmit}
      className="mt-10 grid w-full min-w-0 max-w-full gap-4 rounded-3xl bg-white p-6 text-neutral-950 shadow-sm"
>
      <div className="grid gap-4 md:grid-cols-2">
        <input name="name" required placeholder="Your name" className="w-full rounded border border-neutral-300 px-4 py-3" />
        <input name="phone" required placeholder="Phone number" className="w-full rounded border border-neutral-300 px-4 py-3" />
      </div>

      <input name="email" type="email" placeholder="Email address" className="w-full rounded border border-neutral-300 px-4 py-3" />

      <textarea name="message" required rows={5} placeholder="Tell us what you need..." className="w-full rounded border border-neutral-300 px-4 py-3" />

      <input
  name="files"
  type="file"
  multiple
  accept="image/*,.pdf"
  className="block w-full min-w-0 rounded border border-neutral-300 bg-white px-4 py-3 text-sm file:mr-4 file:rounded file:border-0 file:bg-orange-600 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-orange-700"
/>

      <button
        type="submit"
        disabled={status === "sending"}
        className="inline-flex items-center justify-center rounded bg-orange-600 px-8 py-4 text-sm font-semibold uppercase tracking-wide text-white hover:bg-orange-700 disabled:opacity-60"
      >
        {status === "sending" ? "Sending..." : "Send quote request"}
      </button>

      {status === "sent" && (
        <p className="font-semibold text-green-700">
          Thanks, your quote request has been sent.
        </p>
      )}

      {status === "error" && (
        <p className="font-semibold text-red-700">
          Something went wrong. Please call Mark or Jonathan.
        </p>
      )}
    </form>
  );
}