"use client";

import { useState, useTransition, useEffect } from "react";
import { createOptionAction, updateOptionAction, deleteOptionAction } from "./actions";
import Drawer from "@/components/Drawer";
import ConfirmModal from "@/components/ConfirmModal";
import type { Option } from "@/lib/nocodb";

const EMPTY: Partial<Option> = {
  nom: "",
  description: "",
  prix: undefined,
  type_prix: "fixe",
  quantite_max: 1,
  actif: true,
  ordre_affichage: undefined,
};

type DrawerState = { mode: "create" } | { mode: "edit"; option: Option } | null;

export default function OptionsClient({ rows: initial, societeSlug }: { rows: Option[]; societeSlug: string }) {
  const [rows, setRows] = useState<Option[]>(initial);
  const [drawer, setDrawer] = useState<DrawerState>(null);
  const [formData, setFormData] = useState<Partial<Option>>(EMPTY);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  useEffect(() => { setRows(initial); }, [initial]);

  function openCreate() {
    setFormData(EMPTY);
    setDrawer({ mode: "create" });
    setError("");
  }

  function openEdit(opt: Option) {
    setFormData({
      nom: opt.nom,
      description: opt.description,
      prix: opt.prix,
      type_prix: opt.type_prix,
      quantite_max: opt.quantite_max,
      actif: opt.actif,
      ordre_affichage: opt.ordre_affichage,
    });
    setDrawer({ mode: "edit", option: opt });
    setError("");
  }

  function handleSave() {
    if (!drawer) return;
    if (!formData.nom) { setError("Le nom est requis."); return; }
    setError("");

    if (drawer.mode === "create") {
      startTransition(async () => {
        try {
          const result = await createOptionAction({ ...formData, societe_slug: societeSlug }) as Option;
          setRows([...rows, result]);
          setDrawer(null);
        } catch {
          setError("Erreur lors de la création.");
        }
      });
    } else {
      const id = drawer.option.Id;
      startTransition(async () => {
        try {
          await updateOptionAction(id, formData);
          setRows(rows.map((r) => (r.Id === id ? { ...r, ...formData } as Option : r)));
          setDrawer(null);
        } catch {
          setError("Erreur lors de la sauvegarde.");
        }
      });
    }
  }

  function doDelete() {
    if (deleteId === null) return;
    startTransition(async () => {
      try {
        await deleteOptionAction(deleteId);
        setRows(rows.filter((r) => r.Id !== deleteId));
        setDeleteId(null);
      } catch {
        setError("Erreur lors de la suppression.");
      }
    });
  }

  const drawerTitle = drawer
    ? drawer.mode === "create" ? "Nouvelle option" : drawer.option.nom
    : "";

  return (
    <div>
      {error && !drawer && <p className="mb-4 text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>}

      <div className="mb-4">
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors">
          + Ajouter une option
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {rows.length === 0 ? (
          <p className="px-6 py-12 text-sm text-gray-500 text-center">Aucune option configurée</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Nom</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Prix</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Type</th>
                <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Qté max</th>
                <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Actif</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((opt) => (
                <tr key={opt.Id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-gray-900">{opt.nom}</div>
                    {opt.description && <div className="text-xs text-gray-400 mt-0.5">{opt.description}</div>}
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold text-gray-900 whitespace-nowrap">{opt.prix != null ? `${opt.prix} €` : "—"}</td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs text-gray-500">{opt.type_prix === "par_unite" ? "Par unité" : "Fixe"}</span>
                  </td>
                  <td className="px-5 py-3.5 text-center text-gray-700">{opt.quantite_max ?? "—"}</td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`inline-block w-2 h-2 rounded-full ${opt.actif ? "bg-green-400" : "bg-gray-200"}`} />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-1.5 justify-end">
                      <button onClick={() => openEdit(opt)} className="px-3 py-1 border border-gray-300 text-xs text-gray-700 rounded-lg hover:bg-gray-50">Modifier</button>
                      <button onClick={() => setDeleteId(opt.Id)} className="px-3 py-1 border border-red-100 text-red-500 text-xs rounded-lg hover:bg-red-50">Suppr.</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Drawer
        open={drawer !== null}
        onClose={() => setDrawer(null)}
        subtitle="Options"
        title={drawerTitle}
        footer={
          <div className="space-y-2">
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="flex gap-3">
              <button onClick={handleSave} disabled={isPending} className="flex-1 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors">
                {isPending ? "Sauvegarde…" : drawer?.mode === "create" ? "Créer" : "Sauvegarder"}
              </button>
              <button onClick={() => setDrawer(null)} className="px-5 py-2.5 border border-gray-200 text-sm text-gray-700 rounded-xl hover:bg-gray-50 transition-colors">
                Annuler
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <Field label="Nom *">
            <input type="text" placeholder="Ex : Meet & Greet" value={formData.nom || ""} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-900" />
          </Field>

          <Field label="Description">
            <textarea rows={2} placeholder="Optionnel — affiché au client" value={formData.description || ""} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-900 resize-none" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Prix (€)">
              <input type="number" min="0" step="0.5" placeholder="15" value={formData.prix ?? ""} onChange={(e) => setFormData({ ...formData, prix: e.target.value ? Number(e.target.value) : undefined })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-900" />
            </Field>
            <Field label="Type de prix">
              <select value={formData.type_prix || "fixe"} onChange={(e) => setFormData({ ...formData, type_prix: e.target.value as "fixe" | "par_unite" })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-900">
                <option value="fixe">Fixe</option>
                <option value="par_unite">Par unité</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Quantité max">
              <input type="number" min="1" placeholder="1" value={formData.quantite_max ?? ""} onChange={(e) => setFormData({ ...formData, quantite_max: e.target.value ? Number(e.target.value) : undefined })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-900" />
            </Field>
            <Field label="Ordre d'affichage">
              <input type="number" min="0" placeholder="1" value={formData.ordre_affichage ?? ""} onChange={(e) => setFormData({ ...formData, ordre_affichage: e.target.value ? Number(e.target.value) : undefined })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-900" />
            </Field>
          </div>

          <Field label="Actif">
            <div className="flex items-center gap-3 mt-1">
              <Switch checked={formData.actif ?? true} onChange={(v) => setFormData({ ...formData, actif: v })} />
              <span className="text-sm text-gray-600">{formData.actif ? "Visible par les clients" : "Masqué"}</span>
            </div>
          </Field>
        </div>
      </Drawer>

      <ConfirmModal
        open={deleteId !== null}
        title="Supprimer cette option ?"
        message="Cette action est irréversible."
        confirmLabel="Supprimer"
        danger
        onConfirm={doDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-gray-500 mb-1.5 block font-medium">{label}</label>
      {children}
    </div>
  );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${checked ? "bg-gray-900" : "bg-gray-200"}`}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${checked ? "translate-x-4" : "translate-x-0"}`} />
    </button>
  );
}
