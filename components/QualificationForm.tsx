"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { whatsappUrl } from "@/lib/contact";
import { trackEvent } from "@/lib/analytics";
import { SERVICE_BUDGETS, SERVICE_OFFERS, AVAILABILITY, DECISIONS, qualifiesForService } from "@/lib/service-offers";

type Service = "mentoria" | "implementacion";
type Result = "qualified" | "not-ready" | null;

const SERVICE_LABELS: Record<Service, string> = {
  mentoria: "Postulación a mentoría",
  implementacion: "Evaluación de implementación",
};

const CONTENT: Record<Service, {
  title: string;
  intro: string;
  resultLabel: string;
  resultPlaceholder: string;
  resultHint: string;
  budgetOptions: readonly string[];
  notReadyTitle: string;
  notReadyText: string;
  alternative: { href: string; label: string };
}> = {
  mentoria: {
    title: "Postula solo si cumples los requisitos anteriores.",
    intro: "Estas respuestas confirman si la mentoría es el siguiente paso correcto. No es una reserva automática ni una sesión de consultoría gratuita.",
    resultLabel: "¿Qué resultado concreto quieres conseguir en los próximos 90 días?",
    resultPlaceholder: "Ej.: diseñar y aplicar un flujo de IA para responder mejor a mis clientes.",
    resultHint: "Describe un resultado, no solo una herramienta que quieres conocer.",
    budgetOptions: SERVICE_BUDGETS.mentoria,
    notReadyTitle: "La mentoría no es el siguiente paso todavía.",
    notReadyText: `Para que el acompañamiento funcione necesitas un objetivo, tiempo semanal para ejecutar y una inversión ${SERVICE_OFFERS.mentoria.investment.replace(/^Desde/, "desde")}. Puedes avanzar por tu cuenta y volver cuando esas condiciones estén claras.`,
    alternative: { href: "/ebooks", label: "Explorar ebooks para avanzar por mi cuenta" },
  },
  implementacion: {
    title: "Evalúa tu caso antes de solicitar una conversación.",
    intro: "Revisamos proyectos que tengan un proceso definido, un responsable y presupuesto alineado. Esta evaluación no incluye diseño, arquitectura ni consultoría gratuita.",
    resultLabel: "¿Qué proceso específico quieres mejorar? Describe cómo funciona hoy.",
    resultPlaceholder: "Ej.: recibimos consultas por WhatsApp, una persona revisa disponibilidad y responde manualmente cada caso.",
    resultHint: "Incluye qué ocurre hoy y dónde se pierde tiempo, calidad, ventas o visibilidad.",
    budgetOptions: SERVICE_BUDGETS.implementacion,
    notReadyTitle: "Todavía no conviene abrir una conversación de implementación.",
    notReadyText: `Una implementación necesita un proceso concreto, alguien que pueda decidir y validar, y una inversión ${SERVICE_OFFERS.implementacion.investment.replace(/^Desde/, "desde")}. Primero define el caso o revisa si necesitas aprender o recibir acompañamiento.`,
    alternative: { href: "/ia", label: "Revisar las otras opciones" },
  },
};

export default function QualificationForm({ service }: { service: Service }) {
  const content = CONTENT[service];
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    role: "",
    availability: "",
    budget: "",
    result: "",
    context: "",
    decision: "",
    confirmed: false,
  });
  const [state, setState] = useState<Result>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [handoffUrl, setHandoffUrl] = useState("");
  const pending = useRef<{ fingerprint: string; requestId: string } | null>(null);
  const inFlight = useRef(false);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (state) resultHeading.current?.focus(); }, [state]);

  const canContinue = qualifiesForService({ service, ...form });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    setError("");

    if (!canContinue) {
      setState("not-ready");
      trackEvent("qualification_not_ready", { service });
      return;
    }

    const message = [
      `Hola, vengo de CrececonIA. ${SERVICE_LABELS[service]}.`,
      `Nombre: ${form.name}`,
      `Correo: ${form.email}`,
      `Empresa / contexto: ${form.company}`,
      `Rol: ${form.role}`,
      `Resultado o proceso: ${form.result}`,
      service === "mentoria" ? `Tiempo semanal: ${form.availability}` : `Herramientas y contexto: ${form.context}`,
      service === "implementacion" ? `Quién decide: ${form.decision}` : "",
      `Inversión confirmada: ${form.budget}`,
    ].filter(Boolean).join("\n");

    inFlight.current = true;
    setSaving(true);
    try {
      const fingerprint = JSON.stringify({ service, ...form });
      if (pending.current?.fingerprint !== fingerprint) {
        pending.current = { fingerprint, requestId: crypto.randomUUID() };
      }
      const response = await fetch("/api/public/qualification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service, ...form, requestId: pending.current.requestId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "No pudimos guardar tu postulación. Vuelve a intentarlo.");
      if (data.qualified === false) {
        setState("not-ready");
        trackEvent("qualification_not_ready", { service });
        return;
      }
      if (data.ok !== true || typeof data.id !== "string") throw new Error("No pudimos confirmar el registro. Vuelve a intentarlo.");
      setHandoffUrl(whatsappUrl(message));
      setState("qualified");
      trackEvent("qualification_saved", { service, channel: "web" });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No pudimos guardar tu postulación. Vuelve a intentarlo.");
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  }

  if (state === "qualified") {
    return (
      <div className="qualify-wrap">
        <div className="qualify-intro"><span className="eyebrow">Postulación registrada</span><h2 ref={resultHeading} tabIndex={-1}>Guardamos tus respuestas.</h2></div>
        <div className="qualify-success"><span className="success-mark">✓</span><h3>Continúa la conversación por WhatsApp.</h3><p>Tu postulación quedó registrada aunque no abras WhatsApp. Para conversar, abre el mensaje, revísalo y pulsa Enviar en WhatsApp. Este paso no reserva una sesión.</p><button type="button" className="button button-dark" onClick={() => { window.open(handoffUrl, "_blank", "noopener,noreferrer"); trackEvent("qualification_whatsapp_clicked", { service, channel: "whatsapp" }); }}>Abrir WhatsApp →</button><button type="button" className="text-link" onClick={() => setState(null)}>Editar mis respuestas</button></div>
      </div>
    );
  }

  if (state === "not-ready") {
    return (
      <div className="qualify-wrap">
        <div className="qualify-intro"><span className="eyebrow">Siguiente paso recomendado</span><h2 ref={resultHeading} tabIndex={-1}>{content.notReadyTitle}</h2></div>
        <div className="qualify-success"><span className="success-mark">→</span><p>{content.notReadyText}</p><a className="button button-dark" href={content.alternative.href}>{content.alternative.label} <span>→</span></a><button type="button" className="text-link qualify-edit" onClick={() => setState(null)}>Editar mis respuestas</button></div>
      </div>
    );
  }

  return (
    <div className="qualify-wrap">
      <div className="qualify-intro"><span className="eyebrow">Filtro de encaje</span><h2>{content.title}</h2><p>{content.intro}</p></div>
      <form className="qualify-form" onSubmit={submit} aria-busy={saving}>
        <label>Tu nombre<input disabled={saving} required maxLength={160} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre y apellido" /></label>
        <label>Tu correo<input disabled={saving} required maxLength={254} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="tu@empresa.cl" /></label>
        <label>Empresa o contexto<input disabled={saving} required maxLength={160} value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Empresa, rol o proyecto" /></label>
        <label>Tu rol o responsabilidad<input disabled={saving} required maxLength={160} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder={service === "mentoria" ? "Profesional, fundador, líder…" : "Dueño, gerente, responsable del proceso…"} /></label>
        <label className="full-field">{content.resultLabel}<textarea disabled={saving} required maxLength={2000} value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })} placeholder={content.resultPlaceholder} rows={4} /><small>{content.resultHint}</small></label>
        {service === "mentoria" ? <label>¿Cuánto tiempo real puedes dedicar cada semana?<select disabled={saving} required value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })}><option value="">Selecciona una opción</option>{AVAILABILITY.map((option) => <option key={option}>{option}</option>)}</select></label> : <><label>Herramientas y datos que intervienen<textarea disabled={saving} required maxLength={2000} value={form.context} onChange={(e) => setForm({ ...form, context: e.target.value })} placeholder="WhatsApp, planillas, CRM, correos, etc." rows={2} /></label><label>¿Quién puede aprobar cambios y validar pruebas?<select disabled={saving} required value={form.decision} onChange={(e) => setForm({ ...form, decision: e.target.value })}><option value="">Selecciona una opción</option>{DECISIONS.map((option) => <option key={option}>{option}</option>)}</select></label></>}
        <label>Rango de inversión<select disabled={saving} required value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })}><option value="">Selecciona una opción</option>{content.budgetOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
        <label className="full-field qualify-checkbox"><input disabled={saving} required type="checkbox" checked={form.confirmed} onChange={(e) => setForm({ ...form, confirmed: e.target.checked })} /><span>{SERVICE_OFFERS[service].confirmation}</span></label>
        <p className="full-field">Guardaremos tus respuestas para revisar tu solicitud. Luego podrás continuar por WhatsApp.</p>
        {error && <p className="full-field" role="alert">{error}</p>}
        <button disabled={saving} type="submit" className="button button-dark full-field">{saving ? "Guardando…" : service === "mentoria" ? "Registrar postulación" : "Registrar evaluación"} <span>→</span></button>
      </form>
    </div>
  );
}
