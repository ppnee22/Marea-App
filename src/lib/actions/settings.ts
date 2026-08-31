"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/actions/guard";
import { Platform } from "@prisma/client";
import bcrypt from "bcryptjs";

export async function updatePlatformSetting(platform: Platform, formData: FormData) {
  await requireAuth();

  const commissionPercent = Number(String(formData.get("commissionPercent") ?? "0").replace(",", "."));
  const taxPercent = Number(String(formData.get("taxPercent") ?? "0").replace(",", "."));

  await prisma.platformSetting.upsert({
    where: { platform },
    update: { commissionPercent, taxPercent },
    create: { platform, commissionPercent, taxPercent },
  });

  revalidatePath("/impostazioni");
}

export async function createAppUser(formData: FormData) {
  await requireAuth();

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();

  if (!email || password.length < 6) {
    throw new Error("Email obbligatoria e password di almeno 6 caratteri");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    update: { passwordHash, name: name || undefined },
    create: { email, passwordHash, name: name || null },
  });

  revalidatePath("/impostazioni");
}

export async function deleteAppUser(userId: string) {
  await requireAuth();
  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/impostazioni");
}
