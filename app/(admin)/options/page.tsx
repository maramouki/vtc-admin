import { getSession } from "@/lib/auth";
import { getOptions } from "@/lib/nocodb";
import OptionsClient from "./OptionsClient";

export default async function OptionsPage() {
  const session = await getSession();
  const slug = session!.societeSlug;
  const options = await getOptions(slug);

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Options</h1>
        <p className="text-sm text-gray-500 mt-1">Options proposées aux clients lors de la réservation</p>
      </div>
      <OptionsClient rows={options} societeSlug={slug} />
    </div>
  );
}
