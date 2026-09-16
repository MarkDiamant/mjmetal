export type Manager = "MD" | "JB";

export type JobStatus =
  | "new_enquiry"
  | "awaiting_information"
  | "site_visit_required"
  | "site_visit_booked"
  | "estimate_preparing"
  | "estimate_sent"
  | "quote_preparing"
  | "quote_sent"
  | "awaiting_customer"
  | "interested_not_ready"
  | "customer_unsure"
  | "confirmed"
  | "deposit_requested"
  | "deposit_paid"
  | "materials_ordered"
  | "fabrication"
  | "installation_scheduled"
  | "in_progress"
  | "awaiting_final_payment"
  | "completed"
  | "declined";

export type JobType =
  | "Driveway Gate"
  | "Side Passage Gate"
  | "Commercial Gate"
  | "Gate Automation"
  | "Railings"
  | "Window Grille"
  | "Bar Grille Door"
  | "Retractable Security Gate"
  | "Fencing"
  | "Staircase"
  | "Fire Escape"
  | "Bespoke Fabrication"
  | "Repair"
  | "Other";

export type FinishType =
  | "Primed"
  | "Painted"
  | "Spray painted"
  | "Powder coated"
  | "Galvanised"
  | "Zinc primer"
  | "Stainless steel"
  | "Brushed stainless"
  | "Polished stainless"
  | "Raw steel"
  | "Other";

export type EnquirySource =
  | "WhatsApp"
  | "Email"
  | "Website"
  | "Referral"
  | "Existing customer"
  | "Phone"
  | "Other";

export type PaymentMethod = "Bank transfer" | "Cash" | "Card" | "Other";

export interface Customer {
  id: string;
  firstName: string;
  lastName?: string;
  phone?: string;
  email?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postcode?: string;
  notes?: string;
  createdAt: string;
}

export interface Job {
  id: string;
  reference: string;
  customerId: string;
  customerName: string;
  address: string;
  postcode?: string;
  phone?: string;
  email?: string;
  jobType: JobType;
  status: JobStatus;
  manager: Manager;
  source: EnquirySource;
  enquiryAt: string;
  finishes: FinishType[];
  colour?: string;
  dimensions?: string;
  material?: string;
  customerRequirements?: string;
  internalNotes?: string;
  siteVisitRequired: boolean;
  siteVisitAt?: string;
  siteVisitCompletedAt?: string;
  preliminaryEstimate?: number;
  preliminaryEstimateSentAt?: string;
  quotedAmount?: number;
  quoteSentAt?: string;
  agreedAmount?: number;
  depositRequired?: number;
  depositPaid?: number;
  paymentMethod?: PaymentMethod;
  nextAction?: string;
  nextActionAt?: string;
  scheduledAt?: string;
  expectedCompletionAt?: string;
  completedAt?: string;
  balanceOutstanding?: number;
  subcontractorName?: string;
  materialsOrdered: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  jobId: string;
  type: "note" | "call" | "whatsapp" | "email" | "status" | "payment" | "site_visit" | "system";
  occurredAt: string;
  actor: Manager | "System";
  summary: string;
  details?: string;
  nextActionAt?: string;
}
