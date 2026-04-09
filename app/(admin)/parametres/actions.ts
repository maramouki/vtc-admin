"use server";

import { updateSociete } from "@/lib/nocodb";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function updateSocieteAction(id: number, data: Record<string, unknown>) {
  const session = await getSession();
  if (!session) throw new Error("Non autorisé");
  await updateSociete(id, data);
  revalidatePath("/parametres");
}

export async function changePasswordAction(societeId: number, newPassword: string) {
  const session = await getSession();
  if (!session) throw new Error("Non autorisé");
  const hash = await bcrypt.hash(newPassword, 12);
  await updateSociete(societeId, { password_hash: hash });
}
