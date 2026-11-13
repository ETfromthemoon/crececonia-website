export type DemoBook = {
  slug: string;
  title: string;
  subtitle: string;
  author: string;
  category: "ia" | "tecnologia" | "negocios";
  price: number;
  pages: number;
  level: string;
  description: string;
  outcomes: string[];
  chapters: string[];
  cover: string;
  mark: string;
};

/** Fictional preview content. Never use these records for an order or delivery. */
export const DEMO_BOOKS: DemoBook[] = [
  {
    slug: "demo-ia-para-equipos", title: "IA para equipos", subtitle: "De la curiosidad a la implementación",
    author: "Andrea Muñoz", category: "ia", price: 11900, pages: 128, level: "Inicial", cover: "violet", mark: "01 / IA",
    description: "Una ruta de cuatro semanas para descubrir tareas repetitivas, diseñar asistentes útiles y medir el tiempo recuperado sin perder criterio humano.",
    outcomes: ["Detectar oportunidades de automatización", "Crear un primer asistente de equipo", "Medir adopción y resultados"],
    chapters: ["Dónde comenzar", "Mapa de tareas", "Prompts compartidos", "Asistentes con contexto", "Medición y mejora"],
  },
  {
    slug: "demo-negocios-con-datos", title: "Negocios con datos", subtitle: "Decisiones más claras con la información que ya tienes",
    author: "Diego Fuentes", category: "negocios", price: 9900, pages: 96, level: "Inicial", cover: "lime", mark: "02 / NEGOCIOS",
    description: "Convierte hojas dispersas y métricas sueltas en un tablero de decisiones que tu equipo sí puede usar cada semana.",
    outcomes: ["Elegir métricas que importan", "Crear un tablero simple", "Tomar decisiones con evidencia"],
    chapters: ["Preguntas antes que gráficos", "Fuentes de datos", "Indicadores útiles", "Rituales de decisión", "Errores comunes"],
  },
  {
    slug: "demo-automatiza-sin-codigo", title: "Automatiza sin código", subtitle: "Flujos pequeños que liberan horas cada semana",
    author: "Valentina Soto", category: "tecnologia", price: 14900, pages: 154, level: "Intermedio", cover: "blue", mark: "03 / TECNOLOGÍA",
    description: "Aprende a conectar formularios, bases de datos y alertas para crear operaciones confiables y fáciles de mantener.",
    outcomes: ["Diseñar flujos confiables", "Detectar fallas antes del cliente", "Documentar y delegar automatizaciones"],
    chapters: ["Diseñar el flujo", "Datos de entrada", "Conexiones", "Manejo de errores", "Operación continua"],
  },
  {
    slug: "demo-producto-con-ia", title: "Producto con IA", subtitle: "De la idea a una experiencia que resuelve un problema",
    author: "Tomás Herrera", category: "ia", price: 16900, pages: 182, level: "Avanzado", cover: "peach", mark: "04 / IA",
    description: "Una guía para validar una oportunidad, diseñar el recorrido y evaluar un producto de IA antes de escalarlo.",
    outcomes: ["Validar el problema", "Diseñar una experiencia completa", "Definir calidad y seguimiento"],
    chapters: ["La oportunidad", "Investigación", "Prototipo", "Evaluación", "Lanzamiento responsable"],
  },
];

export function getDemoBook(slug: string): DemoBook | undefined {
  return DEMO_BOOKS.find((book) => book.slug === slug);
}
