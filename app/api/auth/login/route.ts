import { NextRequest, NextResponse } from "next/server";
import { signIn } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { slug, password } = await req.json();
  const ok = await signIn(slug, password);
  if (!ok) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  return NextResponse.json({ ok: true });
}
