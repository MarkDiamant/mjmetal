"use client";

import { useEffect } from "react";
import CrmDashboardV4 from "@/components/admin/CrmDashboardV4";

function MobileQuickEditFix() {
  useEffect(() => {
    const style = document.createElement("style");
    style.dataset.bmsMobileQuickEditFix = "1";
    style.textContent = `
      @media (max-width: 767px) {
        body { overflow-x: hidden; }
        main, main > div, main section, main form, main label, main input, main select, main textarea { min-width: 0; max-width: 100%; }
        main input, main select, main textarea { box-sizing: border-box; }
        main .overflow-hidden { max-width: 100%; }
        main [data-mobile-money-overview] { margin-bottom: 0.75rem; }
        main button.grid.w-full { grid-template-columns: minmax(0, 1fr) auto !important; column-gap: 0.75rem !important; row-gap: 0.65rem !important; align-items: center !important; }
        main button.grid.w-full > * { min-width: 0; }
        main button.grid.w-full > :nth-child(1), main button.grid.w-full > :nth-child(2), main button.grid.w-full > :nth-child(3), main button.grid.w-full > :nth-child(4) { grid-column: 1 / -1; }
        main button.grid.w-full > :nth-child(4) { justify-self: start; white-space: normal !important; line-height: 1.15; }
        main button.grid.w-full > :nth-child(5) { grid-column: 1; justify-self: start; }
        main button.grid.w-full > :nth-child(6) { grid-column: 2; justify-self: end; text-align: right; }
        main .border-t.border-\[\#e66a24\]\/20 { min-width: 0; max-width: 100%; overflow-x: hidden; padding-left: 0.75rem; padding-right: 0.75rem; }
        main .border-t.border-\[\#e66a24\]\/20 > div, main .border-t.border-\[\#e66a24\]\/20 section, main .border-t.border-\[\#e66a24\]\/20 .grid, main .border-t.border-\[\#e66a24\]\/20 .flex { min-width: 0; max-width: 100%; }
        main .border-t.border-\[\#e66a24\]\/20 [class*="grid-cols-["] { grid-template-columns: minmax(0, 1fr) !important; }
        main .border-t.border-\[\#e66a24\]\/20 .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        main .border-t.border-\[\#e66a24\]\/20 button, main .border-t.border-\[\#e66a24\]\/20 a { max-width: 100%; }
      }
    `;
    document.head.appendChild(style);
    const moveMoney=()=>{const heading=Array.from(document.querySelectorAll<HTMLHeadingElement>("h2")).find(n=>n.textContent?.trim()==="Money overview");const section=heading?.closest<HTMLElement>("section");const filters=Array.from(document.querySelectorAll<HTMLElement>("main .rounded-2xl")).find(n=>n.querySelector('input[placeholder^="Search ref"]'));if(section&&filters&&window.innerWidth<1280&&!section.dataset.mobileMoneyOverview){section.dataset.mobileMoneyOverview="1";filters.parentElement?.insertBefore(section,filters);}};
    moveMoney();
    const observer=new MutationObserver(moveMoney);observer.observe(document.body,{childList:true,subtree:true});
    return () => {observer.disconnect();style.remove();};
  }, []);
  return null;
}

function LostRowHighlight() {
  useEffect(() => {
    const apply = () => {
      const rows = Array.from(document.querySelectorAll<HTMLButtonElement>("button.grid.w-full"));
      for (const row of rows) {
        const statusText = Array.from(row.querySelectorAll("span")).map((node) => node.textContent?.trim()).find((text) => text === "Declined / lost" || text === "Cancelled");
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
  return <><CrmDashboardV4/><MobileQuickEditFix/><LostRowHighlight/></>;
}
