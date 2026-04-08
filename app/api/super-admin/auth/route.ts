import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "vtc-admin-secret-change-in-prod"
);

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const expected = process.env.SUPER_ADMIN_PASSWORD;

  if (!expected || password !== expected) {
    return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });
  }

  const token = await new SignJWT({ role: "superadmin" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("8h")
    .sign(JWT_SECRET);

  const cookieStore = await cookies();
  cookieStore.set("vtc_super", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8,
    path: "/",
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("vtc_super");
  return NextResponse.json({ ok: true });
}
