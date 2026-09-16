import type { FinishType, JobStatus, JobType } from "./types";

export const JOB_TYPES: JobType[] = [
  "Driveway Gate",
  "Side Passage Gate",
  "Commercial Gate",
  "Gate Automation",
  "Railings",
  "Pool Mesh Cover",
  "Window Grille",
  "Bar Grille Door",
  "Retractable Security Gate",
  "Fencing",
  "Staircase",
  "Fire Escape",
  "Bespoke Fabrication",
  "Repair",
  "Other",
];

export const FINISH_TYPES: FinishType[] = [
  "Primed",
  "Painted",
  "Spray painted",
  "Powder coated",
  "Galvanised",
  "Zinc primer",
  "Stainless steel",
  "Brushed stainless",
  "Polished stainless",
  "Raw steel",
  "Other",
];

export const STATUS_META: Record<JobStatus, { label: string; order: number; group: "active" | "scheduled" | "closed" }> = {
  new_enquiry: { label: "New enquiry", order: 10, group: "active" },
  awaiting_information: { label: "Awaiting information", order: 20, group: "active" },
  site_visit_required: { label: "Site visit required", order: 30, group: "active" },
  site_visit_booked: { label: "Site visit booked", order: 40, group: "active" },
  estimate_preparing: { label: "Preparing estimate", order: 50, group: "active" },
  estimate_sent: { label: "Estimate sent", order: 60, group: "active" },
  quote_preparing: { label: "Preparing quote", order: 70, group: "active" },
  quote_sent: { label: "Quote sent", order: 80, group: "active" },
  awaiting_customer: { label: "Awaiting customer", order: 90, group: "active" },
  interested_not_ready: { label: "Interested, not ready", order: 100, group: "active" },
  customer_unsure: { label: "Customer unsure", order: 110, group: "active" },
  confirmed: { label: "Confirmed", order: 120, group: "active" },
  deposit_requested: { label: "Deposit requested", order: 130, group: "active" },
  deposit_paid: { label: "Deposit paid", order: 140, group: "active" },
  materials_ordered: { label: "Materials ordered", order: 150, group: "active" },
  fabrication: { label: "Fabrication", order: 160, group: "active" },
  installation_scheduled: { label: "Installation scheduled", order: 800, group: "scheduled" },
  in_progress: { label: "In progress", order: 170, group: "active" },
  awaiting_final_payment: { label: "Invoiced / payment due", order: 180, group: "active" },
  completed: { label: "Completed", order: 900, group: "closed" },
  declined: { label: "Declined / lost", order: 1000, group: "closed" },
  cancelled: { label: "Cancelled", order: 1010, group: "closed" },
};

export const ALL_STATUSES = Object.entries(STATUS_META)
  .sort(([, a], [, b]) => a.order - b.order)
  .map(([value, meta]) => ({ value: value as JobStatus, label: meta.label }));
