import { getSession } from "@/lib/auth";
import { getTarifsMad, getVehicules } from "@/lib/nocodb";
import MadClient from "./MadClient";

export default async function PrixMadPage() {
  const session = await getSession();
  const slug = session!.societeSlug;
  const [dataResult, vehiculesResult] = await Promise.allSettled([getTarifsMad(slug), getVehicules(slug)]);
  const data = dataResult.status === "fulfilled" ? dataResult.value : { list: [] };
  const vehiculeList = vehiculesResult.status === "fulfilled" ? vehiculesResult.value : [];
  const vehicles = vehiculeList.map((v) => `${v.marque} ${v.modele}`);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Prix mise à disposition</h1>
        <p className="text-sm text-gray-500 mt-1">Tarif horaire, minimum, maximum et journée par véhicule</p>
      </div>
      <MadClient rows={data.list || []} societeSlug={slug} vehicles={vehicles} />
    </div>
  );
}
