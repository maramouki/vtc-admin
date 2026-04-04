"use client";

import { useState, useRef } from "react";
import type { Vehicule, Option } from "@/lib/nocodb";

type Prestation = "trajet" | "mad";
type PrixTrajet = Record<string, number>;
type TarifMad = { tarif_horaire: number; min_heures: number; max_heures: number; tarif_journee?: number };
type PrixMad = Record<string, TarifMad>;

type BookingData = {
  type_prestation: Prestation;
  adresse_depart: string;
  dept_depart: string;
  adresse_arrivee: string;
  dept_arrivee: string;
  duree_mad: number;
  type_vehicule: string;
  prix_vehicule: number;
  date: string;
  heure: string;
  nb_passagers: number;
  nb_bagages: number;
  numero_vol_train: string;
  options_selectionnees: { nom: string; prix: number; qte: number }[];
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  notes_client: string;
};

type NominatimResult = {
  display_name: string;
  address?: { postcode?: string; city?: string; town?: string; village?: string };
};

// ---- AddressInput ----
function AddressInput({
  label,
  value,
  onChange,
  onDeptChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onDeptChange: (dept: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function handleChange(v: string) {
    onChange(v);
    clearTimeout(timerRef.current);
    if (v.length < 3) { setSuggestions([]); setOpen(false); return; }
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(v)}&format=json&addressdetails=1&limit=5&countrycodes=fr`,
          { headers: { "Accept-Language": "fr" } }
        );
        const data: NominatimResult[] = await res.json();
        setSuggestions(data);
        setOpen(data.length > 0);
      } catch { /* ignore */ }
    }, 350);
  }

  function handleSelect(item: NominatimResult) {
    const parts = item.display_name.split(",").slice(0, 3).map((s) => s.trim());
    onChange(parts.join(", "));
    const postcode = item.address?.postcode || "";
    if (postcode) onDeptChange(postcode.slice(0, 2));
    setSuggestions([]);
    setOpen(false);
  }

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm bg-white"
      />
      {open && (
        <ul className="absolute z-30 w-full bg-white border border-gray-200 rounded-xl shadow-xl mt-1 overflow-hidden">
          {suggestions.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                onMouseDown={() => handleSelect(s)}
                className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0"
              >
                <span className="text-gray-500 mr-2">📍</span>
                {s.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---- StepIndicator ----
function StepIndicator({ current, labels }: { current: number; labels: string[] }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {labels.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <div key={n} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                done ? "bg-gray-900 text-white" : active ? "bg-gray-900 text-white ring-4 ring-gray-200" : "bg-gray-100 text-gray-400"
              }`}>
                {done ? "✓" : n}
              </div>
              <span className={`text-xs mt-1 font-medium hidden sm:block ${active ? "text-gray-900" : done ? "text-gray-500" : "text-gray-400"}`}>
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-4 ${done ? "bg-gray-900" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---- Main ----
export default function BookingClient({
  societeSlug,
  societeName,
  vehicules,
  options,
}: {
  societeSlug: string;
  societeName: string;
  vehicules: Vehicule[];
  options: Option[];
}) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [prix, setPrix] = useState<PrixTrajet | PrixMad | null>(null);
  const [surDevis, setSurDevis] = useState(false);
  const [lockedOptionNoms, setLockedOptionNoms] = useState<string[]>([]);

  const today = new Date().toISOString().split("T")[0];

  const [data, setData] = useState<BookingData>({
    type_prestation: "trajet",
    adresse_depart: "",
    dept_depart: "",
    adresse_arrivee: "",
    dept_arrivee: "",
    duree_mad: 2,
    type_vehicule: "",
    prix_vehicule: 0,
    date: "",
    heure: "",
    nb_passagers: 1,
    nb_bagages: 0,
    numero_vol_train: "",
    options_selectionnees: [],
    prenom: "",
    nom: "",
    email: "",
    telephone: "",
    notes_client: "",
  });

  const isWithin24h = data.date && data.heure
    ? (new Date(`${data.date}T${data.heure}`).getTime() - Date.now()) < 24 * 60 * 60 * 1000
    : false;
  const isWhatsApp = surDevis || isWithin24h;

  function update(patch: Partial<BookingData>) {
    setData((d) => ({ ...d, ...patch }));
  }

  function getPrixVehicule(nom: string): number {
    if (!prix) return 0;
    if (data.type_prestation === "trajet") return (prix as PrixTrajet)[nom] || 0;
    const tarif = (prix as PrixMad)[nom];
    if (!tarif) return 0;
    const duree = data.duree_mad;
    if (tarif.tarif_journee && duree >= tarif.max_heures) return tarif.tarif_journee;
    return tarif.tarif_horaire * Math.max(duree, tarif.min_heures);
  }

  function getPrixTotal(): number {
    let total = data.prix_vehicule;
    for (const o of data.options_selectionnees) total += o.prix * (o.qte || 1);
    return Math.round(total * 100) / 100;
  }

  async function fetchPrix() {
    setLoading(true);
    setError("");
    try {
      const body: Record<string, unknown> = {
        societe_slug: societeSlug,
        type_prestation: data.type_prestation,
      };
      if (data.type_prestation === "trajet") {
        if (!data.dept_depart || !data.dept_arrivee) {
          setSurDevis(true);
          setPrix({});
          setStep(2);
          setLoading(false);
          return;
        }
        body.dept_depart = data.dept_depart;
        body.dept_arrivee = data.dept_arrivee;
      }
      try {
        const res = await fetch("/api/book/prix", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("api_error");
        const result = await res.json();
        const hasPrix = result.prix && Object.keys(result.prix).length > 0;
        const hasTarifs = result.tarifs && Object.keys(result.tarifs).length > 0;
        if (!hasPrix && !hasTarifs) {
          setSurDevis(true);
          setPrix({});
        } else {
          setSurDevis(false);
          setPrix(result.prix || result.tarifs);
        }
      } catch {
        // API error or no tarif found → sur devis
        setSurDevis(true);
        setPrix({});
      }
      setStep(2);
    } catch {
      setError("Erreur réseau. Vérifiez votre connexion et réessayez.");
    } finally {
      setLoading(false);
    }
  }

  async function submitReservation() {
    setLoading(true);
    setError("");
    try {
      const payload: Record<string, unknown> = {
        societe_slug: societeSlug,
        type_prestation: data.type_prestation,
        type_vehicule: data.type_vehicule,
        adresse_depart: data.adresse_depart,
        dept_depart: data.dept_depart,
        adresse_arrivee: data.type_prestation === "mad" ? data.adresse_depart : data.adresse_arrivee,
        dept_arrivee: data.type_prestation === "mad" ? data.dept_depart : data.dept_arrivee,
        date_prise_en_charge: `${data.date}T${data.heure}:00`,
        nb_passagers: data.nb_passagers,
        nb_bagages: data.nb_bagages,
        numero_vol_train: data.numero_vol_train,
        notes_client: data.notes_client,
        prenom: data.prenom,
        nom: data.nom,
        email: data.email,
        telephone: data.telephone,
        options: data.options_selectionnees,
        sur_devis: surDevis ? 1 : 0,
      };
      if (data.type_prestation === "mad") payload.duree_mad = data.duree_mad;

      const res = await fetch("/api/book/reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      const link = result.payment_link || result.whatsapp_link;
      if (!link) throw new Error("Lien de paiement manquant.");
      window.location.href = link;
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
      setLoading(false);
    }
  }

  function toggleOption(opt: Option, checked: boolean) {
    if (lockedOptionNoms.includes(opt.nom)) return;
    if (checked) {
      update({ options_selectionnees: [...data.options_selectionnees, { nom: opt.nom, prix: opt.prix, qte: 1 }] });
    } else {
      update({ options_selectionnees: data.options_selectionnees.filter((o) => o.nom !== opt.nom) });
    }
  }

  function selectVehicule(fullName: string, prixV: number, withBaggageOverflow: boolean) {
    const baggageOpt = options.find((o) =>
      o.nom.toLowerCase().includes("bagage") && o.nom.toLowerCase().includes("suppl")
    );
    if (withBaggageOverflow && baggageOpt) {
      const nom = baggageOpt.nom;
      setLockedOptionNoms([nom]);
      update({
        type_vehicule: fullName,
        prix_vehicule: prixV,
        options_selectionnees: [
          ...data.options_selectionnees.filter((o) => o.nom !== nom),
          { nom, prix: baggageOpt.prix, qte: 1 },
        ],
      });
    } else if (withBaggageOverflow && !baggageOpt) {
      const nom = "Bagage supplémentaire";
      setLockedOptionNoms([nom]);
      update({
        type_vehicule: fullName,
        prix_vehicule: prixV,
        options_selectionnees: [
          ...data.options_selectionnees.filter((o) => o.nom !== nom),
          { nom, prix: 0, qte: 1 },
        ],
      });
    } else {
      setLockedOptionNoms([]);
      update({ type_vehicule: fullName, prix_vehicule: prixV });
    }
  }

  function setOptionQte(nom: string, qte: number) {
    update({
      options_selectionnees: data.options_selectionnees.map((o) => o.nom === nom ? { ...o, qte } : o),
    });
  }

  const stepLabels = ["Trajet", "Véhicule", "Options", "Coordonnées", "Récap"];

  // ------- Render steps -------

  function renderStep1() {
    const addressOk = data.type_prestation === "mad"
      ? data.adresse_depart.length > 3
      : data.adresse_depart.length > 3 && data.adresse_arrivee.length > 3;
    const isValid = addressOk && !!data.date && !!data.heure && data.nb_passagers >= 1;

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Votre prestation</h2>
          <p className="text-sm text-gray-500">Trajet fixe ou mise à disposition avec chauffeur</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {(["trajet", "mad"] as Prestation[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => update({ type_prestation: t })}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                data.type_prestation === t
                  ? "border-gray-900 bg-gray-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="text-2xl mb-2">{t === "trajet" ? "🗺️" : "🕐"}</div>
              <div className="font-semibold text-sm text-gray-900">
                {t === "trajet" ? "Trajet" : "Mise à disposition"}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {t === "trajet" ? "D'un point A à un point B" : "Chauffeur à votre disposition"}
              </div>
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <AddressInput
            label="Adresse de départ"
            value={data.adresse_depart}
            onChange={(v) => update({ adresse_depart: v, dept_depart: "" })}
            onDeptChange={(dept) => update({ dept_depart: dept })}
            placeholder="Ex: 10 rue de la Paix, Grenoble"
            required
          />

          {data.type_prestation === "trajet" && (
            <>
              <AddressInput
                label="Adresse d'arrivée"
                value={data.adresse_arrivee}
                onChange={(v) => update({ adresse_arrivee: v, dept_arrivee: "" })}
                onDeptChange={(dept) => update({ dept_arrivee: dept })}
                placeholder="Ex: Aéroport Lyon Saint-Exupéry"
                required
              />
            </>
          )}

          {data.type_prestation === "mad" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Durée souhaitée <span className="text-red-500">*</span>
              </label>
              <select
                value={data.duree_mad}
                onChange={(e) => update({ duree_mad: Number(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm bg-white"
              >
                {[2, 3, 4, 5, 6, 7, 8].map((h) => (
                  <option key={h} value={h}>{h} heures</option>
                ))}
                <option value={10}>Journée complète</option>
              </select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Date <span className="text-red-500">*</span></label>
            <input
              type="date"
              value={data.date}
              min={today}
              onChange={(e) => update({ date: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Heure <span className="text-red-500">*</span></label>
            <input
              type="time"
              value={data.heure}
              onChange={(e) => update({ heure: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Passagers <span className="text-red-500">*</span></label>
            <input
              type="number"
              min={1}
              max={8}
              value={data.nb_passagers}
              onChange={(e) => update({ nb_passagers: Number(e.target.value) })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Bagages</label>
            <input
              type="number"
              min={0}
              max={10}
              value={data.nb_bagages}
              onChange={(e) => update({ nb_bagages: Number(e.target.value) })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
            />
            <p className="text-xs text-gray-400 mt-1.5">1 bagage = 1 valise en soute</p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchPrix}
          disabled={!isValid || loading}
          className="w-full py-3.5 bg-gray-900 text-white rounded-xl font-semibold text-sm hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Recherche en cours…" : "Voir les véhicules disponibles →"}
        </button>
      </div>
    );
  }

  function renderStep2() {
    const cityOf = (addr: string) => addr.split(",")[1]?.trim() || addr.split(",")[0]?.trim() || addr;

    // Vehicles available by price (or all if whatsapp/sur devis)
    const vehiculesAvecPrix = vehicules.filter((v) => {
      if (v.disponible === false) return false;
      if (isWhatsApp) return true;
      return getPrixVehicule(`${v.marque} ${v.modele}`) > 0;
    });

    // Filter further by baggage capacity
    const vehiculesFitBagages = vehiculesAvecPrix.filter(
      (v) => v.nb_bagages_max == null || v.nb_bagages_max >= data.nb_bagages
    );

    // If no vehicle fits the baggage, show all by passenger count (overflow mode)
    const baggageOverflow = data.nb_bagages > 0 && vehiculesFitBagages.length === 0 && vehiculesAvecPrix.length > 0;
    const vehiculesToShow = baggageOverflow ? vehiculesAvecPrix : vehiculesFitBagages;

    const typeLabel: Record<string, string> = { Berline: "Berline", Van: "Van", Luxe: "Prestige" };

    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Choisissez votre véhicule</h2>
          <p className="text-sm text-gray-500">
            {data.type_prestation === "mad"
              ? `Mise à disposition · ${data.duree_mad}h`
              : `${cityOf(data.adresse_depart)} → ${cityOf(data.adresse_arrivee)}`}
          </p>
        </div>

        {isWhatsApp && (
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 px-4 py-3 rounded-xl text-sm text-blue-800">
            <span className="text-base mt-0.5">ℹ️</span>
            <span>
              {surDevis
                ? <>Aucun tarif fixe pour ce trajet. Votre demande sera transmise au chauffeur <strong>sur devis</strong> via WhatsApp.</>
                : <>Réservation dans moins de 24h — votre demande sera envoyée directement au chauffeur <strong>via WhatsApp</strong>.</>}
            </span>
          </div>
        )}

        {baggageOverflow && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 px-4 py-3 rounded-xl text-sm text-amber-800">
            <span className="text-base mt-0.5">⚠️</span>
            <span>Aucun véhicule ne peut accueillir {data.nb_bagages} bagages. Les véhicules ci-dessous sont affichés selon votre nombre de passagers — l&apos;option <strong>Bagage supplémentaire</strong> sera automatiquement ajoutée.</span>
          </div>
        )}

        {vehiculesToShow.length === 0 && (
          <p className="text-sm text-gray-500 bg-gray-50 px-4 py-3 rounded-xl">Aucun véhicule disponible pour cette prestation.</p>
        )}

        <div className="space-y-3">
          {vehiculesToShow.map((v) => {
            const fullName = `${v.marque} ${v.modele}`;
            const prixV = getPrixVehicule(fullName);
            const selected = data.type_vehicule === fullName;
            return (
              <button
                key={v.Id}
                type="button"
                onClick={() => selectVehicule(fullName, prixV, baggageOverflow)}
                className={`w-full rounded-2xl border-2 text-left transition-all overflow-hidden ${
                  selected ? "border-gray-900 shadow-sm" : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <div className="flex gap-0">
                  {/* Image */}
                  <div className="w-28 h-24 bg-gray-100 flex-shrink-0 relative">
                    {v.image_url ? (
                      <img src={v.image_url} alt={fullName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">🚗</div>
                    )}
                    {v.type_vehicule && (
                      <span className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-md">
                        {typeLabel[v.type_vehicule] || v.type_vehicule}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className={`flex-1 p-3 flex flex-col justify-between ${selected ? "bg-gray-50" : ""}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">{v.marque} <span className="font-bold">{v.modele}</span></div>
                        <div className="flex items-center gap-3 mt-1.5">
                          {v.nb_passagers_max && (
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <span>👤</span>{v.nb_passagers_max} pass.
                            </span>
                          )}
                          {v.nb_bagages_max != null && (
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <span>🧳</span>{v.nb_bagages_max} bag.
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {isWhatsApp ? (
                          <span className="text-sm font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-lg">
                            {surDevis ? "Sur devis" : "Sur demande"}
                          </span>
                        ) : (
                          <>
                            <div className="text-lg font-bold text-gray-900">{prixV} €</div>
                            {data.type_prestation === "mad" && (
                              <div className="text-xs text-gray-400">pour {data.duree_mad}h</div>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {selected && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-gray-900">
                        <span className="w-4 h-4 bg-gray-900 rounded-full flex items-center justify-center text-white text-[10px]">✓</span>
                        Sélectionné
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {data.type_vehicule && !baggageOverflow && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-4 py-3 rounded-xl">
            Si vous arrivez le jour J avec plus de bagages que prévu, une surfacturation pourra être appliquée.
          </p>
        )}

        <div className="flex gap-3">
          <button type="button" onClick={() => setStep(1)} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
            ← Retour
          </button>
          <button
            type="button"
            onClick={() => setStep(3)}
            disabled={!data.type_vehicule}
            className="flex-1 py-3 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continuer →
          </button>
        </div>
      </div>
    );
  }

  function renderStep3() {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Options</h2>
          <p className="text-sm text-gray-500">Personnalisez votre trajet</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            N° vol / train <span className="text-xs font-normal text-gray-400">(optionnel)</span>
          </label>
          <input
            type="text"
            value={data.numero_vol_train}
            onChange={(e) => update({ numero_vol_train: e.target.value })}
            placeholder="Ex: AF1234, TGV6789"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
          />
        </div>

        {options.length > 0 ? (
          <div className="space-y-3">
            {options.map((opt) => {
              const selected = data.options_selectionnees.find((o) => o.nom === opt.nom);
              const locked = lockedOptionNoms.includes(opt.nom);
              return (
                <div
                  key={opt.Id}
                  onClick={() => !locked && toggleOption(opt, !selected)}
                  className={`rounded-2xl border-2 transition-all ${
                    locked
                      ? "border-amber-400 bg-amber-50 cursor-not-allowed"
                      : selected
                      ? "border-gray-900 bg-gray-50 cursor-pointer"
                      : "border-gray-200 bg-white hover:border-gray-300 cursor-pointer"
                  }`}
                >
                  <div className="p-4 flex items-start gap-4">
                    {/* Checkbox visuel */}
                    <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                      locked
                        ? "border-amber-500 bg-amber-400"
                        : selected
                        ? "border-gray-900 bg-gray-900"
                        : "border-gray-300 bg-white"
                    }`}>
                      {(selected || locked) && <span className="text-white text-[11px] font-bold">✓</span>}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-sm font-semibold text-gray-900">{opt.nom}</span>
                          {locked && (
                            <span className="ml-2 text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">Requis</span>
                          )}
                          {opt.description && <p className="text-xs text-gray-500 mt-0.5">{opt.description}</p>}
                        </div>
                        <span className="text-sm font-bold text-gray-900 flex-shrink-0">
                          +{opt.prix} €{opt.type_prix === "par_unite" ? "/unité" : ""}
                        </span>
                      </div>

                      {selected && !locked && opt.type_prix === "par_unite" && opt.quantite_max && opt.quantite_max > 1 && (
                        <div className="flex items-center gap-2 mt-3">
                          <span className="text-xs text-gray-500">Quantité :</span>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: opt.quantite_max }, (_, i) => i + 1).map((n) => (
                              <button
                                key={n}
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setOptionQte(opt.nom, n); }}
                                className={`w-7 h-7 rounded-lg text-xs font-semibold border transition-colors ${
                                  selected.qte === n ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 text-gray-600 hover:border-gray-400"
                                }`}
                              >
                                {n}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-400 bg-gray-50 px-4 py-3 rounded-xl">Aucune option disponible pour cette prestation.</p>
        )}

        <div className="flex gap-3">
          <button type="button" onClick={() => setStep(2)} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
            ← Retour
          </button>
          <button
            type="button"
            onClick={() => setStep(4)}
            className="flex-1 py-3 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800"
          >
            Continuer →
          </button>
        </div>
      </div>
    );
  }

  function renderStep4() {
    const isValid = data.prenom && data.nom && data.email && data.telephone;
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Vos coordonnées</h2>
          <p className="text-sm text-gray-500">Pour la confirmation de votre réservation</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Prénom <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={data.prenom}
              onChange={(e) => update({ prenom: e.target.value })}
              placeholder="Jean"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={data.nom}
              onChange={(e) => update({ nom: e.target.value })}
              placeholder="Dupont"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email <span className="text-red-500">*</span></label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => update({ email: e.target.value })}
            placeholder="jean.dupont@email.com"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Téléphone <span className="text-red-500">*</span></label>
          <input
            type="tel"
            value={data.telephone}
            onChange={(e) => update({ telephone: e.target.value })}
            placeholder="06 00 00 00 00"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Notes <span className="text-xs font-normal text-gray-400">(optionnel)</span>
          </label>
          <textarea
            value={data.notes_client}
            onChange={(e) => update({ notes_client: e.target.value })}
            placeholder="Informations complémentaires pour le chauffeur…"
            rows={3}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm resize-none"
          />
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => setStep(3)} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
            ← Retour
          </button>
          <button
            type="button"
            onClick={() => setStep(5)}
            disabled={!isValid}
            className="flex-1 py-3 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Voir le récap →
          </button>
        </div>
      </div>
    );
  }

  function renderStep5() {
    const prixTotal = getPrixTotal();
    const dateStr = data.date && data.heure
      ? new Date(`${data.date}T${data.heure}`).toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })
      : "—";

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Récapitulatif</h2>
          <p className="text-sm text-gray-500">Vérifiez votre réservation avant de confirmer</p>
        </div>

        {isWhatsApp && (
          <div className="flex items-start gap-3 bg-green-50 border border-green-200 px-4 py-3 rounded-xl text-sm text-green-800">
            <span className="text-base mt-0.5">💬</span>
            <span>
              {surDevis
                ? "Cette demande sera transmise à votre chauffeur sur devis via WhatsApp."
                : "Réservation dans moins de 24h — votre demande sera envoyée directement au chauffeur via WhatsApp."}
            </span>
          </div>
        )}

        <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm">
          <RecapRow label="Prestation" value={data.type_prestation === "mad" ? "Mise à disposition" : "Trajet"} />
          <RecapRow label="Véhicule" value={data.type_vehicule} />
          <RecapRow label="Départ" value={data.adresse_depart} />
          {data.type_prestation === "trajet" && <RecapRow label="Arrivée" value={data.adresse_arrivee} />}
          {data.type_prestation === "mad" && <RecapRow label="Durée" value={`${data.duree_mad} heures`} />}
          <RecapRow label="Date" value={dateStr} />
          <RecapRow label="Passagers" value={String(data.nb_passagers)} />
          {data.nb_bagages > 0 && <RecapRow label="Bagages" value={String(data.nb_bagages)} />}
          {data.numero_vol_train && <RecapRow label="Vol / Train" value={data.numero_vol_train} />}
          <div className="border-t border-gray-200 pt-3">
            {!isWhatsApp && <RecapRow label="Tarif véhicule" value={`${data.prix_vehicule} €`} />}
            {!isWhatsApp && data.options_selectionnees.map((o) => (
              <RecapRow key={o.nom} label={`${o.nom}${o.qte > 1 ? ` ×${o.qte}` : ""}`} value={`+${o.prix * o.qte} €`} />
            ))}
            {!isWhatsApp && (
              <div className="flex justify-between font-bold text-base mt-2 pt-2 border-t border-gray-300">
                <span>Total estimé</span>
                <span>{prixTotal} €</span>
              </div>
            )}
            {isWhatsApp && (
              <div className="flex justify-between font-semibold text-sm mt-1 text-blue-700">
                <span>Tarif</span>
                <span>{surDevis ? "Sur devis" : "À confirmer avec le chauffeur"}</span>
              </div>
            )}
          </div>
          <div className="border-t border-gray-200 pt-3">
            <RecapRow label="Nom" value={`${data.prenom} ${data.nom}`} />
            <RecapRow label="Email" value={data.email} />
            <RecapRow label="Téléphone" value={data.telephone} />
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => setStep(4)} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
            ← Modifier
          </button>
          <button
            type="button"
            onClick={submitReservation}
            disabled={loading}
            className={`flex-1 py-3.5 rounded-xl text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed ${
              isWhatsApp ? "bg-green-600 hover:bg-green-700 text-white" : "bg-gray-900 hover:bg-gray-800 text-white"
            }`}
          >
            {loading
              ? "Envoi en cours…"
              : isWhatsApp
              ? "Envoyer ma demande via WhatsApp →"
              : `Payer ${prixTotal} € →`}
          </button>
        </div>
        <p className="text-xs text-center text-gray-400">
          {isWhatsApp
            ? "Vous serez redirigé vers WhatsApp · Le chauffeur vous contactera"
            : "Paiement sécurisé via Stripe · Vous serez redirigé vers la page de paiement"}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center text-white text-sm font-bold">
            VTC
          </div>
          <div>
            <p className="font-semibold text-gray-900 leading-tight">{societeName}</p>
            <p className="text-xs text-gray-500">Réservation en ligne</p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <StepIndicator current={step} labels={stepLabels} />

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}

          {error && (
            <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RecapRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-0.5">
      <span className="text-gray-500 flex-shrink-0">{label}</span>
      <span className="text-gray-900 text-right">{value}</span>
    </div>
  );
}
