import { NextRequest, NextResponse } from "next/server";
import { resetPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { token, password } = await req.json();
  if (!token || !password) return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "Mot de passe trop court (8 caractères min)" }, { status: 400 });

  const ok = await resetPassword(token, password);
  if (!ok) return NextResponse.json({ error: "Lien invalide ou expiré" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
