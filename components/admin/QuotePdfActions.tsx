"use client";

import { useState } from "react";

export default function QuotePdfActions({ reference, quoteId }: { reference: string; quoteId: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function generate() {
    setBusy(true); setMessage("");
    const response = await fetch(`/api/admin/jobs/${encodeURIComponent(reference)}/quotes/${encodeURIComponent(quoteId)}/pdf`, { method: "POST" });
    const body = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) { setMessage(body.error || "Could not generate PDF"); return; }
    setMessage("PDF saved to job files");
    if (body.url) window.open(body.url, "_blank", "noopener,noreferrer");
  }

  return <div className="fixed bottom-5 left-5 z-50 flex items-center gap-2 print:hidden"><button onClick={() => void generate()} disabled={busy} className="rounded-xl bg-[#141414] px-4 py-3 text-sm font-black text-white shadow-lg disabled:opacity-50">{busy ? "Generating..." : "Generate & save PDF"}</button>{message && <span className="rounded-xl bg-white px-3 py-2 text-xs font-bold shadow">{message}</span>}</div>;
}
