"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/actions/guard";

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  if (typeof v !== "string" || v.trim() === "") return null;
  return v.trim();
}

function decimal(formData: FormData, key: string): number | null {
  const v = str(formData, key);
  if (v === null) return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export async function createMonthlyProperty(formData: FormData) {
  await requireAuth();

  const name = str(formData, "name");
  if (!name) throw new Error("Il nome/indirizzo è obbligatorio");

  const property = await prisma.property.create({
    data: {
      type: "MONTHLY",
      name,
      address: str(formData, "address"),
      tenantName: str(formData, "tenantName"),
      tenantPhone: str(formData, "tenantPhone"),
      monthlyRent: decimal(formData, "monthlyRent"),
      contractStart: str(formData, "contractStart") ? new Date(str(formData, "contractStart")!) : null,
      contractEnd: str(formData, "contractEnd") ? new Date(str(formData, "contractEnd")!) : null,
      deposit: decimal(formData, "deposit"),
      notes: str(formData, "notes"),
    },
  });

  revalidatePath("/mensili");
  redirect(`/mensili/${property.id}`);
}

export async function updateMonthlyProperty(propertyId: string, formData: FormData) {
  await requireAuth();

  const name = str(formData, "name");
  if (!name) throw new Error("Il nome/indirizzo è obbligatorio");

  await prisma.property.update({
    where: { id: propertyId },
    data: {
      name,
      address: str(formData, "address"),
      tenantName: str(formData, "tenantName"),
      tenantPhone: str(formData, "tenantPhone"),
      monthlyRent: decimal(formData, "monthlyRent"),
      contractStart: str(formData, "contractStart") ? new Date(str(formData, "contractStart")!) : null,
      contractEnd: str(formData, "contractEnd") ? new Date(str(formData, "contractEnd")!) : null,
      deposit: decimal(formData, "deposit"),
      notes: str(formData, "notes"),
    },
  });

  revalidatePath("/mensili");
  revalidatePath(`/mensili/${propertyId}`);
}

export async function archiveMonthlyProperty(propertyId: string) {
  await requireAuth();
  await prisma.property.update({ where: { id: propertyId }, data: { archived: true } });
  revalidatePath("/mensili");
  redirect("/mensili");
}

export async function ensureSeasideProperty() {
  await requireAuth();
  const existing = await prisma.property.findFirst({ where: { type: "SHORT_TERM" } });
  if (existing) return existing;
  return prisma.property.create({
    data: { type: "SHORT_TERM", name: "Appartamento al Mare" },
  });
}
