import "server-only";
import { prisma } from "@/lib/prisma";
import { bookingNetProfit, nightsBetween, sumBy, toNumber } from "@/lib/calc";
import { addDays, startOfDay } from "date-fns";

export async function getSeasideProperty() {
  return prisma.property.findFirst({ where: { type: "SHORT_TERM" } });
}

export async function getMonthlyProperties(includeArchived = false) {
  return prisma.property.findMany({
    where: { type: "MONTHLY", ...(includeArchived ? {} : { archived: false }) },
    orderBy: { name: "asc" },
  });
}

export async function getAllProperties() {
  return prisma.property.findMany({ orderBy: [{ type: "asc" }, { name: "asc" }] });
}

/** Bilancio di un insieme di prenotazioni (mare) con relative spese collegate. */
export async function computeBookingsBalance(bookingIds: string[]) {
  if (bookingIds.length === 0) {
    return { totalIncome: 0, totalCommission: 0, totalTaxes: 0, totalOtherDeductions: 0, totalExpenses: 0, netProfit: 0, nights: 0, count: 0 };
  }
  const [bookings, expenses] = await Promise.all([
    prisma.booking.findMany({ where: { id: { in: bookingIds } } }),
    prisma.expense.findMany({ where: { bookingId: { in: bookingIds } } }),
  ]);

  const expensesByBooking = new Map<string, number>();
  for (const e of expenses) {
    expensesByBooking.set(e.bookingId!, (expensesByBooking.get(e.bookingId!) ?? 0) + toNumber(e.amount));
  }

  const totalIncome = sumBy(bookings, (b) => b.amountPaid);
  const totalCommission = sumBy(bookings, (b) => b.platformCommission);
  const totalTaxes = sumBy(bookings, (b) => b.taxes);
  const totalOtherDeductions = sumBy(bookings, (b) => b.otherDeductions);
  const totalExpenses = sumBy(expenses, (e) => e.amount);
  const netProfit = bookings.reduce(
    (acc, b) => acc + bookingNetProfit(b, expensesByBooking.get(b.id) ?? 0),
    0
  );
  const nights = bookings.reduce((acc, b) => acc + nightsBetween(b.checkIn, b.checkOut), 0);

  return {
    totalIncome,
    totalCommission,
    totalTaxes,
    totalOtherDeductions,
    totalExpenses,
    netProfit,
    nights,
    count: bookings.length,
  };
}

export async function getBookingsInRange(propertyId: string, from: Date, to: Date) {
  return prisma.booking.findMany({
    where: {
      propertyId,
      checkIn: { lt: to },
      checkOut: { gt: from },
    },
    orderBy: { checkIn: "asc" },
  });
}

export async function getYearBookings(propertyId: string, year: number) {
  const from = new Date(Date.UTC(year, 0, 1));
  const to = new Date(Date.UTC(year + 1, 0, 1));
  return getBookingsInRange(propertyId, from, to);
}

export async function getMonthBookings(propertyId: string, year: number, month: number) {
  const from = new Date(Date.UTC(year, month - 1, 1));
  const to = new Date(Date.UTC(year, month, 1));
  return getBookingsInRange(propertyId, from, to);
}

export interface MonthlyPropertyBalance {
  propertyId: string;
  totalRentCollected: number;
  totalRentDue: number;
  totalExpenses: number;
  netProfit: number;
  outstanding: number;
}

export async function computeMonthlyPropertyBalance(propertyId: string, year: number): Promise<MonthlyPropertyBalance> {
  const [payments, expenses] = await Promise.all([
    prisma.monthlyPayment.findMany({ where: { propertyId, year } }),
    prisma.expense.findMany({
      where: {
        propertyId,
        date: { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) },
      },
    }),
  ]);

  const totalRentCollected = sumBy(
    payments.filter((p) => p.isPaid),
    (p) => p.amountPaid ?? p.amountDue
  );
  const totalRentDue = sumBy(payments, (p) => p.amountDue);
  const totalExpenses = sumBy(expenses, (e) => e.amount);
  const outstanding = sumBy(
    payments.filter((p) => !p.isPaid),
    (p) => p.amountDue
  );

  return {
    propertyId,
    totalRentCollected,
    totalRentDue,
    totalExpenses,
    netProfit: totalRentCollected - totalExpenses,
    outstanding,
  };
}

export async function getUpcomingCheckInsOuts(daysAhead = 14) {
  const now = startOfDay(new Date());
  const limit = addDays(now, daysAhead);

  const [checkIns, checkOuts] = await Promise.all([
    prisma.booking.findMany({
      where: { checkIn: { gte: now, lte: limit } },
      include: { property: true },
      orderBy: { checkIn: "asc" },
    }),
    prisma.booking.findMany({
      where: { checkOut: { gte: now, lte: limit } },
      include: { property: true },
      orderBy: { checkOut: "asc" },
    }),
  ]);

  return { checkIns, checkOuts };
}

export async function getFutureBookings(limit = 10) {
  return prisma.booking.findMany({
    where: { checkIn: { gte: startOfDay(new Date()) } },
    include: { property: true },
    orderBy: { checkIn: "asc" },
    take: limit,
  });
}

export async function getUnpaidMonthlyPayments(year?: number) {
  const now = new Date();
  const targetYear = year ?? now.getUTCFullYear();
  const currentMonth = now.getUTCMonth() + 1;

  return prisma.monthlyPayment.findMany({
    where: {
      isPaid: false,
      OR: [
        { year: { lt: targetYear } },
        { year: targetYear, month: { lte: currentMonth } },
      ],
    },
    include: { property: true },
    orderBy: [{ year: "asc" }, { month: "asc" }],
  });
}

export async function getContractsExpiringSoon(daysAhead = 60) {
  const now = startOfDay(new Date());
  const limit = addDays(now, daysAhead);
  return prisma.property.findMany({
    where: { type: "MONTHLY", archived: false, contractEnd: { gte: now, lte: limit } },
    orderBy: { contractEnd: "asc" },
  });
}

export async function getPlatformSettings() {
  const settings = await prisma.platformSetting.findMany();
  const map = new Map(settings.map((s) => [s.platform, s]));
  return {
    BOOKING: map.get("BOOKING") ?? { platform: "BOOKING" as const, commissionPercent: 15, taxPercent: 21 },
    AIRBNB: map.get("AIRBNB") ?? { platform: "AIRBNB" as const, commissionPercent: 3, taxPercent: 21 },
  };
}
