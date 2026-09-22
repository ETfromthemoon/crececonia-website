import "server-only";

import { Resend } from "resend";
import { queryDatabase } from "./database";

export const PUBLIC_LEAD_LIMITS = {
  email: 254,
  short: 160,
  long: 2_000,
  resource: 180,
} as const;

export const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function saveSubscriber(email: string, source: string, resource: string) {
  await queryDatabase(
    `insert into commerce.public_subscribers (email, source, resource)
     values ($1, nullif($2, ''), $3)
     on conflict (email, resource) do update
       set source = coalesce(excluded.source, commerce.public_subscribers.source), updated_at = now()`,
    [email, source, resource],
  );
}

type Evaluation = {
  nombre: string;
  email: string;
  empresa: string;
  empresa_descripcion: string;
  tamano_equipo: string;
  rol: string;
  proceso_pain: string;
  uso_ia_actual: string;
  resultado_esperado: string;
  horizonte_decision: string;
  source: string;
};

export async function saveEvaluation(value: Evaluation) {
  const [row] = await queryDatabase<{ id: string; scheduling_token: string }>(
    `insert into commerce.evaluations
      (nombre, email, empresa, empresa_descripcion, tamano_equipo, rol, proceso_pain,
       uso_ia_actual, resultado_esperado, horizonte_decision, source)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,nullif($11,''))
     returning id, scheduling_token`,
    [value.nombre, value.email, value.empresa, value.empresa_descripcion, value.tamano_equipo,
      value.rol, value.proceso_pain, value.uso_ia_actual, value.resultado_esperado,
      value.horizonte_decision, value.source],
  );
  return row;
}

export async function saveCallRequest(token: string, preferredTimes: string[], message: string) {
  const [row] = await queryDatabase<{ id: string; email: string; nombre: string }>(
    `with target as (
       select id, email, nombre from commerce.evaluations where scheduling_token = $1::uuid
     ), inserted as (
       insert into commerce.call_requests (evaluation_id, preferred_times, message)
       select id, $2::jsonb, nullif($3, '') from target
       returning id, evaluation_id
     )
     select inserted.id, target.email, target.nombre
     from inserted join target on target.id = inserted.evaluation_id`,
    [token, JSON.stringify(preferredTimes), message],
  );
  return row ?? null;
}

export async function notifyAdmin(subject: string, text: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.LEADS_NOTIFICATION_EMAIL ?? "sergio@crececonia.cl";
  if (!apiKey) return;
  const { error } = await new Resend(apiKey).emails.send({
    from: "CrececonIA <sergio@crececonia.cl>",
    to,
    subject,
    text,
  });
  if (error) console.error("[public-leads] Resend rechazó la notificación:", error.message);
}
