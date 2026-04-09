"use client";

import { useState, useTransition } from "react";
import { updateSocieteAction, changePasswordAction } from "./actions";

type Societe = {
  Id: number;
  nom?: string;
  slug?: string;
  telephone?: string;
  email_contact?: string;
  siret?: string;
  logo_url?: string;
  couleur_primaire?: string;
  domaine_perso?: string;
} | null;

export default function ParametresClient({ societe, slug }: { societe: Societe; slug: string }) {
  const [form, setForm] = useState({
    nom: societe?.nom || "",
    telephone: societe?.telephone || "",
    email_contact: societe?.email_contact || "",
    siret: societe?.siret || "",
    logo_url: societe?.logo_url || "",
    couleur_primaire: societe?.couleur_primaire || "",
    domaine_perso: societe?.domaine_perso || "",
  });
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [pwd, setPwd] = useState({ nouveau: "", confirmer: "" });
  const [pwdPending, startPwdTransition] = useTransition();
  const [pwdSaved, setPwdSaved] = useState(false);
  const [pwdError, setPwdError] = useState("");

  function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (!societe?.Id) return;
    if (pwd.nouveau.length < 8) { setPwdError("8 caractères minimum."); return; }
    if (pwd.nouveau !== pwd.confirmer) { setPwdError("Les mots de passe ne correspondent pas."); return; }
    setPwdError("");
    startPwdTransition(async () => {
      try {
        await changePasswordAction(societe.Id, pwd.nouveau);
        setPwd({ nouveau: "", confirmer: "" });
        setPwdSaved(true);
        setTimeout(() => setPwdSaved(false), 3000);
      } catch {
        setPwdError("Erreur lors du changement de mot de passe.");
      }
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!societe?.Id) {
      setError("Société introuvable dans NocoDB. Vérifiez la configuration de la table Sociétés.");
      return;
    }
    setError("");
    startTransition(async () => {
      try {
        await updateSocieteAction(societe.Id, form);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } catch {
        setError("Erreur lors de la sauvegarde.");
      }
    });
  }

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>}

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <h2 className="font-semibold text-gray-900">Identité</h2>

        <Field label="Nom de la société" required>
          <input
            type="text"
            value={form.nom}
            onChange={(e) => setForm({ ...form, nom: e.target.value })}
            required
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-900 transition-colors"
          />
        </Field>

        <Field label="Slug (identifiant)" hint="Ne pas modifier — utilisé pour les réservations">
          <input
            type="text"
            value={slug}
            disabled
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white focus:outline-none opacity-50 cursor-not-allowed"
          />
        </Field>

        <Field label="SIRET">
          <input
            type="text"
            value={form.siret}
            onChange={(e) => setForm({ ...form, siret: e.target.value })}
            placeholder="123 456 789 00012"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-900 transition-colors"
          />
        </Field>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <h2 className="font-semibold text-gray-900">Contact & notifications</h2>

        <Field label="Téléphone / WhatsApp" hint="Format international : 33612345678">
          <input
            type="text"
            value={form.telephone}
            onChange={(e) => setForm({ ...form, telephone: e.target.value })}
            placeholder="33612345678"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-900 transition-colors"
          />
        </Field>

        <Field label="Email de contact" hint="Ex: contact@monvtc.fr">
          <input
            type="email"
            value={form.email_contact}
            onChange={(e) => setForm({ ...form, email_contact: e.target.value })}
            placeholder="contact@monvtc.fr"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-900 transition-colors"
          />
        </Field>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <h2 className="font-semibold text-gray-900">Personnalisation</h2>

        <Field label="URL du logo">
          <input
            type="url"
            value={form.logo_url}
            onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
            placeholder="https://monvtc.fr/logo.png"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-900 transition-colors"
          />
        </Field>

        <Field label="Couleur primaire" hint="Code hexadécimal ex: #1a1a2e">
          <input
            type="text"
            value={form.couleur_primaire}
            onChange={(e) => setForm({ ...form, couleur_primaire: e.target.value })}
            placeholder="#1a1a2e"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-900 transition-colors"
          />
        </Field>

        <Field label="Domaine personnalisé" hint="Ex: reservations.monvtc.fr (optionnel)">
          <input
            type="text"
            value={form.domaine_perso}
            onChange={(e) => setForm({ ...form, domaine_perso: e.target.value })}
            placeholder="reservations.monvtc.fr"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-900 transition-colors"
          />
        </Field>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {isPending ? "Sauvegarde…" : "Sauvegarder"}
        </button>
        {saved && <span className="text-sm text-green-600">Sauvegardé</span>}
      </div>
    </form>

    <form onSubmit={handlePasswordChange} className="mt-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <h2 className="font-semibold text-gray-900">Changer le mot de passe</h2>
        {pwdError && <p className="text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-xl">{pwdError}</p>}

        <Field label="Nouveau mot de passe" hint="8 caractères minimum">
          <input
            type="password"
            value={pwd.nouveau}
            onChange={(e) => setPwd({ ...pwd, nouveau: e.target.value })}
            placeholder="••••••••"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-900 transition-colors"
          />
        </Field>

        <Field label="Confirmer le mot de passe">
          <input
            type="password"
            value={pwd.confirmer}
            onChange={(e) => setPwd({ ...pwd, confirmer: e.target.value })}
            placeholder="••••••••"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-900 transition-colors"
          />
        </Field>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={pwdPending}
            className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {pwdPending ? "Mise à jour…" : "Changer le mot de passe"}
          </button>
          {pwdSaved && <span className="text-sm text-green-600">Mot de passe mis à jour</span>}
        </div>
      </div>
    </form>
    </>
  );
}

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}
