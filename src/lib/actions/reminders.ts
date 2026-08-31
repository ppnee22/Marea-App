"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/actions/guard";

export async function createReminder(formData: FormData) {
  await requireAuth();

  const title = formData.get("title");
  const description = formData.get("description");
  const dueDate = formData.get("dueDate");
  const propertyId = formData.get("propertyId");

  if (typeof title !== "string" || title.trim() === "") {
    throw new Error("Il titolo del promemoria è obbligatorio");
  }

  await prisma.reminder.create({
    data: {
      title: title.trim(),
      description: typeof description === "string" && description.trim() ? description.trim() : null,
      dueDate: typeof dueDate === "string" && dueDate ? new Date(dueDate) : null,
      propertyId: typeof propertyId === "string" && propertyId ? propertyId : null,
    },
  });

  revalidatePath("/promemoria");
  revalidatePath("/");
}

export async function toggleReminder(reminderId: string) {
  await requireAuth();
  const reminder = await prisma.reminder.findUniqueOrThrow({ where: { id: reminderId } });
  await prisma.reminder.update({ where: { id: reminderId }, data: { isDone: !reminder.isDone } });
  revalidatePath("/promemoria");
  revalidatePath("/");
}

export async function deleteReminder(reminderId: string) {
  await requireAuth();
  await prisma.reminder.delete({ where: { id: reminderId } });
  revalidatePath("/promemoria");
  revalidatePath("/");
}
