import { getSession } from "@/lib/auth";
import { getReservations } from "@/lib/nocodb";
import ReservationsClient from "./ReservationsClient";

export default async function ReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; statut?: string }>;
}) {
  const session = await getSession();
  const slug = session!.societeSlug;
  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const statut = sp.statut || "";

  const where = statut ? `(statut,eq,${statut})` : "";
  const data = await getReservations(slug, page, 20, where);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Réservations</h1>
      <ReservationsClient
        reservations={data.list || []}
        total={data.pageInfo?.totalRows || 0}
        page={page}
        statut={statut}
      />
    </div>
  );
}
