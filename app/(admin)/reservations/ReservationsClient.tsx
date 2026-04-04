"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, useEffect } from "react";
import { updateStatutAction, resendEmailAction } from "./actions";
import ConfirmModal from "@/components/ConfirmModal";
import Drawer from "@/components/Drawer";

const STATUTS_FILTER = [
  { value: "", label: "Tous" },
  { value: "nouvelle", label: "Nouvelle" },
  { value: "confirmee", label: "Confirmée" },
  { value: "en_cours", label: "En cours" },
  { value: "terminee", label: "Terminée" },
  { value: "annulee", label: "Annulée" },
];

const STATUTS_CHANGE = [
  { value: "nouvelle", label: "Nouvelle" },
  { value: "confirmee", label: "Confirmée" },
  { value: "en_cours", label: "En cours" },
  { value: "terminee", label: "Terminée" },
  { value: "annulee", label: "Annulée" },
];

const STATUT_COLOR: Record<string, string> = {
  nouvelle: "bg-yellow-50 text-yellow-700",
  confirmee: "bg-green-50 text-green-700",
  en_cours: "bg-blue-50 text-blue-700",
  terminee: "bg-gray-50 text-gray-600",
  annulee: "bg-red-50 text-red-600",
};

type Reservation = Record<string, unknown>;

export default function ReservationsClient({
  reservations,
  total,
  page,
  statut,
}: {
  reservations: Reservation[];
  total: number;
  page: number;
  statut: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Reservation | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pendingStatut, setPendingStatut] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [confirmStatut, setConfirmStatut] = useState<string | null>(null);
  const [localRows, setLocalRows] = useState<Reservation[]>(reservations);
  const [view, setView] = useState<"table" | "calendar">("table");
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Sync quand le serveur renvoie de nouvelles données (changement de filtre/page)
  useEffect(() => {
    setLocalRows(reservations);
    setSelected(null);
  }, [reservations]);

  function setFilter(value: string) {
    const params = new URLSearchParams();
    if (value) params.set("statut", value);
    params.set("page", "1");
    router.push(`/reservations?${params}`);
  }

  function setPage(p: number) {
    const params = new URLSearchParams();
    if (statut) params.set("statut", statut);
    params.set("page", String(p));
    router.push(`/reservations?${params}`);
  }

  function handleStatutChange(newStatut: string) {
    setPendingStatut(newStatut);
    setConfirmStatut(newStatut);
  }

  function doStatutChange() {
    if (!selected || !confirmStatut) return;
    const id = selected.Id as number;
    startTransition(async () => {
      await updateStatutAction(id, confirmStatut);
      const updated = { ...selected, statut: confirmStatut };
      setSelected(updated);
      setLocalRows(localRows.map((r) => (r.Id === id ? updated : r)));
      setConfirmStatut(null);
      setPendingStatut(null);
    });
  }

  function handleResendEmail() {
    if (!selected) return;
    setEmailSent(false);
    setEmailError("");
    startTransition(async () => {
      try {
        await resendEmailAction(selected.Id as number);
        setEmailSent(true);
        setTimeout(() => setEmailSent(false), 3000);
      } catch {
        setEmailError("Erreur lors de l'envoi.");
        setTimeout(() => setEmailError(""), 3000);
      }
    });
  }

  const totalPages = Math.ceil(total / 20);
  const statutEnAttente = confirmStatut
    ? STATUTS_CHANGE.find((s) => s.value === confirmStatut)?.label
    : "";
  const willSendEmail = confirmStatut && ["confirmee", "annulee", "terminee", "en_cours"].includes(confirmStatut);

  return (
    <div>
      <div>
        <div className="flex gap-2 mb-5 flex-wrap items-center">
          {STATUTS_FILTER.map((s) => (
            <button
              key={s.value}
              onClick={() => setFilter(s.value)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                statut === s.value
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
              }`}
            >
              {s.label}
            </button>
          ))}
          <span className="ml-auto text-sm text-gray-500 self-center">{total} réservation{total !== 1 ? "s" : ""}</span>
          <div className="flex border border-gray-200 rounded-xl overflow-hidden">
            <button onClick={() => setView("table")} className={`px-3 py-1.5 text-sm font-medium transition-colors ${view === "table" ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-50"}`}>
              ☰ Liste
            </button>
            <button onClick={() => setView("calendar")} className={`px-3 py-1.5 text-sm font-medium transition-colors ${view === "calendar" ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-50"}`}>
              📅 Calendrier
            </button>
          </div>
        </div>

        {view === "calendar" && (
          <CalendarView
            reservations={localRows}
            date={calendarDate}
            onDateChange={setCalendarDate}
            onSelect={(r) => { setSelected(r); setEmailSent(false); setEmailError(""); }}
            selected={selected}
          />
        )}

        {view === "table" && (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {localRows.length === 0 ? (
                <p className="px-6 py-12 text-sm text-gray-500 text-center">Aucune réservation</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-50">
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Référence</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Client</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Date</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Type</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Véhicule</th>
                      <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Total</th>
                      <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {localRows.map((r) => (
                      <tr
                        key={r.Id as number}
                        onClick={() => { setSelected(r); setEmailSent(false); setEmailError(""); }}
                        className={`border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${selected?.Id === r.Id ? "bg-blue-50/30" : ""}`}
                      >
                        <td className="px-5 py-3.5 font-mono text-xs text-gray-700">{r.reference as string}</td>
                        <td className="px-5 py-3.5 text-gray-900 font-medium">{r.prenom_client as string} {r.nom_client as string}</td>
                        <td className="px-5 py-3.5 text-gray-700 whitespace-nowrap">
                          {r.date_prise_en_charge
                            ? new Date(r.date_prise_en_charge as string).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" })
                            : "—"}
                        </td>
                        <td className="px-5 py-3.5"><PrestationBadge type={r.type_prestation as string} /></td>
                        <td className="px-5 py-3.5 text-gray-700">{r.type_vehicule as string}</td>
                        <td className="px-5 py-3.5 text-right font-semibold text-gray-900">{r.prix_total as number} €</td>
                        <td className="px-5 py-3.5 text-right">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUT_COLOR[r.statut as string] || "bg-gray-50 text-gray-600"}`}>
                            {r.statut as string}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-5">
                <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">← Précédent</button>
                <span className="text-sm text-gray-500">Page {page} / {totalPages}</span>
                <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">Suivant →</button>
              </div>
            )}
          </>
        )}
      </div>


      {/* Drawer détail réservation */}
      <Drawer
        open={selected !== null}
        onClose={() => setSelected(null)}
        subtitle={selected?.reference as string}
        title={selected ? `${selected.prenom_client} ${selected.nom_client}` : ""}
        footer={
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1.5 font-medium">Changer le statut</label>
              <select
                value={selected?.statut as string || ""}
                onChange={(e) => handleStatutChange(e.target.value)}
                disabled={isPending}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-900 disabled:opacity-50"
              >
                {STATUTS_CHANGE.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleResendEmail}
                disabled={isPending}
                className="flex-1 px-3 py-2.5 border border-gray-200 text-sm rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                <span>✉</span>
                Renvoyer le mail
              </button>
              {selected?.stripe_payment_id && (
                <a
                  href={`https://dashboard.stripe.com/payments/${selected.stripe_payment_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2.5 border border-gray-200 text-sm rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <span>🔗</span>
                  Stripe
                </a>
              )}
            </div>
            {emailSent && <p className="text-xs text-green-600">Mail envoyé</p>}
            {emailError && <p className="text-xs text-red-600">{emailError}</p>}
          </div>
        }
      >
        {selected && (
          <div className="space-y-5">
            {/* Statut badge */}
            <div>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${STATUT_COLOR[selected.statut as string] || "bg-gray-50 text-gray-600"}`}>
                {selected.statut as string}
              </span>
            </div>

            <Section title="Client">
              <DetailRow label="Nom" value={`${selected.prenom_client} ${selected.nom_client}`} />
              <DetailRow label="Email" value={selected.email_client as string} />
              <DetailRow label="Téléphone" value={selected.telephone_client as string} />
            </Section>

            <Section title="Trajet">
              <DetailRow label="Départ" value={selected.adresse_depart as string} />
              <DetailRow label="Arrivée" value={selected.adresse_arrivee as string} />
              <DetailRow label="Date" value={selected.date_prise_en_charge ? new Date(selected.date_prise_en_charge as string).toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"} />
            </Section>

            <Section title="Course">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Type</span>
                <PrestationBadge type={selected.type_prestation as string} />
              </div>
              <DetailRow label="Véhicule" value={selected.type_vehicule as string} />
              {selected.duree_mad && <DetailRow label="Durée MAD" value={`${selected.duree_mad} h`} />}
              <DetailRow label="Passagers" value={String(selected.nb_passagers || "—")} />
              <DetailRow label="Bagages" value={String(selected.nb_bagages || "—")} />
              {selected.numero_vol_train && <DetailRow label="Vol/Train" value={selected.numero_vol_train as string} />}
              {selected.notes_client && <DetailRow label="Notes" value={selected.notes_client as string} />}
              {(() => {
                try {
                  const opts = typeof selected.options_json === "string"
                    ? JSON.parse(selected.options_json as string)
                    : (selected.options_json as { nom?: string; option?: string; qte?: number }[] | null);
                  if (!opts || opts.length === 0) return null;
                  return (
                    <div className="pt-1">
                      <p className="text-xs text-gray-500 mb-1">Options</p>
                      <div className="space-y-0.5">
                        {opts.map((o, i: number) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-gray-700">{o.nom || o.option}</span>
                            <span className="text-gray-500 text-xs">×{o.qte || 1}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                } catch { return null; }
              })()}
            </Section>

            <Section title="Paiement">
              <DetailRow label="Total" value={`${selected.prix_total} €`} bold />
              <DetailRow label="Statut paiement" value={selected.statut_paiement as string} />
            </Section>
          </div>
        )}
      </Drawer>

      {/* Modal confirmation changement statut */}
      <ConfirmModal
        open={confirmStatut !== null}
        title={`Passer en "${statutEnAttente}" ?`}
        message={willSendEmail ? "Un email sera automatiquement envoyé au client." : undefined}
        confirmLabel="Confirmer"
        onConfirm={doStatutChange}
        onCancel={() => { setConfirmStatut(null); setPendingStatut(null); }}
      />
    </div>
  );
}

function PrestationBadge({ type }: { type?: string }) {
  if (!type) return <span className="text-xs text-gray-400">—</span>;
  const isMad = type.toLowerCase().includes("mad") || type.toLowerCase().includes("disposition");
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${isMad ? "bg-purple-50 text-purple-700" : "bg-blue-50 text-blue-700"}`}>
      {isMad ? "MAD" : "Trajet"}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">{title}</p>
      <div className="bg-gray-50 rounded-xl p-3 space-y-2">
        {children}
      </div>
    </div>
  );
}

function DetailRow({ label, value, bold }: { label: string; value: string | number | null | undefined; bold?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-xs text-gray-500 shrink-0">{label}</span>
      <span className={`text-sm text-gray-900 text-right ${bold ? "font-semibold" : ""}`}>{String(value)}</span>
    </div>
  );
}

const STATUT_CAL_COLOR: Record<string, string> = {
  nouvelle: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmee: "bg-green-100 text-green-800 border-green-200",
  en_cours: "bg-blue-100 text-blue-800 border-blue-200",
  terminee: "bg-gray-100 text-gray-600 border-gray-200",
  annulee: "bg-red-100 text-red-700 border-red-200",
};

function CalendarView({
  reservations,
  date,
  onDateChange,
  onSelect,
  selected,
}: {
  reservations: Reservation[];
  date: Date;
  onDateChange: (d: Date) => void;
  onSelect: (r: Reservation) => void;
  selected: Reservation | null;
}) {
  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Start grid on Monday (0=Mon … 6=Sun)
  const startOffset = (firstDay.getDay() + 6) % 7;
  const totalCells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7;

  const cells: (number | null)[] = Array.from({ length: totalCells }, (_, i) => {
    const dayNum = i - startOffset + 1;
    return dayNum >= 1 && dayNum <= lastDay.getDate() ? dayNum : null;
  });

  // Group reservations by day of month (only current month)
  const byDay: Record<number, Reservation[]> = {};
  for (const r of reservations) {
    if (!r.date_prise_en_charge) continue;
    const d = new Date(r.date_prise_en_charge as string);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!byDay[day]) byDay[day] = [];
      byDay[day].push(r);
    }
  }

  const monthLabel = new Date(year, month, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  function prevMonth() {
    onDateChange(new Date(year, month - 1, 1));
  }
  function nextMonth() {
    onDateChange(new Date(year, month + 1, 1));
  }

  const today = new Date();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Header nav */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600">
          ←
        </button>
        <span className="text-sm font-semibold text-gray-900 capitalize">{monthLabel}</span>
        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600">
          →
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 border-b border-gray-50">
        {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
          <div key={d} className="py-2 text-center text-xs font-medium text-gray-400">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 divide-x divide-gray-50">
        {cells.map((dayNum, idx) => {
          const isToday =
            dayNum !== null &&
            today.getDate() === dayNum &&
            today.getMonth() === month &&
            today.getFullYear() === year;

          const dayResos = dayNum ? (byDay[dayNum] || []) : [];

          return (
            <div
              key={idx}
              className={`min-h-[88px] p-1.5 border-b border-gray-50 ${dayNum ? "" : "bg-gray-50/40"}`}
            >
              {dayNum && (
                <>
                  <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium mb-1 ${isToday ? "bg-gray-900 text-white" : "text-gray-500"}`}>
                    {dayNum}
                  </div>
                  <div className="space-y-0.5">
                    {dayResos.slice(0, 3).map((r) => {
                      const statut = (r.statut as string) || "";
                      const colorClass = STATUT_CAL_COLOR[statut] || "bg-gray-100 text-gray-600 border-gray-200";
                      const isSelected = selected?.Id === r.Id;
                      return (
                        <button
                          key={r.Id as number}
                          onClick={() => onSelect(r)}
                          className={`w-full text-left px-1.5 py-0.5 rounded text-[10px] font-medium border truncate leading-4 transition-opacity ${colorClass} ${isSelected ? "ring-1 ring-offset-0 ring-gray-900" : "hover:opacity-80"}`}
                        >
                          {r.prenom_client as string} {(r.nom_client as string)?.[0]}.
                          {" "}
                          {new Date(r.date_prise_en_charge as string).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </button>
                      );
                    })}
                    {dayResos.length > 3 && (
                      <p className="text-[10px] text-gray-400 pl-1">+{dayResos.length - 3} autres</p>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
