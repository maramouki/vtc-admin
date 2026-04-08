"use client";

import { useState, useTransition, useRef } from "react";
import { createVehiculeAction, updateVehiculeAction, deleteVehiculeAction } from "./actions";
import ConfirmModal from "@/components/ConfirmModal";
import Drawer from "@/components/Drawer";

type Vehicule = {
  Id: number;
  marque: string;
  modele: string;
  immatriculation?: string;
  couleur?: string;
  annee?: number;
  disponible?: boolean;
  nb_passagers_max?: number;
  nb_bagages_max?: number;
  image_url?: string;
  notes?: string;
  type_vehicule?: string;
};

const EMPTY: Partial<Vehicule> = {
  marque: "",
  modele: "",
  immatriculation: "",
  couleur: "",
  annee: undefined,
  disponible: true,
  nb_passagers_max: undefined,
  nb_bagages_max: undefined,
  image_url: "",
  type_vehicule: "",
};

export default function FlotteClient({ rows: initial }: { rows: Vehicule[] }) {
  const [rows, setRows] = useState<Vehicule[]>(initial);
  const [adding, setAdding] = useState(false);
  const [newRow, setNewRow] = useState<Partial<Vehicule>>(EMPTY);
  const [addPending, setAddPending] = useState(false);
  const [editing, setEditing] = useState<Vehicule | null>(null);
  const [editData, setEditData] = useState<Partial<Vehicule>>({});
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function startEdit(v: Vehicule) {
    setEditData({
      marque: v.marque,
      modele: v.modele,
      immatriculation: v.immatriculation,
      couleur: v.couleur,
      annee: v.annee,
      disponible: v.disponible,
      nb_passagers_max: v.nb_passagers_max,
      nb_bagages_max: v.nb_bagages_max,
      image_url: v.image_url,
      type_vehicule: v.type_vehicule,
    });
    setEditing(v);
  }

  function saveEdit() {
    if (!editing) return;
    setError("");
    startTransition(async () => {
      try {
        await updateVehiculeAction(editing.Id, editData as Record<string, unknown>);
        setRows(rows.map((r) => (r.Id === editing.Id ? { ...r, ...editData } : r)));
        setEditing(null);
      } catch {
        setError("Erreur lors de la sauvegarde.");
      }
    });
  }

  const isDuplicate = !!(newRow.marque && newRow.modele && rows.some(
    (r) => r.marque.toLowerCase() === newRow.marque!.toLowerCase() &&
            r.modele.toLowerCase() === newRow.modele!.toLowerCase()
  ));

  function addVehicule() {
    if (!newRow.marque || !newRow.modele) { setError("Marque et modèle requis."); return; }
    if (isDuplicate) { setError(`${newRow.marque} ${newRow.modele} existe déjà dans la flotte.`); return; }
    setError("");
    setAddPending(true);
    startTransition(async () => {
      try {
        await createVehiculeAction(newRow as Record<string, unknown>);
        setRows([...rows, { ...newRow, Id: Date.now() } as Vehicule]);
        setAdding(false);
        setNewRow(EMPTY);
      } catch {
        setError("Erreur lors de la création.");
      } finally {
        setAddPending(false);
      }
    });
  }

  function doDelete() {
    if (deleteId === null) return;
    startTransition(async () => {
      try {
        await deleteVehiculeAction(deleteId);
        setRows(rows.filter((r) => r.Id !== deleteId));
        setDeleteId(null);
      } catch {
        setError("Erreur lors de la suppression.");
      }
    });
  }

  return (
    <div>
      {error && <p className="mb-4 text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>}

      <div className="mb-4">
        <button onClick={() => { setAdding(true); setNewRow(EMPTY); setError(""); }} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors">
          + Ajouter un véhicule
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
        {rows.length === 0 ? (
          <p className="px-6 py-12 text-sm text-gray-600 text-center">Aucun véhicule dans la flotte</p>
        ) : (
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Véhicule</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Immat.</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Catégorie</th>
                <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Pass.</th>
                <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Bag.</th>
                <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Dispo</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((v) => (
                <tr key={v.Id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {v.image_url && <img src={v.image_url} alt={`${v.marque} ${v.modele}`} className="w-10 h-7 object-cover rounded-md border border-gray-100 shrink-0" />}
                      <div>
                        <div className="font-medium text-gray-900">{v.marque} {v.modele}</div>
                        {v.couleur && <div className="text-xs text-gray-400">{v.couleur}{v.annee ? ` · ${v.annee}` : ""}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-gray-700">{v.immatriculation || "—"}</td>
                  <td className="px-5 py-3.5 text-gray-700">{v.type_vehicule || "—"}</td>
                  <td className="px-5 py-3.5 text-center text-gray-700">{v.nb_passagers_max ?? "—"}</td>
                  <td className="px-5 py-3.5 text-center text-gray-700">{v.nb_bagages_max ?? "—"}</td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`inline-block w-2 h-2 rounded-full ${v.disponible ? "bg-green-400" : "bg-red-300"}`} />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-1.5 justify-end">
                      <button onClick={() => startEdit(v)} className="px-3 py-1 border border-gray-300 text-xs text-gray-700 rounded-lg hover:bg-gray-50">Modifier</button>
                      <button onClick={() => setDeleteId(v.Id)} className="px-3 py-1 border border-red-100 text-red-500 text-xs rounded-lg hover:bg-red-50">Suppr.</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        </div>
      </div>

      {/* Drawer ajout */}
      <Drawer
        open={adding}
        onClose={() => { setAdding(false); setNewRow(EMPTY); setError(""); }}
        title="Nouveau véhicule"
        subtitle="Ajout à la flotte"
        footer={
          <div className="flex gap-3">
            <button onClick={addVehicule} disabled={isPending || isDuplicate || addPending} className="flex-1 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors">
              {addPending ? "Ajout…" : "Ajouter"}
            </button>
            <button onClick={() => { setAdding(false); setNewRow(EMPTY); setError(""); }} className="px-5 py-2.5 border border-gray-200 text-sm text-gray-700 rounded-xl hover:bg-gray-50 transition-colors">
              Annuler
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormField label="Photo du véhicule">
            <ImageUploadInput value={newRow.image_url} onChange={(v) => setNewRow({ ...newRow, image_url: v })} large />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Marque *">
              <input type="text" placeholder="Mercedes" value={newRow.marque || ""} onChange={(e) => setNewRow({ ...newRow, marque: e.target.value })} className={`w-full px-3 py-2 border rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-900 ${isDuplicate ? "border-orange-400" : "border-gray-200"}`} />
            </FormField>
            <FormField label="Modèle *">
              <input type="text" placeholder="Classe E" value={newRow.modele || ""} onChange={(e) => setNewRow({ ...newRow, modele: e.target.value })} className={`w-full px-3 py-2 border rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-900 ${isDuplicate ? "border-orange-400" : "border-gray-200"}`} />
              {isDuplicate && <p className="text-xs text-orange-600 mt-1">Ce véhicule existe déjà.</p>}
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Immatriculation">
              <input type="text" placeholder="AB-123-CD" value={newRow.immatriculation || ""} onChange={(e) => setNewRow({ ...newRow, immatriculation: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-900" />
            </FormField>
            <FormField label="Couleur">
              <input type="text" placeholder="Noir" value={newRow.couleur || ""} onChange={(e) => setNewRow({ ...newRow, couleur: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-900" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Année">
              <input type="number" placeholder="2023" value={newRow.annee ?? ""} onChange={(e) => setNewRow({ ...newRow, annee: e.target.value ? Number(e.target.value) : undefined })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-900" />
            </FormField>
            <FormField label="Catégorie">
              <input type="text" placeholder="Berline / Van / Luxe" value={newRow.type_vehicule || ""} onChange={(e) => setNewRow({ ...newRow, type_vehicule: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-900" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Passagers max">
              <input type="number" min="1" placeholder="3" value={newRow.nb_passagers_max ?? ""} onChange={(e) => setNewRow({ ...newRow, nb_passagers_max: e.target.value ? Number(e.target.value) : undefined })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-900" />
            </FormField>
            <FormField label="Bagages max">
              <input type="number" min="0" placeholder="3" value={newRow.nb_bagages_max ?? ""} onChange={(e) => setNewRow({ ...newRow, nb_bagages_max: e.target.value ? Number(e.target.value) : undefined })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-900" />
            </FormField>
          </div>
          <FormField label="Disponible">
            <div className="flex items-center gap-3 mt-1">
              <Switch checked={newRow.disponible ?? true} onChange={(v) => setNewRow({ ...newRow, disponible: v })} />
              <span className="text-sm text-gray-600">{newRow.disponible ? "Disponible" : "Indisponible"}</span>
            </div>
          </FormField>
          {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>}
        </div>
      </Drawer>

      {/* Drawer édition */}
      <Drawer
        open={editing !== null}
        onClose={() => setEditing(null)}
        subtitle="Modification"
        title={editing ? `${editing.marque} ${editing.modele}` : ""}
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
          <FormField label="Photo du véhicule">
            <ImageUploadInput value={editData.image_url} onChange={(val) => setEditData({ ...editData, image_url: val })} large />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Marque">
              <input type="text" value={editData.marque || ""} onChange={(e) => setEditData({ ...editData, marque: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-900" />
            </FormField>
            <FormField label="Modèle">
              <input type="text" value={editData.modele || ""} onChange={(e) => setEditData({ ...editData, modele: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-900" />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Immatriculation">
              <input type="text" value={editData.immatriculation || ""} onChange={(e) => setEditData({ ...editData, immatriculation: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-900" />
            </FormField>
            <FormField label="Couleur">
              <input type="text" value={editData.couleur || ""} onChange={(e) => setEditData({ ...editData, couleur: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-900" />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Année">
              <input type="number" value={editData.annee ?? ""} onChange={(e) => setEditData({ ...editData, annee: e.target.value ? Number(e.target.value) : undefined })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-900" />
            </FormField>
            <FormField label="Catégorie">
              <input type="text" value={editData.type_vehicule || ""} onChange={(e) => setEditData({ ...editData, type_vehicule: e.target.value })} placeholder="Berline…" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-900" />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Passagers max">
              <input type="number" min="1" value={editData.nb_passagers_max ?? ""} onChange={(e) => setEditData({ ...editData, nb_passagers_max: e.target.value ? Number(e.target.value) : undefined })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-900" />
            </FormField>
            <FormField label="Bagages max">
              <input type="number" min="0" value={editData.nb_bagages_max ?? ""} onChange={(e) => setEditData({ ...editData, nb_bagages_max: e.target.value ? Number(e.target.value) : undefined })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-900" />
            </FormField>
          </div>

          <FormField label="Disponible">
            <div className="flex items-center gap-3 mt-1">
              <Switch checked={editData.disponible ?? true} onChange={(v) => setEditData({ ...editData, disponible: v })} />
              <span className="text-sm text-gray-600">{editData.disponible ? "Disponible" : "Indisponible"}</span>
            </div>
          </FormField>
        </div>
      </Drawer>

      <ConfirmModal
        open={deleteId !== null}
        title="Supprimer ce véhicule ?"
        message="Cette action est irréversible."
        confirmLabel="Supprimer"
        danger
        onConfirm={doDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-gray-500 mb-1.5 block font-medium">{label}</label>
      {children}
    </div>
  );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${checked ? "bg-gray-900" : "bg-gray-200"}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${checked ? "translate-x-4" : "translate-x-0"}`} />
    </button>
  );
}

function ImageUploadInput({ value, onChange, large }: { value?: string; onChange: (v: string) => void; large?: boolean }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasImage = value && (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/"));

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) { setUploadError("Fichier non supporté."); return; }
    setUploadError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur upload");
      onChange(data.url);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Erreur lors de l'upload.");
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div className="space-y-2">
      {hasImage ? (
        <div className="relative group">
          <img
            src={value}
            alt="Aperçu"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
            className={`w-full ${large ? "h-44" : "h-24"} object-cover rounded-xl border border-gray-100`}
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 bg-white/90 text-gray-600 hover:text-red-500 text-xs px-2 py-1 rounded-lg border border-gray-200 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Changer
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`w-full ${large ? "h-44" : "h-24"} border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer gap-1.5 transition-colors ${dragging ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-400 hover:bg-gray-50"}`}
        >
          {uploading ? (
            <span className="text-sm text-gray-500">Envoi en cours…</span>
          ) : (
            <>
              <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <span className="text-sm text-gray-400">Glisser une image ici</span>
              <span className="text-xs text-gray-300">ou <span className="underline">parcourir</span></span>
            </>
          )}
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
    </div>
  );
}
