"use client";

import { useState } from "react";

export default function QuotePdfActions({ reference, quoteId }: { reference: string; quoteId: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function generate() {
    setBusy(true); setMessage("Preparing PDF...");
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    try {
      const title = document.title;
      document.title = `${reference}-Quote`;
      window.print();
      document.title = title;
      setMessage("Use Save as PDF in the print window");
    } finally {
      setBusy(false);
      window.setTimeout(() => setMessage(""), 5000);
    }
  }

  return <div className="fixed bottom-5 left-5 z-50 flex items-center gap-2 print:hidden"><button id="save-quote-pdf" onClick={() => void generate()} disabled={busy} className="hidden">{busy ? "Preparing..." : "Save PDF"}</button>{message && <span className="rounded-xl bg-white px-3 py-2 text-xs font-bold shadow">{message}</span>}</div>;
}
