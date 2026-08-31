"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/actions/guard";
import { toNumber } from "@/lib/calc";

/** Garantisce che esistano le 12 righe di pagamento per l'anno indicato. */
export async function ensureYearPayments(propertyId: string, year: number) {
  const property = await prisma.property.findUniqueOrThrow({ where: { id: propertyId } });
  const existing = await prisma.monthlyPayment.findMany({
    where: { propertyId, year },
    select: { month: true },
  });
  const existingMonths = new Set(existing.map((e) => e.month));
  const missing = Array.from({ length: 12 }, (_, i) => i + 1).filter((m) => !existingMonths.has(m));

  if (missing.length > 0) {
    await prisma.monthlyPayment.createMany({
      data: missing.map((month) => ({
        propertyId,
        year,
        month,
        amountDue: property.monthlyRent ?? 0,
      })),
      skipDuplicates: true,
    });
  }

  return prisma.monthlyPayment.findMany({
    where: { propertyId, year },
    orderBy: { month: "asc" },
  });
}

export async function updateMonthlyPayment(paymentId: string, formData: FormData) {
  await requireAuth();

  const isPaid = formData.get("isPaid") === "on";
  const paidDate = formData.get("paidDate");
  const amountPaid = formData.get("amountPaid");
  const amountDue = formData.get("amountDue");
  const notes = formData.get("notes");

  const payment = await prisma.monthlyPayment.update({
    where: { id: paymentId },
    data: {
      isPaid,
      paidDate: isPaid && typeof paidDate === "string" && paidDate ? new Date(paidDate) : isPaid ? new Date() : null,
      amountPaid:
        typeof amountPaid === "string" && amountPaid !== "" ? toNumber(amountPaid.replace(",", ".")) : null,
      amountDue: typeof amountDue === "string" && amountDue !== "" ? toNumber(amountDue.replace(",", ".")) : undefined,
      notes: typeof notes === "string" && notes.trim() !== "" ? notes.trim() : null,
    },
  });

  revalidatePath(`/mensili/${payment.propertyId}`);
  revalidatePath("/mensili");
  revalidatePath("/");
}
