"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/actions/guard";
import { Platform } from "@prisma/client";
import { put } from "@vercel/blob";

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

export interface BookingInput {
  propertyId: string;
  guestName: string;
  platform: Platform;
  checkIn: Date;
  checkOut: Date;
  amountPaid: number;
  platformCommission: number;
  taxes: number;
  otherDeductions: number;
  notes: string | null;
}

function parseBookingForm(formData: FormData): BookingInput {
  const propertyId = str(formData, "propertyId");
  const guestName = str(formData, "guestName");
  const platform = str(formData, "platform") as Platform | null;
  const checkIn = str(formData, "checkIn");
  const checkOut = str(formData, "checkOut");

  if (!propertyId || !guestName || !platform || !checkIn || !checkOut) {
    throw new Error("Compila tutti i campi obbligatori della prenotazione");
  }
  if (platform !== "BOOKING" && platform !== "AIRBNB") {
    throw new Error("Piattaforma non valida");
  }
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  if (checkOutDate <= checkInDate) {
    throw new Error("Il check-out deve essere successivo al check-in");
  }

  return {
    propertyId,
    guestName,
    platform,
    checkIn: checkInDate,
    checkOut: checkOutDate,
    amountPaid: decimal(formData, "amountPaid"),
    platformCommission: decimal(formData, "platformCommission"),
    taxes: decimal(formData, "taxes"),
    otherDeductions: decimal(formData, "otherDeductions"),
    notes: str(formData, "notes"),
  };
}

export async function createBooking(formData: FormData) {
  await requireAuth();
  const data = parseBookingForm(formData);

  const booking = await prisma.booking.create({ data });

  revalidatePath("/mare");
  revalidatePath("/mare/prenotazioni");
  redirect(`/mare/prenotazioni/${booking.id}`);
}

export async function updateBooking(bookingId: string, formData: FormData) {
  await requireAuth();
  const data = parseBookingForm(formData);

  await prisma.booking.update({ where: { id: bookingId }, data });

  revalidatePath("/mare");
  revalidatePath("/mare/prenotazioni");
  revalidatePath(`/mare/prenotazioni/${bookingId}`);
  redirect(`/mare/prenotazioni/${bookingId}`);
}

export async function deleteBooking(bookingId: string) {
  await requireAuth();
  await prisma.booking.delete({ where: { id: bookingId } });
  revalidatePath("/mare");
  revalidatePath("/mare/prenotazioni");
  redirect("/mare/prenotazioni");
}

/** Crea la prenotazione e allega gli screenshot caricati (fino a 2) come documenti. */
export async function createBookingFromImport(formData: FormData) {
  await requireAuth();
  const data = parseBookingForm(formData);

  const booking = await prisma.booking.create({ data });

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const files = formData.getAll("screenshots").filter((f): f is File => f instanceof File && f.size > 0);
    for (const file of files.slice(0, 2)) {
      const blob = await put(`documents/${Date.now()}-${file.name}`, file, {
        access: "public",
        addRandomSuffix: true,
      });
      await prisma.document.create({
        data: {
          category: "SCREENSHOT_PRENOTAZIONE",
          fileName: file.name,
          fileUrl: blob.url,
          mimeType: file.type || null,
          propertyId: booking.propertyId,
          bookingId: booking.id,
        },
      });
    }
  }

  revalidatePath("/mare");
  revalidatePath("/mare/prenotazioni");
  redirect(`/mare/prenotazioni/${booking.id}`);
}

export async function updateBookingNotes(bookingId: string, formData: FormData) {
  await requireAuth();
  await prisma.booking.update({
    where: { id: bookingId },
    data: { notes: str(formData, "notes") },
  });
  revalidatePath(`/mare/prenotazioni/${bookingId}`);
}
