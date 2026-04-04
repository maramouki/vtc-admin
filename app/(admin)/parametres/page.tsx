import { getSession } from "@/lib/auth";
import { getSociete } from "@/lib/nocodb";
import ParametresClient from "./ParametresClient";

export default async function ParametresPage() {
  const session = await getSession();
  const slug = session!.societeSlug;
  const societe = await getSociete(slug);

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-sm text-gray-500 mt-1">Informations de votre société</p>
      </div>
      <ParametresClient societe={societe} slug={slug} />
    </div>
  );
}
