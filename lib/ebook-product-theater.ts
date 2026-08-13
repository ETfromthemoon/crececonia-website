export type EbookProductTheaterContent = {
  stats: Array<{ value: string; label: string }>;
  inside: { kicker: string; title: string; description: string };
  previews: Array<{
    src: string;
    alt: string;
    label: string;
    detail: string;
    width: number;
    height: number;
  }>;
  journey: {
    kicker: string;
    title: string;
    steps: Array<{ number: string; title: string; text: string }>;
  };
  outcome: { kicker: string; title: string; before: string; after: string };
};

export const EBOOK_PRODUCT_THEATER_CONTENT: Record<string, EbookProductTheaterContent> = {
  "ebook:de-cero-a-claude-en-una-semana": {
    stats: [
      { value: "150+", label: "páginas" },
      { value: "25", label: "capítulos" },
      { value: "4", label: "niveles" },
      { value: "1", label: "ruta completa" },
    ],
    inside: {
      kicker: "Mira el producto por dentro",
      title: "No compras una lista de prompts. Compras una ruta completa para entender, operar y construir con Claude.",
      description: "El contenido avanza desde los fundamentos de Claude.ai hasta Claude Code, agentes y API, con explicaciones prácticas y puntos de verificación.",
    },
    previews: [
      { src: "/ebooks/previews/de-cero-claude/mapa.webp", alt: "Página real del índice de De cero a Claude en una semana", label: "El mapa completo", detail: "25 capítulos ordenados en cuatro niveles.", width: 923, height: 1305 },
      { src: "/ebooks/previews/de-cero-claude/claude-code.webp", alt: "Página real del capítulo Empezar con Claude Code", label: "Del navegador a la terminal", detail: "Instalación, requisitos y primera ejecución.", width: 923, height: 1305 },
      { src: "/ebooks/previews/de-cero-claude/api.webp", alt: "Página real del capítulo sobre la API de Claude", label: "Construir con Claude", detail: "API, streaming, herramientas, visión y SDKs.", width: 923, height: 1305 },
      { src: "/ebooks/previews/de-cero-claude/troubleshooting.webp", alt: "Página real de troubleshooting y mejores prácticas", label: "Resolver con criterio", detail: "Errores, límites, costes y buenas prácticas.", width: 923, height: 1305 },
    ],
    journey: {
      kicker: "La progresión del libro",
      title: "De tu primera conversación a crear soluciones con Claude.",
      steps: [
        { number: "01", title: "Entender y usar", text: "Aprendes modelos, prompting, proyectos, memoria, archivos y organización sin tecnicismos innecesarios." },
        { number: "02", title: "Operar Claude Code", text: "Pasas a terminal, configuración, permisos, skills, hooks, MCP, IDEs y agentes." },
        { number: "03", title: "Construir con Claude", text: "Cierras con API, automatización, equipos y una guía práctica para resolver errores reales." },
      ],
    },
    outcome: {
      kicker: "De uso casual a dominio práctico",
      title: "El objetivo no es memorizar funciones. Es saber qué usar, cuándo y con qué límites.",
      before: "Conversaciones aisladas, prompts improvisados y dudas sobre qué herramienta usar.",
      after: "Una ruta ordenada para trabajar con Claude.ai, Claude Code y la API según el problema.",
    },
  },
  "ebook:claude-nivel-experto": {
    stats: [
      { value: "71", label: "páginas" },
      { value: "12", label: "capítulos" },
      { value: "3", label: "bonos" },
      { value: "16", label: "prompts" },
    ],
    inside: {
      kicker: "Mira el producto por dentro",
      title: "No compras prompts más bonitos. Compras un sistema para delegar trabajo a Claude y verificar el resultado.",
      description: "El libro convierte técnicas avanzadas en decisiones operativas: contexto, criterios de salida, orquestación, verificación y límites de autonomía.",
    },
    previews: [
      { src: "/ebooks/previews/claude-experto/mapa.webp", alt: "Página real del mapa de contenidos de Claude a Nivel Experto", label: "El sistema completo", detail: "Delegación, contexto, bucles y verificación.", width: 949, height: 1228 },
      { src: "/ebooks/previews/claude-experto/prompt-operador.webp", alt: "Página real sobre el prompt de un operador", label: "Prompts con estructura", detail: "Objetivo, restricciones, éxito y comprobación.", width: 949, height: 1228 },
      { src: "/ebooks/previews/claude-experto/orquestacion.webp", alt: "Página real del capítulo de orquestación de Claude", label: "Escalar con criterio", detail: "Cuándo paralelizar y cuándo solo cuesta más.", width: 949, height: 1228 },
      { src: "/ebooks/previews/claude-experto/caso-completo.webp", alt: "Página real del caso completo de Claude a Nivel Experto", label: "Un caso de principio a fin", detail: "Todo el sistema aplicado a un problema de negocio.", width: 949, height: 1228 },
    ],
    journey: {
      kicker: "La progresión del libro",
      title: "De conversar con Claude a diseñar un operador confiable.",
      steps: [
        { number: "01", title: "Delegar", text: "Defines objetivos, restricciones, contexto y criterios de éxito antes de entregar el trabajo." },
        { number: "02", title: "Operar", text: "Usas ciclos, memoria y salidas verificables para reducir supervisión sin perder control." },
        { number: "03", title: "Escalar", text: "Orquestas varios Claude, proteges límites y aplicas el método completo a un caso real." },
      ],
    },
    outcome: {
      kicker: "El salto de nivel",
      title: "El objetivo no es conversar más rápido. Es delegar sin perder control ni criterio.",
      before: "Chats largos, contexto degradado y resultados que requieren revisión constante.",
      after: "Objetivos, bucles, verificación y límites diseñados como un sistema de trabajo.",
    },
  },
  "ebook:agentes-de-ia": {
    stats: [
      { value: "137", label: "páginas" },
      { value: "21", label: "capítulos" },
      { value: "7", label: "partes" },
      { value: "1", label: "caso completo" },
    ],
    inside: {
      kicker: "Mira el producto por dentro",
      title: "No compras automatización a ciegas. Compras criterio para decidir qué agente vale la pena construir.",
      description: "La guía separa el marketing de la capacidad real, ayuda a elegir el primer caso y lleva la decisión hasta una implementación práctica.",
    },
    previews: [
      { src: "/ebooks/previews/agentes-ia/mapa.webp", alt: "Página real del índice de Agentes de IA para tu Negocio", label: "Un mapa para decidir", detail: "Criterio, arquitectura, construcción y operación.", width: 924, height: 1307 },
      { src: "/ebooks/previews/agentes-ia/niveles-agente.webp", alt: "Página real sobre los cuatro niveles de agente", label: "Evitar el agent-washing", detail: "Qué hace realmente cada nivel de agente.", width: 924, height: 1307 },
      { src: "/ebooks/previews/agentes-ia/semaforo-decision.webp", alt: "Página real del semáforo de decisión para automatizar", label: "Saber cuándo no automatizar", detail: "Señales de alto, precaución y adelante.", width: 924, height: 1307 },
      { src: "/ebooks/previews/agentes-ia/agente-sin-codigo.webp", alt: "Página real de la guía para crear un agente sin código", label: "Construir para aprender", detail: "Un primer agente sin instalar ni programar.", width: 924, height: 1307 },
    ],
    journey: {
      kicker: "La progresión del libro",
      title: "De reconocer una oportunidad a operar un agente útil.",
      steps: [
        { number: "01", title: "Decidir", text: "Distingues agentes reales, detectas promesas infladas y eliges qué no automatizar." },
        { number: "02", title: "Diseñar", text: "Entiendes componentes, datos, conexiones, riesgos y retorno antes de comprometer inversión." },
        { number: "03", title: "Construir", text: "Validas sin código, escalas con n8n y preparas operación, métricas y mantenimiento." },
      ],
    },
    outcome: {
      kicker: "De entusiasmo a decisión",
      title: "El objetivo no es tener un agente. Es resolver un proceso que justifique tenerlo.",
      before: "Herramientas elegidas por moda, procesos difusos y expectativas imposibles de medir.",
      after: "Un caso priorizado, una arquitectura entendible y criterios claros para construir o delegar.",
    },
  },
  "ebook:creacion-de-webs-con-ia": {
    stats: [
      { value: "70", label: "páginas" },
      { value: "16", label: "capítulos" },
      { value: "3", label: "partes" },
      { value: "1", label: "proyecto real" },
    ],
    inside: {
      kicker: "Mira el producto por dentro",
      title: "No compras teoría sobre IA. Compras una construcción real, documentada de principio a fin.",
      description: "Cada parte convierte una decisión abstracta en un paso ejecutable: qué pedir, qué revisar y cómo saber si el resultado está listo para avanzar.",
    },
    previews: [
      { src: "/ebooks/previews/creacion-webs/indice.webp", alt: "Página real del índice del ebook Creación de Webs con IA", label: "El mapa completo", detail: "16 capítulos organizados en tres partes.", width: 923, height: 1305 },
      { src: "/ebooks/previews/creacion-webs/metodologia-8-iteraciones.webp", alt: "Página real sobre la metodología de ocho iteraciones del ebook", label: "Un método ejecutable", detail: "Ocho fases con checkpoints y verificación.", width: 923, height: 1305 },
      { src: "/ebooks/previews/creacion-webs/proyecto-appflow.webp", alt: "Página real del proyecto AppFlow desarrollado en el ebook", label: "Código y decisiones reales", detail: "AppFlow pasa del setup al MVP visual.", width: 923, height: 1305 },
      { src: "/ebooks/previews/creacion-webs/seo-core-web-vitals.webp", alt: "Página real del capítulo de SEO y Core Web Vitals del ebook", label: "Lanzamiento verificable", detail: "SEO, rendimiento y métricas explicadas con criterio.", width: 923, height: 1305 },
    ],
    journey: {
      kicker: "La ruta del libro",
      title: "De una idea vaga a un sitio publicado y medible.",
      steps: [
        { number: "01", title: "Fundamentos", text: "Defines dirección de arte, arquitectura y prompting antes de generar componentes." },
        { number: "02", title: "Proyecto AppFlow", text: "Construyes una landing real durante ocho iteraciones documentadas, del setup al producto verificado." },
        { number: "03", title: "Lanzamiento", text: "Cierras con formularios, SEO, Core Web Vitals, deploy, analítica, testing y legal básico." },
      ],
    },
    outcome: {
      kicker: "El valor está en el criterio",
      title: "El objetivo no es que Claude haga una web. Es que tú puedas dirigir el resultado.",
      before: "Prompts sueltos, decisiones improvisadas y una landing que se parece a todas.",
      after: "Un proceso de ocho iteraciones para diseñar, construir, verificar y publicar con intención.",
    },
  },
};
