"use client";

import { FormEvent, useState } from "react";
import { whatsappUrl } from "@/lib/contact";

type Service = "aprender" | "mentoria" | "implementacion";

const SERVICE_LABELS: Record<Service, string> = {
  aprender: "Quiero aprender",
  mentoria: "Quiero acompañamiento",
  implementacion: "Quiero que lo implementen",
};

const QUESTIONS: Record<Service, { label: string; options: string[] }> = {
  aprender: { label: "¿Qué quieres aprender primero?", options: ["IA desde cero", "Claude y herramientas", "Automatizaciones", "No estoy seguro todavía"] },
  mentoria: { label: "¿Qué quieres destrabar?", options: ["Ordenar mi sistema", "Aplicar IA a mi trabajo", "Crear una oferta", "Liderar el cambio en mi equipo"] },
  implementacion: { label: "¿Qué te gustaría implementar?", options: ["Agente IA para atención", "Automatizaciones internas", "Sistema personalizado", "Diagnóstico de oportunidades"] },
};

export default function QualificationForm({ service }: { service: Service }) {
  const [form, setForm] = useState({ name: "", company: "", team: "", budget: "", answer: "" });
  const [sent, setSent] = useState(false);
  const question = QUESTIONS[service];

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = [
      `Hola, vengo de CrececonIA. ${SERVICE_LABELS[service]}.`,
      `Nombre: ${form.name}`,
      `Empresa / contexto: ${form.company || "No indicado"}`,
      `Equipo: ${form.team || "No indicado"}`,
      `Inversión prevista: ${form.budget || "No indicado"}`,
      `${question.label} ${form.answer}`,
    ].join("\n");
    window.open(whatsappUrl(message), "_blank", "noopener,noreferrer");
    setSent(true);
  }

  return (
    <div className="qualify-wrap">
      <div className="qualify-intro"><span className="eyebrow">Un primer filtro</span><h2>Cuéntanos dónde estás.</h2><p>Son cuatro respuestas. Te llevamos a la conversación correcta sin hacerte pasar por un formulario eterno.</p></div>
      {sent ? <div className="qualify-success"><span className="success-mark">✓</span><h3>WhatsApp está listo.</h3><p>Se abrió una conversación con tu contexto. Si no se abrió, <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer">ábrela aquí</a>.</p><button type="button" className="text-link" onClick={() => setSent(false)}>Editar mis respuestas</button></div> : (
        <form className="qualify-form" onSubmit={submit}>
          <label>Tu nombre<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre y apellido" /></label>
          <label>Empresa o contexto<input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Empresa, rol o proyecto personal" /></label>
          <label>¿Cuántas personas están involucradas?<select value={form.team} onChange={(e) => setForm({ ...form, team: e.target.value })}><option value="">Selecciona una opción</option><option>Solo yo</option><option>2–10 personas</option><option>11–50 personas</option><option>Más de 50 personas</option></select></label>
          <label>Inversión que quieres considerar<select required value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })}><option value="">Selecciona una opción</option><option>Quiero explorar primero</option><option>Hasta $300.000 CLP</option><option>$300.000–$1.000.000 CLP</option><option>Más de $1.000.000 CLP</option></select></label>
          <label className="full-field">{question.label}<select required value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })}><option value="">Selecciona una opción</option>{question.options.map((option) => <option key={option}>{option}</option>)}</select></label>
          <button type="submit" className="button button-dark full-field">Continuar por WhatsApp <span>↗</span></button>
        </form>
      )}
    </div>
  );
}
