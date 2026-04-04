import { getSession } from "@/lib/auth";
import { getVehicules } from "@/lib/nocodb";
import FlotteClient from "./FlotteClient";

export default async function FlottePage() {
  const session = await getSession();
  const slug = session!.societeSlug;
  const vehicules = await getVehicules(slug);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Flotte</h1>
        <p className="text-sm text-gray-500 mt-1">Gérez les véhicules de votre flotte</p>
      </div>
      <FlotteClient rows={vehicules} />
    </div>
  );
}
