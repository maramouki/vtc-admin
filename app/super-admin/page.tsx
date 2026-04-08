"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Client = {
  Id: number;
  nom: string;
  slug: string;
  email_contact: string;
  actif: boolean;
  plan: string;
  date_fin_trial?: string;
};

export default function SuperAdminPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({ nom: "", slug: "", email: "", password: "" });

  useEffect(() => {
    fetch("/api/super-admin/clients")
      .then((r) => r.json())
      .then((data) => { setClients(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const res = await fetch("/api/super-admin/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      setClients((prev) => [...prev, data].sort((a, b) => a.nom.localeCompare(b.nom)));
      setForm({ nom: "", slug: "", email: "", password: "" });
      setShowForm(false);
      setSuccess(`Compte "${form.nom}" créé avec succès.`);
      setTimeout(() => setSuccess(""), 4000);
    } else {
      setError(data.error || "Erreur lors de la création.");
    }
    setSaving(false);
  }

  async function toggleActif(client: Client) {
    const res = await fetch("/api/super-admin/clients", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: client.Id, actif: !client.actif }),
    });
    if (res.ok) {
      setClients((prev) => prev.map((c) => c.Id === client.Id ? { ...c, actif: !c.actif } : c));
    }
  }

  async function handleLogout() {
    await fetch("/api/super-admin/auth", { method: "DELETE" });
    router.push("/super-admin/login");
  }

  function slugify(nom: string) {
    return nom.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-2xl font-bold">Super Admin</h1>
            <p className="text-sm text-gray-500 mt-0.5">Gestion des comptes clients</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setShowForm(!showForm); setError(""); }}
              className="px-4 py-2 bg-white text-gray-900 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors"
            >
              + Nouveau client
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 border border-gray-700 text-gray-400 rounded-xl text-sm hover:border-gray-500 hover:text-white transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </div>

        {/* Toast success */}
        {success && (
          <div className="mb-6 px-5 py-3 bg-green-900/50 border border-green-700 text-green-300 text-sm rounded-xl">
            ✓ {success}
          </div>
        )}

        {/* Formulaire création */}
        {showForm && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
            <h2 className="text-base font-semibold mb-5">Créer un compte client</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Nom de la société</label>
                  <input
                    type="text"
                    value={form.nom}
                    onChange={(e) => setForm({ ...form, nom: e.target.value, slug: slugify(e.target.value) })}
                    placeholder="Lyon VTC Premium"
                    required
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Slug (identifiant URL)</label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="lyon-vtc-premium"
                    required
                    pattern="[a-z0-9-]+"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-gray-500 font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Email de connexion</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="contact@lyon-vtc.fr"
                    required
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Mot de passe initial</label>
                  <input
                    type="text"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="min. 8 caractères"
                    required
                    minLength={8}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-gray-500 font-mono"
                  />
                </div>
              </div>
              {error && <p className="text-sm text-red-400 bg-red-950/50 px-4 py-2.5 rounded-xl">{error}</p>}
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-white text-gray-900 rounded-xl text-sm font-semibold hover:bg-gray-100 disabled:opacity-50 transition-colors"
                >
                  {saving ? "Création…" : "Créer le compte"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setError(""); }}
                  className="px-5 py-2 border border-gray-700 text-gray-400 rounded-xl text-sm hover:text-white transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Liste clients */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          {loading ? (
            <p className="text-center text-gray-500 text-sm py-12">Chargement…</p>
          ) : clients.length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-12">Aucun client</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Société</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Plan</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Statut</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.Id} className="border-b border-gray-800/50 last:border-0">
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-white">{c.nom}</div>
                      <div className="text-xs text-gray-500 font-mono mt-0.5">{c.slug}</div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-400">{c.email_contact}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-block px-2 py-0.5 bg-blue-900/50 text-blue-300 text-xs rounded-full font-medium">
                        {c.plan || "trial"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => toggleActif(c)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          c.actif
                            ? "bg-green-900/50 text-green-300 hover:bg-red-900/50 hover:text-red-300"
                            : "bg-red-900/50 text-red-300 hover:bg-green-900/50 hover:text-green-300"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${c.actif ? "bg-green-400" : "bg-red-400"}`} />
                        {c.actif ? "Actif" : "Inactif"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
