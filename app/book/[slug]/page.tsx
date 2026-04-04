import { getSociete, getVehicules, getOptions } from "@/lib/nocodb";
import BookingClient from "./BookingClient";
import { notFound } from "next/navigation";

export default async function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [societe, vehicules, options] = await Promise.all([
    getSociete(slug),
    getVehicules(slug),
    getOptions(slug),
  ]);

  if (!societe) notFound();

  return (
    <BookingClient
      societeSlug={slug}
      societeName={societe.nom || slug}
      vehicules={vehicules}
      options={options.filter((o) => o.actif)}
    />
  );
}
