export const DS_PRICING = {
  currency: "gbp",
  base: { monthly: 49, annual: 490, includedUsers: 2 },
  additionalUser: { monthly: 10, annual: 100 },
  aiAssistant: { monthly: 15, annual: 150 },
  annualMonthsCharged: 10,
} as const;

export type BillingInterval = "monthly" | "annual";

export function subscriptionAmount(interval: BillingInterval, licensedUsers: number, aiIncluded: boolean) {
  const users = Math.max(DS_PRICING.base.includedUsers, Math.floor(licensedUsers || DS_PRICING.base.includedUsers));
  const extras = users - DS_PRICING.base.includedUsers;
  const base = DS_PRICING.base[interval];
  const seats = extras * DS_PRICING.additionalUser[interval];
  const ai = aiIncluded ? DS_PRICING.aiAssistant[interval] : 0;
  return { users, extras, base, seats, ai, total: base + seats + ai };
}
