import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

const NOCODB_URL = process.env.NOCODB_URL!;
const NOCODB_TOKEN = process.env.NOCODB_TOKEN!;
const TABLE = process.env.NOCODB_TABLE_SOCIETES!;

async function nocoFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${NOCODB_URL}/api/v2${path}`, {
    ...options,
    headers: { "xc-token": NOCODB_TOKEN, "Content-Type": "application/json", ...options?.headers },
    cache: "no-store",
  });
  return res.json();
}

export async function GET() {
  const data = await nocoFetch(`/tables/${TABLE}/records?limit=100&sort=nom`);
  return NextResponse.json(data.list || []);
}

export async function POST(req: NextRequest) {
  const { nom, slug, email, password } = await req.json();

  if (!nom || !slug || !email || !password) {
    return NextResponse.json({ error: "Tous les champs sont requis" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Mot de passe trop court (8 caractères min)" }, { status: 400 });
  }

  // Vérifier que le slug n'existe pas déjà
  const existing = await nocoFetch(`/tables/${TABLE}/records?where=(slug,eq,${slug})&limit=1`);
  if (existing.list?.length > 0) {
    return NextResponse.json({ error: "Ce slug est déjà utilisé" }, { status: 409 });
  }

  const password_hash = await bcrypt.hash(password, 12);

  const result = await nocoFetch(`/tables/${TABLE}/records`, {
    method: "POST",
    body: JSON.stringify({ nom, slug, email_contact: email, password_hash, actif: true, plan: "trial" }),
  });

  return NextResponse.json(result, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { id, actif } = await req.json();
  const result = await nocoFetch(`/tables/${TABLE}/records`, {
    method: "PATCH",
    body: JSON.stringify({ Id: id, actif }),
  });
  return NextResponse.json(result);
}
