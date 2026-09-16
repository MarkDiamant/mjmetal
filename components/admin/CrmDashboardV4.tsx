"use client";

import { useEffect } from "react";
import CrmDashboardV3 from "@/components/admin/CrmDashboardV3";

function money(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

function SubcontractorDueEnhancer() {
  useEffect(() => {
    let cancelled = false;
    let jobs: Array<{ reference: string; subcontractorOutstanding?: number }> = [];

    const apply = () => {
      if (cancelled || !jobs.length) return;
      for (const job of jobs) {
        const due = Number(job.subcontractorOutstanding || 0);
        const marker = `sub-due-${job.reference}`;
        document.querySelectorAll(`[data-${marker}]`).forEach((node) => node.remove());
        if (!(due > 0)) continue;

        const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("button.grid.w-full"));
        const row = buttons.find((button) => button.firstElementChild?.textContent?.trim() === job.reference);
        if (!row) continue;
        const amountCell = row.children.item(5) as HTMLElement | null;
        if (!amountCell) continue;

        const span = document.createElement("span");
        span.setAttribute(`data-${marker}`, "1");
        span.className = "block text-xs font-bold text-violet-700";
        span.textContent = `Subcontractor due ${money(due)}`;
        amountCell.appendChild(span);
      }
    };

    void fetch("/api/admin/jobs", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Unable to load jobs")))
      .then((body) => {
        jobs = body.jobs || [];
        apply();
      })
      .catch(() => undefined);

    const observer = new MutationObserver(() => apply());
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("focus", apply);

    return () => {
      cancelled = true;
      observer.disconnect();
      window.removeEventListener("focus", apply);
    };
  }, []);

  return null;
}

export default function CrmDashboardV4() {
  return (
    <>
      <CrmDashboardV3 />
      <SubcontractorDueEnhancer />
    </>
  );
}
