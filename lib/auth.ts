import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "vtc-admin-secret-change-in-prod"
);

export type Session = {
  societeSlug: string;
  societeName: string;
};

// Tenants hardcodés — à terme remplacer par NocoDB
const TENANTS: Record<string, { password: string; name: string; slug: string }> = {
  "grenoble-vtc-premium": {
    password: process.env.TENANT_PASSWORD_GRENOBLE || "demo1234",
    name: "Grenoble VTC Premium",
    slug: "grenoble-vtc-premium",
  },
};

export async function signIn(slug: string, password: string): Promise<boolean> {
  const tenant = TENANTS[slug];
  if (!tenant || tenant.password !== password) return false;

  const token = await new SignJWT({ societeSlug: slug, societeName: tenant.name })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(JWT_SECRET);

  const cookieStore = await cookies();
  cookieStore.set("vtc_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return true;
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("vtc_session")?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      societeSlug: payload.societeSlug as string,
      societeName: payload.societeName as string,
    };
  } catch {
    return null;
  }
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete("vtc_session");
}
