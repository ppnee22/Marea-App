"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/actions/guard";
import { DocumentCategory } from "@prisma/client";
import { put, del } from "@vercel/blob";

export async function uploadDocument(formData: FormData) {
  await requireAuth();

  const file = formData.get("file");
  const category = formData.get("category") as DocumentCategory | null;
  const propertyId = formData.get("propertyId");
  const bookingId = formData.get("bookingId");
  const notes = formData.get("notes");

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Seleziona un file da caricare");
  }
  if (!category) {
    throw new Error("Seleziona una categoria per il documento");
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      "Upload non configurato: manca BLOB_READ_WRITE_TOKEN. Vedi la guida al deploy per collegare Vercel Blob."
    );
  }

  const blob = await put(`documents/${Date.now()}-${file.name}`, file, {
    access: "public",
    addRandomSuffix: true,
  });

  await prisma.document.create({
    data: {
      category,
      fileName: file.name,
      fileUrl: blob.url,
      mimeType: file.type || null,
      propertyId: typeof propertyId === "string" && propertyId ? propertyId : null,
      bookingId: typeof bookingId === "string" && bookingId ? bookingId : null,
      notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
    },
  });

  revalidatePath("/documenti");
  if (typeof propertyId === "string" && propertyId) {
    revalidatePath(`/mensili/${propertyId}`);
  }
  if (typeof bookingId === "string" && bookingId) {
    revalidatePath(`/mare/prenotazioni/${bookingId}`);
  }
}

export async function deleteDocument(documentId: string) {
  await requireAuth();
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) return;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    await del(doc.fileUrl).catch(() => undefined);
  }
  await prisma.document.delete({ where: { id: documentId } });

  revalidatePath("/documenti");
  if (doc.propertyId) revalidatePath(`/mensili/${doc.propertyId}`);
  if (doc.bookingId) revalidatePath(`/mare/prenotazioni/${doc.bookingId}`);
}
