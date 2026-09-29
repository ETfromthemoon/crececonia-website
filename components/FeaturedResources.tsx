const resources = [
  { href: "/ebooks", type: "Ebooks", title: "Una ruta para aprender", text: "Libros prácticos para profundizar y aplicar a tu ritmo.", action: "Explorar ebooks" },
  { href: "/centro/guias", type: "Guías", title: "Resuelve una tarea concreta", text: "Lecturas paso a paso, abiertas y listas para consultar.", action: "Leer las guías" },
  { href: "/centro/skills", type: "Skills", title: "Lleva el método a tu entorno", text: "Instrucciones reutilizables y archivos de descarga directa.", action: "Explorar skills" },
];

export default function FeaturedResources() {
  return <section className="featured-resources site-container" aria-labelledby="resources-title">
    <div className="resource-section-heading"><div><span className="eyebrow">Biblioteca CrececonIA</span><h2 id="resources-title">Empieza con algo concreto.</h2></div><a className="text-link" href="/centro">Ver todos los recursos →</a></div>
    <div className="featured-resource-grid">{resources.map(resource => <a className="featured-resource" key={resource.href} href={resource.href}>
      <span className="resource-type">{resource.type}</span><h3>{resource.title}</h3><p>{resource.text}</p><span className="resource-card-action">{resource.action} <span aria-hidden="true">↗</span></span>
    </a>)}</div>
  </section>;
}
