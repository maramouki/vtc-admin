import { NextRequest, NextResponse } from "next/server";
import { requestPasswordReset } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email requis" }, { status: 400 });

  // On retourne toujours OK pour ne pas révéler si l'email existe
  await requestPasswordReset(email);
  return NextResponse.json({ ok: true });
}
