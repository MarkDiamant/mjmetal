"use client";

import { useEffect } from "react";
import CrmDashboardV4 from "@/components/admin/CrmDashboardV4";

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
      <LostRowHighlight />
    </>
  );
}
