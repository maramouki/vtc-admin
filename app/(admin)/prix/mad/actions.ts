"use server";

import { updateTarifMad, createTarifMad } from "@/lib/nocodb";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateTarifMadAction(id: number, data: Record<string, unknown>) {
  const session = await getSession();
  if (!session) throw new Error("Non autorisé");
  await updateTarifMad(id, data);
  revalidatePath("/prix/mad");
}

export async function createTarifMadAction(data: Record<string, unknown>) {
  const session = await getSession();
  if (!session) throw new Error("Non autorisé");
  const result = await createTarifMad(data);
  revalidatePath("/prix/mad");
  return result;
}
