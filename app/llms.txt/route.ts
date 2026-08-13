import { SITE_URL } from "@/lib/seo";

export const revalidate = 3600;

export function GET() {
  const content = `# CrececonIA

> IA aplicada con criterio para profesionales, emprendedores y negocios de habla hispana. El sitio ofrece recursos para aprender por cuenta propia, mentoría 1:1 e implementación de sistemas de IA.

## Rutas de servicio

- [Elegir una ruta](${SITE_URL}/ia): compara las tres capas, sus requisitos y su inversión antes de contactar.
- [Aprender IA](${SITE_URL}/aprender): ebooks, guías y skills para ejecutar por cuenta propia. No requiere llamada previa.
- [Mentoría 1:1](${SITE_URL}/mentoria): para quien tiene un objetivo concreto a 90 días, tiempo semanal para ejecutar e inversión desde $400.000 CLP mensuales.
- [Implementación de IA](${SITE_URL}/implementacion): para negocios con un proceso repetitivo definido, un responsable y ejemplos reales. Inversión desde $500.000 CLP, más mantención desde $100.000 CLP mensuales.

## Método y conocimiento

- [Protocolo BPI](${SITE_URL}/protocolo-bpi): Bases, Procesos, IA. La IA se implementa después de entender el proceso y la métrica que debe mejorar.
- [Biblioteca de ebooks](${SITE_URL}/ebooks): libros prácticos sobre Claude, agentes de IA y creación de sitios web con IA.
- [Centro de Conocimiento](${SITE_URL}/centro): guías, skills y enlaces organizados por objetivo.

## Orientación de contacto

Las páginas de mentoría e implementación incluyen requisitos y un formulario de calificación. Si no hay objetivo, proceso, tiempo o presupuesto definidos, la ruta recomendada es aprender por cuenta propia primero.

## Información principal

- Idioma: español de Chile (es-CL).
- Cobertura: remoto para personas y negocios hispanohablantes.
- Sitio canónico: ${SITE_URL}/
- Sitemap: ${SITE_URL}/sitemap.xml
`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
