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

export function applyDefaultCommissionAndTax(
  amountPaid: number,
  commissionPercent: number,
  taxPercent: number
) {
  return {
    platformCommission: roundMoney((amountPaid * commissionPercent) / 100),
    taxes: roundMoney((amountPaid * taxPercent) / 100),
  };
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
