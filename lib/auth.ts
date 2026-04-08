import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "vtc-admin-secret-change-in-prod"
);

const NOCODB_URL = process.env.NOCODB_URL!;
const NOCODB_TOKEN = process.env.NOCODB_TOKEN!;
const TABLE_SOCIETES = process.env.NOCODB_TABLE_SOCIETES!;

export type Session = {
  societeSlug: string;
  societeName: string;
  societeId: number;
};

type SocieteRow = {
  Id: number;
  nom: string;
  slug: string;
  email_contact: string;
  password_hash: string | null;
  reset_token: string | null;
  reset_token_expires: string | null;
  actif: boolean;
};

async function getSocieteByEmail(email: string): Promise<SocieteRow | null> {
  const params = new URLSearchParams({
    where: `(email_contact,eq,${email})`,
    limit: "1",
  });
  const res = await fetch(
    `${NOCODB_URL}/api/v2/tables/${TABLE_SOCIETES}/records?${params}`,
    {
      headers: { "xc-token": NOCODB_TOKEN },
      cache: "no-store",
    }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.list?.[0] || null;
}

async function updateSocieteById(id: number, data: Record<string, unknown>) {
  await fetch(`${NOCODB_URL}/api/v2/tables/${TABLE_SOCIETES}/records`, {
    method: "PATCH",
    headers: { "xc-token": NOCODB_TOKEN, "Content-Type": "application/json" },
    body: JSON.stringify({ Id: id, ...data }),
    cache: "no-store",
  });
}

export async function signIn(email: string, password: string): Promise<boolean> {
  const societe = await getSocieteByEmail(email);
  if (!societe || !societe.actif || !societe.password_hash) return false;

  const valid = await bcrypt.compare(password, societe.password_hash);
  if (!valid) return false;

  const token = await new SignJWT({
    societeSlug: societe.slug,
    societeName: societe.nom,
    societeId: societe.Id,
  })
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
      societeId: payload.societeId as number,
    };
  } catch {
    return null;
  }
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete("vtc_session");
}

// ── Password Reset ─────────────────────────────────────────────

export async function requestPasswordReset(email: string): Promise<boolean> {
  const societe = await getSocieteByEmail(email);
  if (!societe || !societe.actif) return false;

  const token = crypto.randomUUID();
  const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1h

  await updateSocieteById(societe.Id, {
    reset_token: token,
    reset_token_expires: expires,
  });

  await sendResetEmail(email, societe.nom, token);
  return true;
}

export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  // Find societe with this token
  const params = new URLSearchParams({
    where: `(reset_token,eq,${token})`,
    limit: "1",
  });
  const res = await fetch(
    `${NOCODB_URL}/api/v2/tables/${TABLE_SOCIETES}/records?${params}`,
    { headers: { "xc-token": NOCODB_TOKEN }, cache: "no-store" }
  );
  if (!res.ok) return false;
  const data = await res.json();
  const societe: SocieteRow | undefined = data.list?.[0];

  if (!societe || !societe.reset_token_expires) return false;

  // Check expiry
  if (new Date(societe.reset_token_expires) < new Date()) return false;

  const hash = await bcrypt.hash(newPassword, 12);
  await updateSocieteById(societe.Id, {
    password_hash: hash,
    reset_token: null,
    reset_token_expires: null,
  });

  return true;
}

async function sendResetEmail(email: string, nom: string, token: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://vtc-admin-beta.vercel.app"}/login/reset/${token}`;

  await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: "VTC Admin", email: process.env.BREVO_SENDER_EMAIL },
      to: [{ email, name: nom }],
      subject: "Réinitialisation de votre mot de passe",
      htmlContent: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
          <h2 style="font-size:20px;font-weight:700;color:#111">Réinitialisation du mot de passe</h2>
          <p style="color:#555;font-size:14px">Bonjour ${nom},</p>
          <p style="color:#555;font-size:14px">Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe. Ce lien est valable <strong>1 heure</strong>.</p>
          <a href="${resetUrl}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#111;color:#fff;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">
            Réinitialiser mon mot de passe
          </a>
          <p style="color:#999;font-size:12px">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
        </div>
      `,
    }),
  });
}

// ── Utilitaire : créer un hash (usage interne/script) ──────────
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}
