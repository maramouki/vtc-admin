import { NextRequest, NextResponse } from "next/server";
import { signIn } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  const ok = await signIn(email, password);
  if (!ok) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  return NextResponse.json({ ok: true });
}
