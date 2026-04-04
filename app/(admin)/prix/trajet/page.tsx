import { getSession } from "@/lib/auth";
import { getMatricePrix, getVehicules } from "@/lib/nocodb";
import MatriceClient from "./MatriceClient";

export default async function PrixTrajetPage() {
  const session = await getSession();
  const slug = session!.societeSlug;
  const [dataResult, vehiculesResult] = await Promise.allSettled([getMatricePrix(slug), getVehicules(slug)]);
  const data = dataResult.status === "fulfilled" ? dataResult.value : { list: [] };
  const vehiculeList = vehiculesResult.status === "fulfilled" ? vehiculesResult.value : [];
  const vehicles = vehiculeList.map((v) => `${v.marque} ${v.modele}`);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Prix trajet</h1>
        <p className="text-sm text-gray-500 mt-1">Tarifs par département de départ/arrivée et type de véhicule</p>
      </div>
      <MatriceClient rows={data.list || []} societeSlug={slug} vehicles={vehicles} />
    </div>
  );
}
