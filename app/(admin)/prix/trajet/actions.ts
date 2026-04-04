"use server";

import { updateMatriceRow, createMatriceRow, deleteMatriceRow } from "@/lib/nocodb";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateMatricePrixAction(id: number, data: Record<string, unknown>) {
  const session = await getSession();
  if (!session) throw new Error("Non autorisé");
  await updateMatriceRow(id, data);
  revalidatePath("/prix/trajet");
}

export async function createMatricePrixAction(data: Record<string, unknown>) {
  const session = await getSession();
  if (!session) throw new Error("Non autorisé");
  const result = await createMatriceRow(data);
  revalidatePath("/prix/trajet");
  return result;
}

export async function createMatricePrixBatchAction(items: Record<string, unknown>[]) {
  const session = await getSession();
  if (!session) throw new Error("Non autorisé");
  const results = [];
  for (let i = 0; i < items.length; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, 400));
    results.push(await createMatriceRow(items[i]));
  }
  revalidatePath("/prix/trajet");
  return results;
}

export async function deleteMatricePrixAction(id: number) {
  const session = await getSession();
  if (!session) throw new Error("Non autorisé");
  await deleteMatriceRow(id);
  revalidatePath("/prix/trajet");
}
