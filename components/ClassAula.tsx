"use client";

import { useEffect, useMemo, useState } from "react";
import { CLASS_FAQS, CLASS_LESSONS, type ClassLesson } from "@/lib/class-course-content";
import { CLASS_MATERIALS } from "@/lib/class-materials";

type Props = {
  token: string;
  sessionUrl?: string;
  groupUrl?: string;
  recordingUrl?: string;
  supportEmail: string;
  presentationHref: string;
};

const preparation = [
  "Tengo mi computador, cargador y una conexión estable.",
  "Elegí una idea de página acotada para construir hoy.",
  "Instalé Claude Code o Codex y abrí una carpeta de proyecto.",
  "Tengo una cuenta de GitHub y una de Vercel.",
  "Guardé dos referencias y el texto mínimo de mi oferta.",
];

function Lesson({ lesson }: { lesson: ClassLesson }) {
  return <details className="aula-lesson" id={lesson.id}>
    <summary>
      <span className="aula-index">{lesson.number}</span>
      <span><strong>{lesson.title}</strong><small>{lesson.duration} · {lesson.objective}</small></span>
      <i>+</i>
    </summary>
    <div className="aula-lesson-body">
      <div><span>Pasos</span><ol>{lesson.steps.map((step) => <li key={step}>{step}</li>)}</ol></div>
      <div className="aula-example"><span>Ejemplo</span><p>{lesson.example}</p></div>
      <div className="aula-action"><span>Ejercicio</span><p>{lesson.exercise}</p><strong>Resultado esperado: {lesson.expected}</strong></div>
      {lesson.advanced && <p className="aula-advanced"><b>Ruta avanzada:</b> {lesson.advanced}</p>}
      {lesson.alert && <p className="aula-alert"><b>Ojo:</b> {lesson.alert}</p>}
    </div>
  </details>;
}
export default function ClassAula({ token, sessionUrl, groupUrl, recordingUrl, supportEmail, presentationHref }: Props) {
  const [checked, setChecked] = useState<boolean[]>(() => preparation.map(() => false));
  const [activeView, setActiveView] = useState<"hoy" | "guias" | "recursos" | "continuidad">("hoy");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("crececonia-class-2026-checklist");
      if (stored) setChecked(JSON.parse(stored));
    } catch { /* La checklist sigue funcionando sin almacenamiento local. */ }
  }, []);

  const completed = useMemo(() => checked.filter(Boolean).length, [checked]);
  function toggle(index: number) {
    setChecked((current) => {
      const next = current.map((value, position) => position === index ? !value : value);
      try { window.localStorage.setItem("crececonia-class-2026-checklist", JSON.stringify(next)); } catch { /* noop */ }
      return next;
    });
  }
  const download = (id: string) => `/api/clase/material?id=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}`;

  return <main className="aula-page">
    <section className="aula-hero">
      <div className="aula-shell">
        <div className="aula-eyebrow"><span className="aula-live-dot" /> CrececonIA · Aula de la clase</div>
        <div className="aula-hero-grid">
          <div><p className="aula-overline">Domingo 23 de agosto · 18:00 a 20:30 h · Online</p><h1>Tu página no empieza en el código.<em> Empieza en una decisión clara.</em></h1><p className="aula-lead">Este es tu espacio de trabajo antes, durante y después de la clase. Sigue la ruta, descarga las plantillas y construye en paralelo.</p></div>
          <div className="aula-status-card"><span>Objetivo de hoy</span><strong>Publicar una primera versión funcional.</strong><p>Referencia → contexto → agente → GitHub → Vercel.</p><a href={presentationHref}>Abrir presentación del relator <b>↗</b></a></div>
        </div>
        <div className="aula-access-row">
          {sessionUrl ? <a className="aula-primary" href={sessionUrl} target="_blank" rel="noreferrer">Entrar a Google Meet <span>↗</span></a> : <span className="aula-pending">El enlace de Google Meet se habilita antes de la clase.</span>}
          {groupUrl ? <a className="aula-secondary" href={groupUrl} target="_blank" rel="noreferrer">Grupo de WhatsApp <span>↗</span></a> : <span className="aula-secondary aula-disabled">Invitación de WhatsApp por correo</span>}
          <a className="aula-secondary" href={`mailto:${supportEmail}?subject=Ayuda%20clase%20p%C3%A1gina%20con%20IA`}>Pedir soporte <span>↗</span></a>
        </div>
      </div>
    </section>

    <nav className="aula-nav" aria-label="Navegación del aula"><div className="aula-shell">{([ ["hoy", "Hoy en la clase"], ["guias", "Guías prácticas"], ["recursos", "Descargables"], ["continuidad", "Después de la clase"] ] as const).map(([view, label]) => <button key={view} type="button" className={activeView === view ? "is-active" : ""} onClick={() => setActiveView(view)}>{label}</button>)}</div></nav>

    {activeView === "hoy" && <section className="aula-section aula-shell">
      <div className="aula-section-heading"><span>01 · Antes / Durante</span><h2>Deja listo lo que te permite avanzar sin esperar a nadie.</h2><p>Marca tus avances. La checklist queda guardada en este navegador.</p></div>
      <div className="aula-checklist-wrap">
        <div className="aula-checklist"><div className="aula-checklist-head"><span>Preparación</span><strong>{completed}/{preparation.length}</strong></div>{preparation.map((item, index) => <label key={item}><input type="checkbox" checked={checked[index]} onChange={() => toggle(index)} /><span>{item}</span><i>✓</i></label>)}</div>
        <aside className="aula-route"><span>Ruta de clase</span><ol><li><b>Antes</b> abre herramientas, brief y referencias.</li><li><b>Durante</b> construye V1, súbela y publícala.</li><li><b>Después</b> prueba, recoge feedback e itera 7 días.</li></ol><a href={download("checklist-preclase")}>Descargar checklist <b>↓</b></a></aside>
      </div>
      <div className="aula-runway"><div><span>Ruta base</span><strong>Carpeta → brief → primera pantalla → URL.</strong><p>Si te atrasas, termina sólo esto durante la sesión.</p></div><div><span>Ruta avanzada</span><strong>Componentes, referencia visual, QA y segunda iteración.</strong><p>Úsala sólo cuando ya tengas la V1 publicada.</p></div></div>
      <div className="aula-timeline"><span>Agenda en vivo</span><ol><li><b>18:00</b> Apertura y setup</li><li><b>18:15</b> Agente y contexto</li><li><b>18:35</b> Brief y referencias</li><li><b>18:55</b> Construcción guiada</li><li><b>19:30</b> Pausa + checkpoint</li><li><b>19:38</b> GitHub y Vercel</li><li><b>20:03</b> Iteración + QA</li><li><b>20:21</b> Cierre y reto</li></ol></div>
    </section>}

    {activeView === "guias" && <section className="aula-section aula-shell">
      <div className="aula-section-heading"><span>02 · Guías prácticas</span><h2>Abre la lección que necesitas y ejecuta el siguiente paso.</h2><p>Cada lección trae objetivo, pasos, ejemplo, ejercicio y resultado esperado.</p></div>
      <div className="aula-lesson-list">{CLASS_LESSONS.map((lesson) => <Lesson key={lesson.id} lesson={lesson} />)}</div>
    </section>}

    {activeView === "recursos" && <section className="aula-section aula-shell">
      <div className="aula-section-heading"><span>03 · Descargables</span><h2>Plantillas para copiar, completar y reutilizar.</h2><p>Los archivos se descargan con tu acceso personal. Úsalos como base, no como burocracia.</p></div>
      <div className="aula-resource-grid">{Object.entries(CLASS_MATERIALS).map(([id, material], index) => <a href={download(id)} key={id} className="aula-resource"><span>{String(index + 1).padStart(2, "0")}</span><h3>{material.title}</h3><p>{material.description}</p><b>Descargar .md <i>↓</i></b></a>)}</div>
      <div className="aula-note"><strong>Pack incluido de ebooks</strong><p>Los cuatro ebooks “Creación de Webs con IA” se entregan por correo mediante enlaces personales. Guarda ese correo para acceder o recuperar tus descargas.</p></div>
    </section>}

    {activeView === "continuidad" && <section className="aula-section aula-shell">
      <div className="aula-section-heading"><span>04 · Después</span><h2>La clase termina; tu implementación no.</h2><p>La forma más rápida de mejorar una web es publicarla, observarla y corregir una cosa importante por vez.</p></div>
      <div className="aula-after-grid"><article><span>Reto de 7 días</span><h3>Una mejora útil al día.</h3><p>Publica, aclara el mensaje, agrega prueba, revisa móvil, crea contenido, mide la acción y elige el siguiente bloque.</p><a href={download("reto-7-dias")}>Descargar plan <b>↓</b></a></article><article><span>{recordingUrl ? "Grabación disponible" : "Canal de dudas"}</span><h3>{recordingUrl ? "Vuelve a mirar el paso que necesitas." : "Pregunta con contexto."}</h3><p>{recordingUrl ? "La grabación se habilita como un apoyo para retomar una configuración, un prompt o un despliegue. Úsala junto con las plantillas, no como reemplazo de tu propia práctica." : "Envía URL o captura, expectativa, resultado real, lo que intentaste y el error completo. Así la respuesta llega al problema, no a una suposición."}</p><a href={recordingUrl ?? `mailto:${supportEmail}?subject=Duda%20postclase%20-%20mi%20p%C3%A1gina`} target={recordingUrl ? "_blank" : undefined} rel={recordingUrl ? "noreferrer" : undefined}>{recordingUrl ? "Ver grabación" : "Escribir a soporte"} <b>↗</b></a></article><article><span>Apoyo adicional</span><h3>Cuando tu siguiente paso necesita más alcance.</h3><p>Mentoría para decidir y revisar; implementación para e-commerce, integraciones, automatizaciones o una web completa que requiera equipo.</p><a href="/mentoria">Ver mentoría <b>↗</b></a></article></div>
      <div className="aula-faq"><span>Preguntas frecuentes</span>{CLASS_FAQS.map(([question, answer]) => <details key={question}><summary>{question}<b>+</b></summary><p>{answer}</p></details>)}</div>
    </section>}
  </main>;
}
