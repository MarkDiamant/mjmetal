"use client";

import { useEffect } from "react";
import CrmDashboardV4 from "@/components/admin/CrmDashboardV4";

function MobileQuickEditFix() {
  useEffect(() => {
    const style = document.createElement("style");
    style.dataset.mjMobileQuickEditFix = "1";
    style.textContent = `
      @media (max-width: 767px) {
        body { overflow-x: hidden; }
        main, main > div, main section, main form, main label, main input, main select, main textarea { min-width: 0; max-width: 100%; }
        main input, main select, main textarea { box-sizing: border-box; }
        main .overflow-hidden { max-width: 100%; }
        main .border-t.border-\[\#e66a24\]\/20 { min-width: 0; max-width: 100%; overflow-x: hidden; padding-left: 0.75rem; padding-right: 0.75rem; }
        main .border-t.border-\[\#e66a24\]\/20 > div { min-width: 0; max-width: 100%; }
        main .border-t.border-\[\#e66a24\]\/20 section { width: 100%; min-width: 0; max-width: 100%; overflow-x: hidden; }
        main .border-t.border-\[\#e66a24\]\/20 .grid { min-width: 0; max-width: 100%; }
        main .border-t.border-\[\#e66a24\]\/20 [class*="grid-cols-["] { grid-template-columns: minmax(0, 1fr) !important; }
        main .border-t.border-\[\#e66a24\]\/20 .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        main .border-t.border-\[\#e66a24\]\/20 .flex { min-width: 0; max-width: 100%; }
        main .border-t.border-\[\#e66a24\]\/20 button, main .border-t.border-\[\#e66a24\]\/20 a { max-width: 100%; }

        /* Payment history rows: keep all record content inside the mobile card. */
        main .border-t.border-\[\#e66a24\]\/20 section .overflow-hidden.rounded-xl.border { overflow-x: hidden; }
        main .border-t.border-\[\#e66a24\]\/20 section .overflow-hidden.rounded-xl.border > .grid {
          grid-template-columns: minmax(0, 1fr) !important;
          gap: 0.25rem !important;
          align-items: start !important;
        }
        main .border-t.border-\[\#e66a24\]\/20 section .overflow-hidden.rounded-xl.border > .grid > * {
          min-width: 0;
          max-width: 100%;
          overflow-wrap: anywhere;
        }
        main .border-t.border-\[\#e66a24\]\/20 section .overflow-hidden.rounded-xl.border > .grid > .flex {
          width: 100%;
          flex-wrap: wrap;
          justify-content: flex-start;
        }
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);
  return null;
}

function LostRowHighlight() {
  useEffect(() => {
    const apply = () => {
      const rows = Array.from(
        document.querySelectorAll<HTMLButtonElement>("button.grid.w-full"),
      );

      for (const row of rows) {
        const statusText = Array.from(row.querySelectorAll("span"))
          .map((node) => node.textContent?.trim())
          .find((text) => text === "Declined / lost" || text === "Cancelled");
        if (!statusText) continue;

        const card = row.parentElement as HTMLElement | null;
        if (!card) continue;

        card.style.backgroundColor = "#fee2e2";
        card.style.borderColor = "#fca5a5";
      }
    };

    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return null;
}

export default function CrmDashboardV5() {
  return (
    <>
      <CrmDashboardV4 />
      <MobileQuickEditFix />
      <LostRowHighlight />
    </>
  );
}
