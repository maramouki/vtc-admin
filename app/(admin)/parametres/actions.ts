"use server";

import { updateSociete } from "@/lib/nocodb";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateSocieteAction(id: number, data: Record<string, unknown>) {
  const session = await getSession();
  if (!session) throw new Error("Non autorisé");
  await updateSociete(id, data);
  revalidatePath("/parametres");
}
