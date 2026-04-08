"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/super-admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push("/super-admin");
    } else {
      setError("Mot de passe incorrect.");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="text-2xl font-bold text-white mb-1">Super Admin</div>
          <p className="text-sm text-gray-500">Accès restreint</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-2xl border border-gray-800 p-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              autoComplete="current-password"
              className="w-full px-4 py-2.5 border border-gray-700 rounded-xl text-sm text-white bg-gray-800 focus:outline-none focus:border-gray-500 transition-colors"
            />
          </div>
          {error && <p className="text-sm text-red-400 bg-red-950 px-4 py-2.5 rounded-xl">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-gray-900 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {loading ? "Vérification…" : "Accéder"}
          </button>
        </form>
      </div>
    </div>
  );
}
