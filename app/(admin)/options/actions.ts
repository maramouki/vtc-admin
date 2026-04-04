"use server";

import { createOption, updateOption, deleteOption, Option } from "@/lib/nocodb";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createOptionAction(data: Partial<Option>) {
  const session = await getSession();
  if (!session) throw new Error("Non autorisé");
  const result = await createOption({ ...data, societe_slug: session.societeSlug });
  revalidatePath("/options");
  return result;
}

export async function updateOptionAction(id: number, data: Partial<Option>) {
  const session = await getSession();
  if (!session) throw new Error("Non autorisé");
  await updateOption(id, data);
  revalidatePath("/options");
}

export async function deleteOptionAction(id: number) {
  const session = await getSession();
  if (!session) throw new Error("Non autorisé");
  await deleteOption(id);
  revalidatePath("/options");
}
