"use client";

import { useState, useTransition, useEffect } from "react";
import { updateTarifMadAction, createTarifMadAction } from "./actions";
import Drawer from "@/components/Drawer";

type TarifMad = {
  Id: number;
  type_vehicule: string;
  tarif_horaire: number;
  min_heures: number;
  max_heures: number;
  tarif_journee?: number;
};

type DrawerState =
  | { mode: "edit"; row: TarifMad }
  | { mode: "create"; vehicle: string }
  | null;

const EMPTY_DATA = { tarif_horaire: undefined as number | undefined, min_heures: undefined as number | undefined, max_heures: undefined as number | undefined, tarif_journee: undefined as number | undefined };

export default function MadClient({ rows: initial, societeSlug, vehicles }: { rows: TarifMad[]; societeSlug: string; vehicles: string[] }) {
  const [rows, setRows] = useState<TarifMad[]>(initial);

  useEffect(() => {
    setRows(initial);
  }, [initial]);

  const [drawer, setDrawer] = useState<DrawerState>(null);
  const [formData, setFormData] = useState<typeof EMPTY_DATA>(EMPTY_DATA);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<number | null>(null);

  function openEdit(row: TarifMad) {
    setFormData({
      tarif_horaire: row.tarif_horaire,
      min_heures: row.min_heures,
      max_heures: row.max_heures,
      tarif_journee: row.tarif_journee,
    });
    setDrawer({ mode: "edit", row });
    setError("");
  }

  function openCreate(vehicle: string) {
    setFormData(EMPTY_DATA);
    setDrawer({ mode: "create", vehicle });
    setError("");
  }

  function handleSave() {
    if (!drawer) return;
    setError("");

    if (drawer.mode === "edit") {
      const id = drawer.row.Id;
      startTransition(async () => {
        try {
          await updateTarifMadAction(id, formData);
          setRows(rows.map((r) => (r.Id === id ? { ...r, ...formData } : r)));
          setSaved(id);
          setTimeout(() => setSaved(null), 2000);
          setDrawer(null);
        } catch {
          setError("Erreur lors de la sauvegarde.");
        }
      });
    } else {
      startTransition(async () => {
        try {
          const result = await createTarifMadAction({ ...formData, type_vehicule: drawer.vehicle, societe_slug: societeSlug }) as TarifMad;
          setRows([...rows, result]);
          setDrawer(null);
        } catch {
          setError("Erreur lors de la création.");
        }
      });
    }
  }

  const drawerTitle = drawer
    ? drawer.mode === "edit"
      ? drawer.row.type_vehicule
      : drawer.vehicle
    : "";

  return (
    <div className="space-y-4">
      {vehicles.map((vehicle) => {
        const row = rows.find((r) => r.type_vehicule === vehicle);

        return (
          <div key={vehicle} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
              <div className="font-semibold text-gray-900">{vehicle}</div>
              <div className="flex items-center gap-2">
                {row && saved === row.Id && <span className="text-xs text-green-600">Sauvegardé</span>}
                {row ? (
                  <button
                    onClick={() => openEdit(row)}
                    className="px-3 py-1.5 border border-gray-300 text-xs text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Modifier
                  </button>
                ) : (
                  <button
                    onClick={() => openCreate(vehicle)}
                    className="px-3 py-1.5 border border-gray-300 text-xs text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Configurer
                  </button>
                )}
              </div>
            </div>

            {row ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 divide-x divide-gray-50">
                <TarifDisplay label="Tarif horaire" value={row.tarif_horaire} suffix="€/h" />
                <TarifDisplay label="Minimum" value={row.min_heures} suffix="h" />
                <TarifDisplay label="Maximum" value={row.max_heures} suffix="h" />
                <TarifDisplay label="Journée" value={row.tarif_journee} suffix="€" optional />
              </div>
            ) : (
              <div className="px-6 py-4">
                <p className="text-sm text-gray-400">Aucun tarif configuré</p>
              </div>
            )}
          </div>
        );
      })}

      <Drawer
        open={drawer !== null}
        onClose={() => setDrawer(null)}
        subtitle="Mise à disposition"
        title={drawerTitle}
        footer={
          <div className="space-y-2">
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={isPending}
                className="flex-1 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {isPending ? "Sauvegarde…" : drawer?.mode === "create" ? "Créer" : "Sauvegarder"}
              </button>
              <button
                onClick={() => setDrawer(null)}
                className="px-5 py-2.5 border border-gray-200 text-sm text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <DrawerField label="Tarif horaire (€/h)">
            <input type="number" min="0" value={formData.tarif_horaire ?? ""} onChange={(e) => setFormData({ ...formData, tarif_horaire: e.target.value ? Number(e.target.value) : undefined })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-900" placeholder="Ex : 80" />
          </DrawerField>
          <div className="grid grid-cols-2 gap-4">
            <DrawerField label="Minimum (h)">
              <input type="number" min="0" value={formData.min_heures ?? ""} onChange={(e) => setFormData({ ...formData, min_heures: e.target.value ? Number(e.target.value) : undefined })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-900" placeholder="Ex : 2" />
            </DrawerField>
            <DrawerField label="Maximum (h)">
              <input type="number" min="0" value={formData.max_heures ?? ""} onChange={(e) => setFormData({ ...formData, max_heures: e.target.value ? Number(e.target.value) : undefined })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-900" placeholder="Ex : 10" />
            </DrawerField>
          </div>
          <DrawerField label="Tarif journée (€) — optionnel">
            <input type="number" min="0" value={formData.tarif_journee ?? ""} onChange={(e) => setFormData({ ...formData, tarif_journee: e.target.value ? Number(e.target.value) : undefined })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-900" placeholder="Ex : 600" />
          </DrawerField>
        </div>
      </Drawer>
    </div>
  );
}

function DrawerField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-gray-500 mb-1.5 block font-medium">{label}</label>
      {children}
    </div>
  );
}

function TarifDisplay({ label, value, suffix, optional }: { label: string; value?: number; suffix: string; optional?: boolean }) {
  return (
    <div className="px-6 py-4">
      <div className="text-xs font-medium text-gray-500 mb-1">{label}{optional && " (opt.)"}</div>
      <div className="text-lg font-semibold text-gray-900">
        {value != null ? `${value} ${suffix}` : <span className="text-gray-300 font-normal text-sm">—</span>}
      </div>
    </div>
  );
}
