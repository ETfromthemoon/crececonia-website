"use client";
import { useState } from "react";
import styles from "./HomeEditorial.module.css";

const steps = [
  { title: "La tarea", label: "01 / Punto de partida", text: "Quiero encontrar potenciales clientes para mi estudio de diseño.", note: "Una necesidad concreta, antes de elegir herramientas." },
  { title: "El método", label: "02 / Instrucciones reutilizables", text: "Define el cliente ideal. Busca señales públicas. Prioriza por encaje. Prepara un mensaje para revisar.", note: "La skill organiza el proceso; tú aportas el contexto y los criterios." },
  { title: "El resultado", label: "03 / Salida esperada", text: "Una lista de prospectos con fuentes, criterios de prioridad y borradores de contacto.", note: "Verifica los datos y aprueba cada mensaje antes de usarlo. No se envía nada automáticamente." },
];

export default function SkillShowcase() {
  const [selected, setSelected] = useState(0);
  const step = steps[selected];
  return <section className={styles.demo} aria-labelledby="skill-demo-title"><div className={`site-container ${styles.demoGrid}`}>
    <div><span className={styles.label}>No es otro prompt suelto</span><h2 id="skill-demo-title">Un método que<br />puedes <em>reutilizar.</em></h2><p>Así se traduce una tarea en un flujo de trabajo con una skill. Explora el ejemplo de Captaclientes.</p><a href="/skills/captaclientes" className={styles.demoLink}>Ver la skill y descargarla <span>↗</span></a></div>
    <div className={styles.demoBoard}>
      <div className={styles.demoMeta}><span>CAPTACLIENTES / VISTA DEL MÉTODO</span><span>Ejemplo ilustrativo</span></div>
      <div className={styles.stepButtons} role="group" aria-label="Pasos del ejemplo">{steps.map((item, index) => <button type="button" key={item.title} aria-pressed={selected === index} aria-controls="skill-example" onClick={() => setSelected(index)}><span>0{index + 1}</span>{item.title}</button>)}</div>
      <div id="skill-example" className={styles.example} aria-live="polite" aria-atomic="true"><span className={styles.label}>{step.label}</span><p>{step.text}</p><small>{step.note}</small></div>
      <div className={styles.demoFooter}><span aria-hidden="true">↳</span> Demostración explicativa. No ejecuta búsquedas ni utiliza datos de clientes.</div>
    </div>
  </div></section>;
}
