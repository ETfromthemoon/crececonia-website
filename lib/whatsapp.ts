const WA_PHONE = "56961945206";

const MESSAGES: Record<string, string> = {
  nav: "Hola, me interesa el diagnóstico gratuito de CrececonIA.",
  "hero-primary": "Hola, me interesa el diagnóstico gratuito de CrececonIA.",
  "svc-audit": "Hola, quiero empezar con la Auditoría de IA.",
  "svc-impl": "Hola, quiero más información sobre la Implementación completa.",
  "final-primary": "Hola, me gustaría agendar el diagnóstico gratuito de 30 minutos.",
  sticky: "Hola, me interesa el diagnóstico gratuito de CrececonIA.",
};

export function waUrl(source: keyof typeof MESSAGES): string {
  const text = encodeURIComponent(MESSAGES[source] ?? MESSAGES.nav);
  return `https://wa.me/${WA_PHONE}?text=${text}`;
}
