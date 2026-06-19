import { RentalPlan } from '../types';

export const TAX_RATE = 0.05;

/** Optional add-ons, priced per rental day. */
export const EXTRAS_CATALOG: Record<string, number> = {
  gps: 5,
  child_seat: 7,
  additional_driver: 10,
  insurance: 15,
};

/** Promo codes → fractional discount applied to the base rental price. */
export const DISCOUNTS: Record<string, number> = {
  WELCOME10: 0.1,
  SUMMER20: 0.2,
};

interface VehiclePricing {
  daily: number;
  weekly?: number;
  monthly?: number;
}

export interface PriceBreakdown {
  base: number;
  extras: number;
  discount: number;
  tax: number;
  lateFee: number;
  total: number;
}

export function rentalDays(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  return Math.max(1, Math.ceil(ms / 86_400_000));
}

function basePrice(plan: RentalPlan, days: number, pricing: VehiclePricing): number {
  switch (plan) {
    case 'monthly':
      return (pricing.monthly ?? pricing.daily * 30) * Math.max(1, Math.ceil(days / 30));
    case 'weekly':
      return (pricing.weekly ?? pricing.daily * 7) * Math.max(1, Math.ceil(days / 7));
    default:
      return pricing.daily * days;
  }
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

/** Computes the full price breakdown for a booking (excludes any late fee). */
export function computePrice(opts: {
  plan: RentalPlan;
  start: Date;
  end: Date;
  pricing: VehiclePricing;
  extras?: string[];
  discountCode?: string;
}): PriceBreakdown {
  const days = rentalDays(opts.start, opts.end);
  const base = round2(basePrice(opts.plan, days, opts.pricing));

  const extrasPerDay = (opts.extras ?? []).reduce(
    (sum, key) => sum + (EXTRAS_CATALOG[key] ?? 0),
    0,
  );
  const extras = round2(extrasPerDay * days);

  const discountRate = opts.discountCode ? (DISCOUNTS[opts.discountCode.toUpperCase()] ?? 0) : 0;
  const discount = round2(base * discountRate);

  const taxable = base + extras - discount;
  const tax = round2(taxable * TAX_RATE);
  const total = round2(taxable + tax);

  return { base, extras, discount, tax, lateFee: 0, total };
}
