"use server";

import { getSession } from "@/lib/auth";
import { createVehicule, updateVehicule, deleteVehicule } from "@/lib/nocodb";
import { revalidatePath } from "next/cache";


export async function createVehiculeAction(data: Record<string, unknown>) {
  const session = await getSession();
  await createVehicule({ ...data, societe_slug: session!.societeSlug });
  revalidatePath("/flotte");
  revalidatePath("/prix/mad");
}

export async function updateVehiculeAction(id: number, data: Record<string, unknown>) {
  await updateVehicule(id, data);
  revalidatePath("/flotte");
  revalidatePath("/prix/mad");
}

export async function deleteVehiculeAction(id: number) {
  await deleteVehicule(id);
  revalidatePath("/flotte");
  revalidatePath("/prix/mad");
}
