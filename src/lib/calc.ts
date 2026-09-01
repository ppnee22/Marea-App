import { differenceInCalendarDays } from "date-fns";

export type Decimalish = number | string | { toString(): string };

export function toNumber(value: Decimalish | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  const n = Number(value.toString());
  return Number.isFinite(n) ? n : 0;
}

export function nightsBetween(checkIn: Date, checkOut: Date): number {
  const nights = differenceInCalendarDays(checkOut, checkIn);
  return nights > 0 ? nights : 0;
}

export interface BookingLike {
  amountPaid: Decimalish;
  platformCommission: Decimalish;
  taxes: Decimalish;
  otherDeductions: Decimalish;
}

/** Guadagno netto di una prenotazione, al netto delle spese collegate (che vanno passate a parte). */
export function bookingGrossProfit(booking: BookingLike): number {
  return (
    toNumber(booking.amountPaid) -
    toNumber(booking.platformCommission) -
    toNumber(booking.taxes) -
    toNumber(booking.otherDeductions)
  );
}

export function bookingNetProfit(booking: BookingLike, expensesTotal: Decimalish = 0): number {
  return bookingGrossProfit(booking) - toNumber(expensesTotal);
}

export function sumBy<T>(items: T[], get: (item: T) => Decimalish): number {
  return items.reduce((acc, item) => acc + toNumber(get(item)), 0);
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export interface PlatformRatesInput {
  commissionPercent: number; // commissione host (Airbnb) o commissione piattaforma (Booking)
  transactionFeePercent: number; // costo transazione, tipicamente solo Booking (0 per Airbnb)
  vatPercent: number; // IVA applicata sulla commissione (+ costo transazione)
  taxPercent: number; // ritenuta fiscale / cedolare secca
}

/**
 * Calcola commissioni, IVA e tasse secondo le regole reali delle piattaforme:
 * - Airbnb: commissione host + IVA sulla commissione
 * - Booking: commissione + costo transazione, IVA su entrambi
 * In entrambi i casi platformCommission memorizzata = commissione + costoTransazione + IVA.
 */
export function applyDefaultCommissionAndTax(amountPaid: number, rates: PlatformRatesInput) {
  const commission = (amountPaid * rates.commissionPercent) / 100;
  const transactionFee = (amountPaid * rates.transactionFeePercent) / 100;
  const vat = ((commission + transactionFee) * rates.vatPercent) / 100;
  return {
    commission: roundMoney(commission),
    transactionFee: roundMoney(transactionFee),
    vat: roundMoney(vat),
    platformCommission: roundMoney(commission + transactionFee + vat),
    taxes: roundMoney((amountPaid * rates.taxPercent) / 100),
  };
}

export function computeCityTax(nights: number, guests: number, ratePerGuestPerNight: number): number {
  return roundMoney(nights * guests * ratePerGuestPerNight);
}

export const MONTH_NAMES_IT = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre",
];

export function monthLabel(month: number): string {
  return MONTH_NAMES_IT[month - 1] ?? String(month);
}
