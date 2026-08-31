"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/actions/guard";
import { ExpenseCategory } from "@prisma/client";
import { put, del } from "@vercel/blob";

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  if (typeof v !== "string" || v.trim() === "") return null;
  return v.trim();
}

function decimal(formData: FormData, key: string): number {
  const v = str(formData, key);
  if (v === null) return 0;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

async function uploadAttachmentIfPresent(formData: FormData): Promise<string | null> {
  const file = formData.get("attachment");
  if (!(file instanceof File) || file.size === 0) return null;
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;

  const blob = await put(`expenses/${Date.now()}-${file.name}`, file, {
    access: "public",
    addRandomSuffix: true,
  });
  return blob.url;
}

export async function createExpense(formData: FormData, redirectPath?: string) {
  await requireAuth();

  const propertyId = str(formData, "propertyId");
  const category = str(formData, "category") as ExpenseCategory | null;
  const date = str(formData, "date");
  if (!propertyId || !category || !date) {
    throw new Error("Compila appartamento, categoria e data della spesa");
  }

  const attachmentUrl = await uploadAttachmentIfPresent(formData);

  await prisma.expense.create({
    data: {
      propertyId,
      bookingId: str(formData, "bookingId"),
      category,
      amount: decimal(formData, "amount"),
      date: new Date(date),
      description: str(formData, "description"),
      notes: str(formData, "notes"),
      attachmentUrl,
    },
  });

  revalidatePath("/spese");
  revalidatePath("/mensili");
  revalidatePath("/mare");
  if (redirectPath) revalidatePath(redirectPath);
}

export async function updateExpense(expenseId: string, formData: FormData, redirectPath?: string) {
  await requireAuth();

  const category = str(formData, "category") as ExpenseCategory | null;
  const date = str(formData, "date");
  if (!category || !date) {
    throw new Error("Compila categoria e data della spesa");
  }

  const attachmentUrl = await uploadAttachmentIfPresent(formData);

  await prisma.expense.update({
    where: { id: expenseId },
    data: {
      category,
      amount: decimal(formData, "amount"),
      date: new Date(date),
      description: str(formData, "description"),
      notes: str(formData, "notes"),
      ...(attachmentUrl ? { attachmentUrl } : {}),
    },
  });

  revalidatePath("/spese");
  revalidatePath("/mensili");
  revalidatePath("/mare");
  if (redirectPath) revalidatePath(redirectPath);
}

export async function deleteExpense(expenseId: string, redirectPath?: string) {
  await requireAuth();
  const expense = await prisma.expense.findUnique({ where: { id: expenseId } });
  if (expense?.attachmentUrl && process.env.BLOB_READ_WRITE_TOKEN) {
    await del(expense.attachmentUrl).catch(() => undefined);
  }
  await prisma.expense.delete({ where: { id: expenseId } });

  revalidatePath("/spese");
  revalidatePath("/mensili");
  revalidatePath("/mare");
  if (redirectPath) revalidatePath(redirectPath);
}
