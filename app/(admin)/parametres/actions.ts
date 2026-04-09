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

export async function changePasswordAction(societeId: number, currentPassword: string, newPassword: string) {
  const session = await getSession();
  if (!session) throw new Error("Non autorisé");
  const { getSociete } = await import("@/lib/nocodb");
  const societe = await getSociete(session.societeSlug);
  if (!societe?.password_hash) throw new Error("Société introuvable");
  const valid = await bcrypt.compare(currentPassword, societe.password_hash);
  if (!valid) throw new Error("Mot de passe actuel incorrect");
  const hash = await bcrypt.hash(newPassword, 12);
  await updateSociete(societeId, { password_hash: hash });
}
