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

function dateLabel(value?: string) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

type JobSummary = { reference: string; subcontractorOutstanding?: number };
type SubPayment = {
  id: string;
  payment_type?: string;
  amount: number | string;
  paid_at?: string;
  created_at?: string;
  personName: string;
  assignmentId?: string | null;
};

function DashboardEnhancer() {
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let jobs: JobSummary[] = [];
    const loadingHistory = new Set<string>();

    const applyDueLines = () => {
      if (cancelled || !jobs.length) return;
      const rowButtons = Array.from(document.querySelectorAll<HTMLButtonElement>("button.grid.w-full"));
      for (const job of jobs) {
        const row = rowButtons.find((button) => button.firstElementChild?.textContent?.trim() === job.reference);
        if (!row) continue;
        const amountCell = row.children.item(5) as HTMLElement | null;
        if (!amountCell) continue;
        const due = Number(job.subcontractorOutstanding || 0);
        let line = amountCell.querySelector<HTMLElement>(`[data-sub-due="${job.reference}"]`);
        if (!(due > 0)) {
          if (line) line.remove();
          continue;
        }
        if (!line) {
          line = document.createElement("span");
          line.dataset.subDue = job.reference;
          line.className = "block text-xs font-bold text-violet-700";
          amountCell.appendChild(line);
        }
        const text = `Subcontractor due ${money(due)}`;
        if (line.textContent !== text) line.textContent = text;
      }
    };

    const refreshHistory = async (reference: string, container: HTMLElement) => {
      if (loadingHistory.has(reference) || container.querySelector(`[data-sub-history-ref="${reference}"]`)) return;
      loadingHistory.add(reference);
      try {
        const response = await fetch(`/api/admin/jobs/${encodeURIComponent(reference)}/subcontractor-payments`, { cache: "no-store" });
        if (!response.ok || cancelled) return;
        const body = await response.json();
        const items = (body.items || []) as SubPayment[];
        if (!items.length || cancelled || container.querySelector(`[data-sub-history-ref="${reference}"]`)) return;

        const groups = new Map<string, SubPayment[]>();
        for (const item of items) {
          const key = item.personName || "Subcontractor";
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key)!.push(item);
        }

        for (const [personName, payments] of groups) {
          const nameNode = Array.from(container.querySelectorAll("b")).find((node) => node.textContent?.trim() === personName);
          const card = nameNode?.closest<HTMLElement>(".rounded-xl.border");
          if (!card || card.querySelector(`[data-sub-history-person="${CSS.escape(personName)}"]`)) continue;

          const history = document.createElement("div");
          history.dataset.subHistoryRef = reference;
          history.dataset.subHistoryPerson = personName;
          history.className = "mt-3 overflow-hidden rounded-xl border border-black/10";

          const heading = document.createElement("div");
          heading.className = "grid grid-cols-[1fr_auto_auto_auto] gap-3 bg-[#f7f7f4] px-3 py-2 text-[10px] font-black uppercase tracking-[0.08em] text-black/40";
          heading.innerHTML = "<span>Payment</span><span>Date paid</span><span>Amount</span><span>Actions</span>";
          history.appendChild(heading);

          for (const payment of payments) {
            const row = document.createElement("div");
            row.className = "grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 border-t border-black/8 px-3 py-2 text-xs";

            const type = document.createElement("span");
            type.className = "font-bold";
            type.textContent = payment.payment_type || "Subcontractor payment";
            const date = document.createElement("span");
            date.className = "text-black/55";
            date.textContent = dateLabel(payment.paid_at || payment.created_at);
            const amount = document.createElement("b");
            amount.textContent = money(Number(payment.amount || 0));
            const actions = document.createElement("span");
            actions.className = "flex gap-1";

            const edit = document.createElement("button");
            edit.type = "button";
            edit.className = "rounded-md border border-black/10 px-2 py-1 font-bold";
            edit.textContent = "Edit";
            edit.onclick = async (event) => {
              event.stopPropagation();
              const typeValue = prompt("Payment type", payment.payment_type || "Subcontractor payment");
              if (typeValue === null) return;
              const amountValue = prompt("Payment amount (£)", String(payment.amount ?? ""));
              if (amountValue === null) return;
              const numericAmount = Number(amountValue);
              if (!Number.isFinite(numericAmount) || numericAmount < 0) return;
              const currentDate = payment.paid_at ? new Date(payment.paid_at).toISOString().slice(0, 10) : "";
              const paidDate = prompt("Date paid (YYYY-MM-DD)", currentDate);
              if (paidDate === null) return;
              const result = await fetch(`/api/admin/jobs/${encodeURIComponent(reference)}/payments/${encodeURIComponent(payment.id)}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ payment_type: typeValue, amount: numericAmount, paid_at: paidDate ? new Date(`${paidDate}T12:00:00`).toISOString() : null }),
              });
              if (result.ok) window.location.reload();
            };

            const remove = document.createElement("button");
            remove.type = "button";
            remove.className = "rounded-md border border-red-200 bg-red-50 px-2 py-1 font-bold text-red-700";
            remove.textContent = "Delete";
            remove.onclick = async (event) => {
              event.stopPropagation();
              if (!confirm(`Delete subcontractor payment of ${money(Number(payment.amount || 0))}?`)) return;
              const result = await fetch(`/api/admin/jobs/${encodeURIComponent(reference)}/payments/${encodeURIComponent(payment.id)}`, { method: "DELETE" });
              if (result.ok) window.location.reload();
            };

            actions.append(edit, remove);
            row.append(type, date, amount, actions);
            history.appendChild(row);
          }
          card.appendChild(history);
        }
      } finally {
        loadingHistory.delete(reference);
      }
    };

    const applyHistories = () => {
      const headings = Array.from(document.querySelectorAll<HTMLHeadingElement>("h2"));
      for (const heading of headings) {
        const reference = heading.textContent?.trim() || "";
        if (!/^MJ\d{3}$/.test(reference)) continue;
        const quickPanel = heading.closest<HTMLElement>(".border-t");
        if (!quickPanel) continue;
        const section = Array.from(quickPanel.querySelectorAll<HTMLElement>("section")).find((node) => node.querySelector("h3")?.textContent?.includes("Fabricators / installers / subcontractors"));
        if (section) void refreshHistory(reference, section);
      }
    };

    const apply = () => {
      applyDueLines();
      applyHistories();
    };

    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(apply, 80);
    };

    void fetch("/api/admin/jobs", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Unable to load jobs")))
      .then((body) => {
        jobs = body.jobs || [];
        apply();
      })
      .catch(() => undefined);

    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("focus", schedule);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener("focus", schedule);
    };
  }, []);

  return null;
}

export default function CrmDashboardV4() {
  return (
    <>
      <CrmDashboardV3 />
      <DashboardEnhancer />
    </>
  );
}
