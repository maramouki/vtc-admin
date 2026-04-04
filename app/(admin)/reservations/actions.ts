"use server";

import { updateReservation, getReservation } from "@/lib/nocodb";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const STATUTS_WITH_EMAIL = ["confirmee", "annulee", "terminee"];

const EMAIL_SUBJECTS: Record<string, string> = {
  confirmee: "✅ Réservation confirmée",
  annulee: "❌ Réservation annulée",
  terminee: "🏁 Votre trajet est terminé — merci !",
  en_cours: "🚗 Votre chauffeur est en route",
};

const EMAIL_BODIES: Record<string, (r: Record<string, unknown>) => string> = {
  confirmee: (r) =>
    `<p>Bonjour ${r.prenom_client},</p><p>Votre réservation <strong>${r.reference}</strong> est confirmée.</p><p><strong>Départ :</strong> ${r.adresse_depart}<br><strong>Arrivée :</strong> ${r.adresse_arrivee}<br><strong>Date :</strong> ${r.date_prise_en_charge}</p><p>Montant : <strong>${r.prix_total} €</strong></p>`,
  annulee: (r) =>
    `<p>Bonjour ${r.prenom_client},</p><p>Votre réservation <strong>${r.reference}</strong> a été annulée.</p><p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>`,
  terminee: (r) =>
    `<p>Bonjour ${r.prenom_client},</p><p>Merci d'avoir utilisé nos services pour votre trajet du ${r.date_prise_en_charge}.</p><p>Nous espérons vous revoir bientôt !</p>`,
  en_cours: (r) =>
    `<p>Bonjour ${r.prenom_client},</p><p>Votre chauffeur est en route pour votre prise en charge <strong>${r.reference}</strong>.</p>`,
};

async function sendEmail(to: string, subject: string, html: string) {
  const BREVO_KEY = process.env.BREVO_API_KEY;
  if (!BREVO_KEY) return;

  await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": BREVO_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: "VTC", email: process.env.BREVO_SENDER_EMAIL || "noreply@maramouki.fr" },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });
}

export async function updateStatutAction(reservationId: number, newStatut: string) {
  const session = await getSession();
  if (!session) throw new Error("Non autorisé");

  await updateReservation(reservationId, { statut: newStatut });

  // Envoyer un mail si statut concerné
  if (STATUTS_WITH_EMAIL.includes(newStatut)) {
    const resa = await getReservation(reservationId);
    const subject = EMAIL_SUBJECTS[newStatut];
    const bodyFn = EMAIL_BODIES[newStatut];
    if (subject && bodyFn && resa.email_client) {
      await sendEmail(resa.email_client, subject, bodyFn(resa));
    }
  }

  revalidatePath("/reservations");
}

export async function resendEmailAction(reservationId: number) {
  const session = await getSession();
  if (!session) throw new Error("Non autorisé");

  const resa = await getReservation(reservationId);
  if (!resa.email_client) throw new Error("Email client introuvable");

  const statut = resa.statut as string;
  const subject = EMAIL_SUBJECTS[statut] || `Votre réservation ${resa.reference}`;
  const bodyFn = EMAIL_BODIES[statut];
  const html = bodyFn
    ? bodyFn(resa)
    : `<p>Bonjour ${resa.prenom_client},</p><p>Voici le récapitulatif de votre réservation <strong>${resa.reference}</strong>.</p>`;

  await sendEmail(resa.email_client, subject, html);
}
