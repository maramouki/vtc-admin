"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { updateMatricePrixAction, createMatricePrixBatchAction, deleteMatricePrixAction } from "./actions";
import ConfirmModal from "@/components/ConfirmModal";
import Drawer from "@/components/Drawer";

type Row = {
  Id: number;
  dept_depart: string;
  dept_arrivee: string;
  type_vehicule: string;
  prix_base?: number;
  prix_nuit?: number;
  prix_weekend?: number;
  societe_slug?: string;
};

const EMPTY_NEW: Partial<Row> = {
  dept_depart: "",
  dept_arrivee: "",
  type_vehicule: "",
  prix_base: undefined,
  prix_nuit: undefined,
  prix_weekend: undefined,
};

export default function MatriceClient({ rows: initial, societeSlug, vehicles }: { rows: Row[]; societeSlug: string; vehicles: string[] }) {
  const [rows, setRows] = useState<Row[]>(initial);

  useEffect(() => {
    setRows(initial);
  }, [initial]);

  const [editing, setEditing] = useState<Row | null>(null);
  const [editData, setEditData] = useState<Partial<Row>>({});
  const [adding, setAdding] = useState(false);
  const [newBase, setNewBase] = useState<Omit<Partial<Row>, "type_vehicule">>({ dept_depart: "", dept_arrivee: "", prix_base: undefined, prix_nuit: undefined, prix_weekend: undefined });
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function toggleVehicle(v: string) {
    setSelectedVehicles((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]);
  }

  function startEdit(row: Row) {
    setEditing(row);
    setEditData({ type_vehicule: row.type_vehicule, prix_base: row.prix_base, prix_nuit: row.prix_nuit, prix_weekend: row.prix_weekend });
  }

  function saveEdit() {
    if (!editing) return;
    setError("");
    if (editData.type_vehicule) {
      const conflict = rows.some(
        (r) =>
          r.Id !== editing.Id &&
          r.dept_depart === editing.dept_depart &&
          r.dept_arrivee === editing.dept_arrivee &&
          r.type_vehicule === editData.type_vehicule
      );
      if (conflict) {
        setError(`Un tarif existe déjà pour ce trajet avec le véhicule "${editData.type_vehicule}".`);
        return;
      }
    }
    startTransition(async () => {
      try {
        await updateMatricePrixAction(editing.Id, editData);
        setRows(rows.map((r) => (r.Id === editing.Id ? { ...r, ...editData } : r)));
        setEditing(null);
      } catch {
        setError("Erreur lors de la sauvegarde.");
      }
    });
  }

  function addRow() {
    setError("");
    if (!newBase.dept_depart || !newBase.dept_arrivee || selectedVehicles.length === 0) {
      setError("Département départ, arrivée et au moins un véhicule requis.");
      return;
    }
    const duplicates = selectedVehicles.filter((v) =>
      rows.some(
        (r) =>
          r.dept_depart === newBase.dept_depart &&
          r.dept_arrivee === newBase.dept_arrivee &&
          r.type_vehicule === v
      )
    );
    if (duplicates.length > 0) {
      setError(`Trajet déjà configuré pour : ${duplicates.join(", ")}`);
      return;
    }
    startTransition(async () => {
      try {
        const items = selectedVehicles.map((v) => ({ ...newBase, type_vehicule: v, societe_slug: societeSlug }));
        await createMatricePrixBatchAction(items);
        setAdding(false);
        setNewBase({ dept_depart: "", dept_arrivee: "", prix_base: undefined, prix_nuit: undefined, prix_weekend: undefined });
        setSelectedVehicles([]);
      } catch {
        setError("Erreur lors de la création.");
      }
    });
  }

  function confirmDelete(id: number) {
    setDeleteId(id);
  }

  function doDelete() {
    if (deleteId === null) return;
    startTransition(async () => {
      try {
        await deleteMatricePrixAction(deleteId);
        setRows(rows.filter((r) => r.Id !== deleteId));
        setDeleteId(null);
      } catch {
        setError("Erreur lors de la suppression.");
      }
    });
  }

  return (
    <div>
      {error && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-red-600 text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-lg max-w-md">
          <span>⚠️</span>
          <span>{error}</span>
          <button onClick={() => setError("")} className="ml-2 text-white/70 hover:text-white text-lg leading-none">×</button>
        </div>
      )}

      {/* Bouton ajouter en haut */}
      <div className="mb-4">
        {!adding ? (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            + Ajouter une ligne
          </button>
        ) : (
          <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 mb-2">
            <p className="text-sm font-medium text-gray-700 mb-3">Nouvelle ligne</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 items-start">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Dept départ</label>
                <input
                  type="text"
                  placeholder="38"
                  value={newBase.dept_depart || ""}
                  onChange={(e) => setNewBase({ ...newBase, dept_depart: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono text-gray-900 bg-white focus:outline-none focus:border-gray-900"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Dept arrivée</label>
                <input
                  type="text"
                  placeholder="69"
                  value={newBase.dept_arrivee || ""}
                  onChange={(e) => setNewBase({ ...newBase, dept_arrivee: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono text-gray-900 bg-white focus:outline-none focus:border-gray-900"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Véhicules</label>
                <MultiSelect vehicles={vehicles} selected={selectedVehicles} onToggle={toggleVehicle} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Prix base (€)</label>
                <input type="number" min="0" placeholder="120" value={newBase.prix_base ?? ""} onChange={(e) => setNewBase({ ...newBase, prix_base: e.target.value === "" ? undefined : Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-900" />
                <label className="text-xs text-gray-500 mt-2 mb-1 block">Prix nuit (€)</label>
                <input type="number" min="0" placeholder="150" value={newBase.prix_nuit ?? ""} onChange={(e) => setNewBase({ ...newBase, prix_nuit: e.target.value === "" ? undefined : Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-900" />
                <label className="text-xs text-gray-500 mt-2 mb-1 block">Prix week-end (€)</label>
                <input type="number" min="0" placeholder="140" value={newBase.prix_weekend ?? ""} onChange={(e) => setNewBase({ ...newBase, prix_weekend: e.target.value === "" ? undefined : Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-900" />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={addRow} disabled={isPending} className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50">
                Ajouter
              </button>
              <button onClick={() => { setAdding(false); setNewBase({ dept_depart: "", dept_arrivee: "", prix_base: undefined, prix_nuit: undefined, prix_weekend: undefined }); setSelectedVehicles([]); }} className="px-4 py-2 border border-gray-200 text-sm text-gray-700 rounded-lg hover:bg-gray-50">
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {rows.length === 0 ? (
          <p className="px-6 py-12 text-sm text-gray-600 text-center">Aucun tarif configuré</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Départ</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Arrivée</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Véhicule</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Base</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Nuit</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Week-end</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.Id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-mono font-semibold text-gray-900">{row.dept_depart}</td>
                  <td className="px-5 py-3 font-mono font-semibold text-gray-900">{row.dept_arrivee}</td>
                  <td className="px-5 py-3 text-gray-800">{row.type_vehicule}</td>
                  <td className="px-5 py-3 text-right text-gray-700">{row.prix_base != null ? `${row.prix_base} €` : "—"}</td>
                  <td className="px-5 py-3 text-right text-gray-700">{row.prix_nuit != null ? `${row.prix_nuit} €` : "—"}</td>
                  <td className="px-5 py-3 text-right text-gray-700">{row.prix_weekend != null ? `${row.prix_weekend} €` : "—"}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1.5 justify-end">
                      <button onClick={() => startEdit(row)} className="px-3 py-1 border border-gray-300 text-xs text-gray-700 rounded-lg hover:bg-gray-50">Modifier</button>
                      <button onClick={() => confirmDelete(row.Id)} className="px-3 py-1 border border-red-100 text-red-500 text-xs rounded-lg hover:bg-red-50">Suppr.</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Drawer édition */}
      <Drawer
        open={editing !== null}
        onClose={() => setEditing(null)}
        subtitle="Modification du tarif"
        title={editing ? `${editing.dept_depart} → ${editing.dept_arrivee}` : ""}
        footer={
          <div className="flex gap-3">
            <button onClick={saveEdit} disabled={isPending} className="flex-1 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors">
              {isPending ? "Sauvegarde…" : "Sauvegarder"}
            </button>
            <button onClick={() => setEditing(null)} className="px-5 py-2.5 border border-gray-200 text-sm text-gray-700 rounded-xl hover:bg-gray-50 transition-colors">
              Annuler
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block font-medium">Véhicule</label>
            <select value={editData.type_vehicule || ""} onChange={(e) => setEditData({ ...editData, type_vehicule: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-900">
              {vehicles.map((v, i) => <option key={i} value={v}>{v}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block font-medium">Prix de base (€)</label>
              <PriceInput value={editData.prix_base} onChange={(v) => setEditData({ ...editData, prix_base: v })} full />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block font-medium">Prix nuit (€)</label>
              <PriceInput value={editData.prix_nuit} onChange={(v) => setEditData({ ...editData, prix_nuit: v })} full />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block font-medium">Prix week-end (€)</label>
              <PriceInput value={editData.prix_weekend} onChange={(v) => setEditData({ ...editData, prix_weekend: v })} full />
            </div>
          </div>
        </div>
      </Drawer>

      <ConfirmModal
        open={deleteId !== null}
        title="Supprimer ce tarif ?"
        message="Cette action est irréversible."
        confirmLabel="Supprimer"
        danger
        onConfirm={doDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

function MultiSelect({ vehicles, selected, onToggle }: { vehicles: string[]; selected: string[]; onToggle: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const label = selected.length === 0
    ? "Sélectionner…"
    : selected.length === 1
    ? selected[0]
    : `${selected.length} véhicules`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-left text-gray-900 bg-white focus:outline-none focus:border-gray-900 flex items-center justify-between gap-2"
      >
        <span className={selected.length === 0 ? "text-gray-400" : ""}>{label}</span>
        <span className="text-gray-400 text-xs">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
          {vehicles.map((v, i) => (
            <label key={i} className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.includes(v)}
                onChange={() => onToggle(v)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">{v}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function PriceInput({ value, onChange, full }: { value?: number; onChange: (v: number | undefined) => void; full?: boolean }) {
  return (
    <input
      type="number"
      min="0"
      placeholder="—"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
      className={`${full ? "w-full" : "w-20 ml-auto"} px-3 py-2 border border-gray-200 rounded-lg text-sm text-right text-gray-900 bg-white focus:outline-none focus:border-gray-900 block`}
    />
  );
}
