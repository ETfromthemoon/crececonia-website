export type WebEbookPart = {
  resource: string;
  eyebrow: string;
  title: string;
  titleAccent: string;
  description: string;
  introTitle: string;
  intro: string;
  stats: Array<{ value: string; label: string }>;
  tocTitle: string;
  sections: Array<{
    heading: string;
    chapters: Array<{ title: string; desc: string }>;
  }>;
  forYou: string[];
  notFor: string[];
  faqs: Array<{ q: string; a: string }>;
};

export const WEB_EBOOK_PARTS: Record<string, WebEbookPart> = {
  "ebook:creacion-de-webs-con-ia-parte-2": {
    resource: "ebook:creacion-de-webs-con-ia-parte-2",
    eyebrow: "Ebook · CrececonIA · Colección Web · Parte 2",
    title: "Sitios Corporativos",
    titleAccent: "con IA.",
    description: "Construye sitios corporativos completos con Astro, CMS y multi-idioma. 113 páginas y un proyecto real con Ardenza.",
    introTitle: "El sitio que el cliente puede editar solo.",
    intro: "Parte 2 toma la metodología de construcción con IA y la lleva a sitios corporativos reales: arquitectura de información, contenido editable, SEO local, formularios, migraciones y entrega profesional.",
    stats: [
      { value: "113", label: "páginas" },
      { value: "21", label: "capítulos" },
      { value: "4", label: "partes" },
      { value: "1", label: "proyecto real" },
    ],
    tocTitle: "21 capítulos para pasar de una referencia a un sitio corporativo que se puede mantener.",
    sections: [
      { heading: "Parte I · Fundamentos", chapters: [
        { title: "Setup y dirección de arte", desc: "Configura el entorno y define una marca con criterio antes de generar componentes." },
        { title: "Arquitectura de información", desc: "Convierte servicios, proyectos y contenidos en una estructura que el usuario entiende." },
        { title: "Astro, CMS y multi-idioma", desc: "Elige una base rápida y editable para sitios corporativos que crecerán con el cliente." },
      ] },
      { heading: "Parte II · Proyecto Ardenza", chapters: [
        { title: "Anatomía de un sitio corporativo", desc: "Construye el caso real Ardenza desde la especificación hasta las iteraciones finales." },
        { title: "Contenido, blog y proyectos", desc: "Organiza colecciones, páginas de servicios y casos de estudio sin duplicar trabajo." },
      ] },
      { heading: "Parte III · Alcance y captación", chapters: [
        { title: "SEO local y multi-idioma", desc: "Haz que el sitio sea encontrable y útil para distintos mercados y ubicaciones." },
        { title: "Formularios corporativos", desc: "Conecta consultas reales con ruteo, validación y una experiencia confiable." },
      ] },
      { heading: "Parte IV · Entrega", chapters: [
        { title: "Migración, legal y deploy", desc: "Publica, migra y deja una base mantenible para el equipo que recibe el proyecto." },
        { title: "Handoff y capacitación", desc: "Entrega el sitio con documentación, criterio de operación y próximos pasos claros." },
      ] },
    ],
    forYou: [
      "Quieres construir sitios corporativos para clientes o para tu propia empresa.",
      "Necesitas que el contenido pueda editarse sin tocar todo el código.",
      "Quieres trabajar con Astro, CMS, SEO local y una entrega profesional.",
    ],
    notFor: [
      "Buscas una landing de una sola página sin contenido administrable.",
      "Quieres construir un eCommerce o una aplicación SaaS; esas son las Partes 3 y 4.",
      "Esperas que el libro reemplace la implementación de un proyecto específico.",
    ],
    faqs: [
      { q: "¿Qué proyecto se construye?", a: "Ardenza, un sitio corporativo de estudio de arquitectura, documentado desde la arquitectura hasta el handoff." },
      { q: "¿Qué stack usa?", a: "Astro, Content Collections, CMS, multi-idioma, formularios, SEO local y deploy con ClaudeCode." },
      { q: "¿Necesito leer la Parte 1?", a: "Ayuda conocer la base, pero esta parte vuelve a explicar las decisiones necesarias y puede leerse como una ruta independiente." },
      { q: "¿En qué formato viene?", a: "PDF en versión A4 y versión para celular, incluidas en la compra." },
    ],
  },
  "ebook:creacion-de-webs-con-ia-parte-3": {
    resource: "ebook:creacion-de-webs-con-ia-parte-3",
    eyebrow: "Ebook · CrececonIA · Colección Web · Parte 3",
    title: "eCommerce",
    titleAccent: "con IA.",
    description: "Construye una tienda online con catálogo, carrito, checkout y pagos reales usando Next.js y ClaudeCode. 129 páginas y un proyecto real.",
    introTitle: "Los flujos donde un bug cuesta dinero.",
    intro: "Parte 3 documenta la construcción de TechStore: catálogo, filtros, carrito, checkout, inventario, pagos, webhooks, emails, métricas y operación de una tienda que debe funcionar de verdad.",
    stats: [
      { value: "129", label: "páginas" },
      { value: "23", label: "capítulos" },
      { value: "4", label: "partes" },
      { value: "1", label: "proyecto real" },
    ],
    tocTitle: "23 capítulos para construir una tienda, cobrar y operar después del lanzamiento.",
    sections: [
      { heading: "Parte I · Fundamentos", chapters: [
        { title: "Setup, prompting y dirección de arte", desc: "Define el sistema visual y el entorno antes de entrar en los flujos de dinero." },
        { title: "Arquitectura y testing", desc: "Diseña tipos, componentes y pruebas para que el catálogo no se vuelva frágil." },
      ] },
      { heading: "Parte II · Proyecto TechStore", chapters: [
        { title: "Catálogo y descubrimiento", desc: "Construye productos, categorías, filtros, búsquedas y páginas que ayudan a elegir." },
        { title: "Carrito y estado", desc: "Mantén el carrito consistente entre páginas y evita errores de estado compartido." },
        { title: "Iteraciones reales", desc: "Sigue el proyecto desde el MVP hasta las decisiones que lo vuelven operable." },
      ] },
      { heading: "Parte III · El dinero", chapters: [
        { title: "Pagos, órdenes y webhooks", desc: "Conecta checkout, confirmaciones y estados sin confiar en datos enviados por el navegador." },
        { title: "Emails transaccionales", desc: "Entrega confirmaciones y comunicaciones que acompañan cada orden." },
      ] },
      { heading: "Parte IV · Operación", chapters: [
        { title: "Performance y conversión", desc: "Mide el catálogo, mejora la velocidad y aprende qué mueve las compras." },
        { title: "CMS, moneda y términos", desc: "Prepara inventario, regiones y la operación legal de una tienda real." },
      ] },
    ],
    forYou: [
      "Quieres construir una tienda online completa, no solo una maqueta visual.",
      "Necesitas entender carrito, pagos, webhooks, inventario y emails.",
      "Quieres usar Next.js y ClaudeCode en un proyecto que puedas verificar.",
    ],
    notFor: [
      "Solo buscas una landing sin catálogo ni checkout.",
      "No quieres revisar estados de pago, inventario y seguridad del servidor.",
      "Esperas una integración específica ya configurada para tu negocio.",
    ],
    faqs: [
      { q: "¿El libro incluye pagos reales?", a: "Sí. Documenta el flujo completo con Stripe en modo de prueba, webhooks y órdenes." },
      { q: "¿Qué proyecto se construye?", a: "TechStore, un eCommerce con catálogo, filtros, carrito, checkout, inventario y operación." },
      { q: "¿Puedo usar otro proveedor de pago?", a: "Sí. El valor está en el modelo de estados, validación y webhooks; esos principios se trasladan a otros proveedores." },
      { q: "¿En qué formato viene?", a: "PDF en versión A4 y versión para celular, incluidas en la compra." },
    ],
  },
  "ebook:creacion-de-webs-con-ia-parte-4": {
    resource: "ebook:creacion-de-webs-con-ia-parte-4",
    eyebrow: "Ebook · CrececonIA · Colección Web · Parte 4",
    title: "SaaS y Dashboards",
    titleAccent: "con IA.",
    description: "Construye aplicaciones SaaS con autenticación, datos en vivo y multi-tenancy usando Next.js y ClaudeCode. 114 páginas y un proyecto real.",
    introTitle: "Cuando una web se convierte en producto.",
    intro: "Parte 4 lleva la metodología a una aplicación con usuarios, roles, datos privados, dashboards, actualizaciones en tiempo real, límites y seguridad multi-tenant.",
    stats: [
      { value: "114", label: "páginas" },
      { value: "21", label: "capítulos" },
      { value: "3", label: "partes" },
      { value: "1", label: "proyecto real" },
    ],
    tocTitle: "21 capítulos para pasar de una interfaz bonita a un producto SaaS seguro y operable.",
    sections: [
      { heading: "Parte I · Fundamentos", chapters: [
        { title: "Setup y arquitectura de producto", desc: "Decide qué pertenece a una app SaaS y qué debe quedar fuera del MVP." },
        { title: "Auth, TypeScript y estado", desc: "Prepara una base donde usuarios, roles y datos se puedan verificar." },
      ] },
      { heading: "Parte II · AppFlow Dashboard", chapters: [
        { title: "Arquitectura SaaS", desc: "Modela el dashboard, sus entidades y los límites que debe respetar cada usuario." },
        { title: "Sesiones, roles y data fetching", desc: "Conecta autenticación, permisos y datos sin filtrar información entre cuentas." },
        { title: "Iteraciones reales", desc: "Construye AppFlow Dashboard desde el primer layout hasta los flujos centrales." },
      ] },
      { heading: "Parte III · Escala", chapters: [
        { title: "Realtime y optimistic UI", desc: "Actualiza interfaces complejas sin romper la consistencia de los datos." },
        { title: "Multi-tenancy y seguridad", desc: "Evita el error crítico de mezclar datos entre organizaciones y usuarios." },
        { title: "Suscripciones, API y handoff", desc: "Prepara límites, observabilidad, API pública y una entrega mantenible." },
      ] },
    ],
    forYou: [
      "Quieres pasar de páginas de marketing a aplicaciones con usuarios y datos reales.",
      "Necesitas entender autenticación, roles, multi-tenancy y actualizaciones en vivo.",
      "Quieres construir un dashboard SaaS con Next.js y ClaudeCode de forma verificable.",
    ],
    notFor: [
      "Todavía no necesitas usuarios, permisos ni datos persistentes.",
      "Buscas una landing o un sitio corporativo estático.",
      "Esperas un producto SaaS listo para producción sin adaptar el proyecto a tu caso.",
    ],
    faqs: [
      { q: "¿Qué proyecto se construye?", a: "AppFlow Dashboard, una aplicación SaaS de gestión con autenticación, roles, datos y dashboard." },
      { q: "¿Qué significa multi-tenancy?", a: "Que varias organizaciones usan la misma aplicación y cada una solo puede acceder a sus propios datos." },
      { q: "¿Necesito saber programar?", a: "Ayuda tener un perfil técnico o semi-técnico; el libro usa Next.js, TypeScript y decisiones reales de arquitectura." },
      { q: "¿En qué formato viene?", a: "PDF en versión A4 y versión para celular, incluidas en la compra." },
    ],
  },
};
