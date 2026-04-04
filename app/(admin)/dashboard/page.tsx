import { getSession } from "@/lib/auth";
import { getStatsReservations, getReservations } from "@/lib/nocodb";

const STATUT_LABEL: Record<string, string> = {
  nouvelle: "Nouvelle",
  confirmee: "Confirmée",
  en_cours: "En cours",
  terminee: "Terminée",
  annulee: "Annulée",
};

const STATUT_COLOR: Record<string, string> = {
  nouvelle: "bg-yellow-50 text-yellow-700",
  confirmee: "bg-green-50 text-green-700",
  en_cours: "bg-blue-50 text-blue-700",
  terminee: "bg-gray-50 text-gray-600",
  annulee: "bg-red-50 text-red-600",
};

export default async function DashboardPage() {
  const session = await getSession();
  const slug = session!.societeSlug;

  const [statsResult, recent] = await Promise.allSettled([
    getStatsReservations(slug),
    getReservations(slug, 1, 5),
  ]);

  const stats = statsResult.status === "fulfilled"
    ? statsResult.value
    : { total: 0, thisMonth: 0, caMois: 0, pending: 0 };

  const recentData = recent.status === "fulfilled" ? recent.value : { list: [] };

  const recentList = recentData.list || [];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard label="Réservations ce mois" value={stats.thisMonth} />
        <StatCard label="CA ce mois" value={`${stats.caMois} €`} highlight />
        <StatCard label="En attente" value={stats.pending} />
        <StatCard label="Total réservations" value={stats.total} />
      </div>

      {/* Dernières réservations */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Dernières réservations</h2>
          <a href="/reservations" className="text-sm text-gray-500 hover:text-gray-900">
            Voir tout →
          </a>
        </div>

        {recentList.length === 0 ? (
          <p className="px-6 py-8 text-sm text-gray-400 text-center">Aucune réservation</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Référence</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Client</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Date</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Véhicule</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Total</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Statut</th>
              </tr>
            </thead>
            <tbody>
              {recentList.map((r: Record<string, unknown>) => (
                <tr key={r.Id as number} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3.5 font-mono text-xs text-gray-700">{r.reference as string}</td>
                  <td className="px-6 py-3.5 text-gray-900 font-medium">{r.prenom_client as string} {r.nom_client as string}</td>
                  <td className="px-6 py-3.5 text-gray-700">
                    {r.date_prise_en_charge
                      ? new Date(r.date_prise_en_charge as string).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                      : "—"}
                  </td>
                  <td className="px-6 py-3.5 text-gray-700">{r.type_vehicule as string}</td>
                  <td className="px-6 py-3.5 text-right font-semibold text-gray-900">{r.prix_total as number} €</td>
                  <td className="px-6 py-3.5 text-right">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUT_COLOR[r.statut as string] || "bg-gray-50 text-gray-600"}`}>
                      {STATUT_LABEL[r.statut as string] || r.statut as string}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl p-5 border ${highlight ? "bg-gray-900 border-gray-900" : "bg-white border-gray-100"}`}>
      <div className={`text-xs font-medium mb-2 ${highlight ? "text-gray-300" : "text-gray-500"}`}>{label}</div>
      <div className={`text-2xl font-bold ${highlight ? "text-white" : "text-gray-900"}`}>{value}</div>
    </div>
  );
}
