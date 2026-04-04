const NOCODB_URL = process.env.NOCODB_URL!;
const NOCODB_TOKEN = process.env.NOCODB_TOKEN!;

const TABLES = {
  reservations: "m93meqzxuqzxw3v",
  clients: "mfc0g4xc07xv00c",
  matrice: "muh0s4ub44duztm",
  societes: process.env.NOCODB_TABLE_SOCIETES || "",
  tarifs_mad: process.env.NOCODB_TABLE_TARIFS_MAD || "",
  vehicules: "mzsrv95epu8gpss",
};

async function nocoFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${NOCODB_URL}/api/v2${path}`, {
    ...options,
    headers: {
      "xc-token": NOCODB_TOKEN,
      "Content-Type": "application/json",
      ...options?.headers,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NocoDB error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function getReservations(societeSlug: string, page = 1, pageSize = 20, where = "") {
  const slugFilter = `(societe_slug,eq,${societeSlug})`;
  const filter = where ? `${slugFilter}~and${where}` : slugFilter;
  const params = new URLSearchParams({
    where: filter,
    limit: String(pageSize),
    offset: String((page - 1) * pageSize),
    sort: "-date_prise_en_charge",
  });
  return nocoFetch(`/tables/${TABLES.reservations}/records?${params}`);
}

export async function getReservation(id: number) {
  return nocoFetch(`/tables/${TABLES.reservations}/records/${id}`);
}

export async function updateReservation(id: number, data: Record<string, unknown>) {
  return nocoFetch(`/tables/${TABLES.reservations}/records`, {
    method: "PATCH",
    body: JSON.stringify({ Id: id, ...data }),
  });
}

export async function getMatricePrix(societeSlug: string) {
  const params = new URLSearchParams({
    where: `(societe_slug,eq,${societeSlug})`,
    limit: "200",
  });
  return nocoFetch(`/tables/${TABLES.matrice}/records?${params}`);
}

export async function updateMatriceRow(id: number, data: Record<string, unknown>) {
  return nocoFetch(`/tables/${TABLES.matrice}/records`, {
    method: "PATCH",
    body: JSON.stringify({ Id: id, ...data }),
  });
}

export async function createMatriceRow(data: Record<string, unknown>) {
  return nocoFetch(`/tables/${TABLES.matrice}/records`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteMatriceRow(id: number) {
  return nocoFetch(`/tables/${TABLES.matrice}/records`, {
    method: "DELETE",
    body: JSON.stringify({ Id: id }),
  });
}

export async function getTarifsMad(societeSlug: string) {
  if (!TABLES.tarifs_mad) return { list: [] };
  const params = new URLSearchParams({
    where: `(societe_slug,eq,${societeSlug})`,
    limit: "20",
  });
  return nocoFetch(`/tables/${TABLES.tarifs_mad}/records?${params}`);
}

export async function updateTarifMad(id: number, data: Record<string, unknown>) {
  return nocoFetch(`/tables/${TABLES.tarifs_mad}/records`, {
    method: "PATCH",
    body: JSON.stringify({ Id: id, ...data }),
  });
}

export async function createTarifMad(data: Record<string, unknown>) {
  return nocoFetch(`/tables/${TABLES.tarifs_mad}/records`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export type Vehicule = {
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
  societe_slug: string;
  type_vehicule?: string;
};

export async function getVehicules(societeSlug: string): Promise<Vehicule[]> {
  const params = new URLSearchParams({
    where: `(societe_slug,eq,${societeSlug})`,
    limit: "50",
    sort: "marque",
  });
  const data = await nocoFetch(`/tables/${TABLES.vehicules}/records?${params}`);
  return data.list || [];
}

export async function createVehicule(data: Partial<Vehicule>) {
  return nocoFetch(`/tables/${TABLES.vehicules}/records`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateVehicule(id: number, data: Partial<Vehicule>) {
  return nocoFetch(`/tables/${TABLES.vehicules}/records`, {
    method: "PATCH",
    body: JSON.stringify({ Id: id, ...data }),
  });
}

export async function deleteVehicule(id: number) {
  return nocoFetch(`/tables/${TABLES.vehicules}/records`, {
    method: "DELETE",
    body: JSON.stringify({ Id: id }),
  });
}

const OPTIONS_TABLE = "mi4pge54gvpolfp";

export type Option = {
  Id: number;
  nom: string;
  description?: string;
  prix: number;
  type_prix: "fixe" | "par_unite";
  quantite_max?: number;
  actif: boolean;
  ordre_affichage?: number;
  societe_slug: string;
};

export async function getOptions(societeSlug: string): Promise<Option[]> {
  const params = new URLSearchParams({
    where: `(societe_slug,eq,${societeSlug})`,
    limit: "100",
    sort: "ordre_affichage",
  });
  const data = await nocoFetch(`/tables/${OPTIONS_TABLE}/records?${params}`);
  return data.list || [];
}

export async function createOption(data: Partial<Option>) {
  return nocoFetch(`/tables/${OPTIONS_TABLE}/records`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateOption(id: number, data: Partial<Option>) {
  return nocoFetch(`/tables/${OPTIONS_TABLE}/records`, {
    method: "PATCH",
    body: JSON.stringify({ Id: id, ...data }),
  });
}

export async function deleteOption(id: number) {
  return nocoFetch(`/tables/${OPTIONS_TABLE}/records`, {
    method: "DELETE",
    body: JSON.stringify({ Id: id }),
  });
}

export async function getSociete(societeSlug: string) {
  if (!TABLES.societes) return null;
  const params = new URLSearchParams({ where: `(slug,eq,${societeSlug})`, limit: "1" });
  const data = await nocoFetch(`/tables/${TABLES.societes}/records?${params}`);
  return data.list?.[0] || null;
}

export async function updateSociete(id: number, data: Record<string, unknown>) {
  return nocoFetch(`/tables/${TABLES.societes}/records`, {
    method: "PATCH",
    body: JSON.stringify({ Id: id, ...data }),
  });
}

export async function getStatsReservations(societeSlug: string) {
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];

  // Une seule requête pour avoir toutes les réservations du mois
  const all = await nocoFetch(
    `/tables/${TABLES.reservations}/records?where=(societe_slug,eq,${societeSlug})&limit=200&fields=statut,prix_total,date_prise_en_charge`
  );

  const rows: Record<string, unknown>[] = all.list || [];
  const total = all.pageInfo?.totalRows || rows.length;

  const thisMonthRows = rows.filter((r) => {
    const d = r.date_prise_en_charge as string;
    return d && d >= firstOfMonth;
  });

  const caMois = thisMonthRows
    .filter((r) => r.statut === "confirmee" || r.statut === "terminee")
    .reduce((sum, r) => sum + (Number(r.prix_total) || 0), 0);

  const pending = rows.filter((r) => r.statut === "nouvelle").length;

  return {
    total,
    thisMonth: thisMonthRows.length,
    caMois,
    pending,
  };
}
