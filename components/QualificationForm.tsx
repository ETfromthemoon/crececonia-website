"use client";

import { FormEvent, useState } from "react";
import { whatsappUrl } from "@/lib/contact";

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
  budgetOptions: string[];
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
    budgetOptions: ["Menos de $400.000 CLP mensuales", "$400.000–$600.000 CLP mensuales", "Más de $600.000 CLP mensuales"],
    notReadyTitle: "La mentoría no es el siguiente paso todavía.",
    notReadyText: "Para que el acompañamiento funcione necesitas un objetivo, tiempo semanal para ejecutar y una inversión desde $400.000 CLP mensuales. Puedes avanzar por tu cuenta y volver cuando esas condiciones estén claras.",
    alternative: { href: "/ebooks", label: "Explorar ebooks para avanzar por mi cuenta" },
  },
  implementacion: {
    title: "Evalúa tu caso antes de solicitar una conversación.",
    intro: "Revisamos proyectos que tengan un proceso definido, un responsable y presupuesto alineado. Esta evaluación no incluye diseño, arquitectura ni consultoría gratuita.",
    resultLabel: "¿Qué proceso específico quieres mejorar? Describe cómo funciona hoy.",
    resultPlaceholder: "Ej.: recibimos consultas por WhatsApp, una persona revisa disponibilidad y responde manualmente cada caso.",
    resultHint: "Incluye qué ocurre hoy y dónde se pierde tiempo, calidad, ventas o visibilidad.",
    budgetOptions: ["Menos de $500.000 CLP", "$500.000–$1.000.000 CLP", "$1.000.000–$2.000.000 CLP", "Más de $2.000.000 CLP"],
    notReadyTitle: "Todavía no conviene abrir una conversación de implementación.",
    notReadyText: "Una implementación necesita un proceso concreto, alguien que pueda decidir y validar, y una inversión desde $500.000 CLP más mantención. Primero define el caso o revisa si necesitas aprender o recibir acompañamiento.",
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

  const canContinue = service === "mentoria"
    ? form.budget !== "Menos de $400.000 CLP mensuales" && form.availability !== "Menos de 2 horas"
    : form.budget !== "Menos de $500.000 CLP" && form.decision !== "No sé quién decide todavía" && form.context.trim().length >= 20;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canContinue) {
      setState("not-ready");
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

    window.open(whatsappUrl(message), "_blank", "noopener,noreferrer");
    setState("qualified");
  }

  if (state === "qualified") {
    return (
      <div className="qualify-wrap">
        <div className="qualify-intro"><span className="eyebrow">Postulación enviada</span><h2>Tu contexto ya está listo para revisar.</h2></div>
        <div className="qualify-success"><span className="success-mark">✓</span><h3>Se abrió WhatsApp con tu postulación.</h3><p>No hace falta volver a explicar lo básico: el mensaje incluye tu objetivo, contexto y rango de inversión. La conversación es para validar encaje y alcance, no para partir de cero.</p><button type="button" className="text-link" onClick={() => setState(null)}>Editar mis respuestas</button></div>
      </div>
    );
  }

  if (state === "not-ready") {
    return (
      <div className="qualify-wrap">
        <div className="qualify-intro"><span className="eyebrow">Siguiente paso recomendado</span><h2>{content.notReadyTitle}</h2></div>
        <div className="qualify-success"><span className="success-mark">→</span><p>{content.notReadyText}</p><a className="button button-dark" href={content.alternative.href}>{content.alternative.label} <span>→</span></a><button type="button" className="text-link qualify-edit" onClick={() => setState(null)}>Editar mis respuestas</button></div>
      </div>
    );
  }

  return (
    <div className="qualify-wrap">
      <div className="qualify-intro"><span className="eyebrow">Filtro de encaje</span><h2>{content.title}</h2><p>{content.intro}</p></div>
      <form className="qualify-form" onSubmit={submit}>
        <label>Tu nombre<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre y apellido" /></label>
        <label>Tu correo<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="tu@empresa.cl" /></label>
        <label>Empresa o contexto<input required value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Empresa, rol o proyecto" /></label>
        <label>Tu rol o responsabilidad<input required value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder={service === "mentoria" ? "Profesional, fundador, líder…" : "Dueño, gerente, responsable del proceso…"} /></label>
        <label className="full-field">{content.resultLabel}<textarea required value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })} placeholder={content.resultPlaceholder} rows={4} /><small>{content.resultHint}</small></label>
        {service === "mentoria" ? <label>¿Cuánto tiempo real puedes dedicar cada semana?<select required value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })}><option value="">Selecciona una opción</option><option>Menos de 2 horas</option><option>2–4 horas</option><option>5 horas o más</option></select></label> : <><label>Herramientas y datos que intervienen<textarea required value={form.context} onChange={(e) => setForm({ ...form, context: e.target.value })} placeholder="WhatsApp, planillas, CRM, correos, etc." rows={2} /></label><label>¿Quién puede aprobar cambios y validar pruebas?<select required value={form.decision} onChange={(e) => setForm({ ...form, decision: e.target.value })}><option value="">Selecciona una opción</option><option>Yo tomo la decisión</option><option>Yo propongo y otra persona aprueba</option><option>Ya hay un responsable disponible</option><option>No sé quién decide todavía</option></select></label></>}
        <label>Rango de inversión<select required value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })}><option value="">Selecciona una opción</option>{content.budgetOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
        <label className="full-field qualify-checkbox"><input required type="checkbox" checked={form.confirmed} onChange={(e) => setForm({ ...form, confirmed: e.target.checked })} /><span>{service === "mentoria" ? "Entiendo que la mentoría parte desde $400.000 CLP mensuales y que debo trabajar entre sesiones." : "Entiendo que la implementación parte desde $500.000 CLP y requiere mantención desde $100.000 CLP mensuales."}</span></label>
        <button type="submit" className="button button-dark full-field">{service === "mentoria" ? "Enviar postulación para revisión" : "Enviar evaluación de implementación"} <span>→</span></button>
      </form>
    </div>
  );
}
