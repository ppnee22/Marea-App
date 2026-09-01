"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/actions/guard";

export async function createNote(formData: FormData) {
  await requireAuth();

  const content = formData.get("content");
  const propertyId = formData.get("propertyId");
  const year = formData.get("year");
  const month = formData.get("month");

  if (typeof content !== "string" || content.trim() === "") {
    throw new Error("La nota non può essere vuota");
  }

  await prisma.note.create({
    data: {
      content: content.trim(),
      propertyId: typeof propertyId === "string" && propertyId ? propertyId : null,
      year: typeof year === "string" && year ? Number(year) : null,
      month: typeof month === "string" && month ? Number(month) : null,
    },
  });

  revalidatePath("/note");
  if (typeof propertyId === "string" && propertyId) {
    revalidatePath(`/mensili/${propertyId}`);
  }
}

export async function updateNote(noteId: string, formData: FormData) {
  await requireAuth();

  const content = formData.get("content");
  if (typeof content !== "string" || content.trim() === "") {
    throw new Error("La nota non può essere vuota");
  }

  const note = await prisma.note.update({
    where: { id: noteId },
    data: { content: content.trim() },
  });

  revalidatePath("/note");
  if (note.propertyId) revalidatePath(`/mensili/${note.propertyId}`);
}

export async function deleteNote(noteId: string) {
  await requireAuth();
  const note = await prisma.note.delete({ where: { id: noteId } });
  revalidatePath("/note");
  if (note.propertyId) revalidatePath(`/mensili/${note.propertyId}`);
}
