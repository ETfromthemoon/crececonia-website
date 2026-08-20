"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { whatsappUrl } from "@/lib/contact";
import { trackEvent } from "@/lib/analytics";

type Message = {
  id: string;
  role: "user" | "bot";
  content: string;
  nextStep?: NextStep;
};

type NextStep = "ebooks" | "mentoria" | "implementacion" | "web" | "whatsapp" | "selector";

// Basadas en SVC-IA de OPS. El widget ayuda a orientar el caso, pero no
// aprueba alcance ni reemplaza la revisión comercial o de seguridad.
const QUICK_REPLIES = [
  "Quiero aprender por mi cuenta",
  "Necesito mentoría y dirección",
  "Quiero mejorar un proceso",
  "Necesito una web informativa",
];

const TypingDots = () => (
  <div className="flex gap-1 items-center px-3 py-2.5">
    {[0, 160, 320].map((d) => (
      <span
        key={d}
        className="typing-dot w-1.5 h-1.5 rounded-full"
        style={{ background: "#c3c8d0", animationDelay: `${d}ms` }}
      />
    ))}
  </div>
);

const INITIAL_MESSAGE =
  "¡Hola! Soy el orientador de CrececonIA 👋 Te ayudo a elegir el siguiente paso: aprender por tu cuenta, mentoría, implementación de IA o una web informativa. Cuéntame qué necesitas lograr.";

function buildReply(message: string): Pick<Message, "content" | "nextStep"> {
  const text = message.toLocaleLowerCase("es-CL");

  if (/(dato sensible|salud|banco|financ|pagar|borrar|publicar|administrador|credencial|permiso)/.test(text)) {
    return {
      content:
        "Por los datos o acciones involucradas, este caso requiere una revisión especial. No compartas credenciales por aquí: cualquier propuesta debe definir permisos mínimos, controles humanos, pruebas y aprobación antes de producción.",
      nextStep: "whatsapp",
    };
  }

  if (/(ebook|e-book|libro|gu[ií]a|skill|aprender por mi cuenta|autodidact|curso|material)/.test(text)) {
    return {
      content:
        "Para avanzar de forma autónoma, la biblioteca reúne ebooks, guías y skills aplicables. Elige el recurso según tu objetivo y nivel; no requiere llamada previa.",
      nextStep: "ebooks",
    };
  }

  if (/(mentor[ií]a|mentor|acompa[nñ]amiento|clases|roadmap|aprender conmigo|direcci[oó]n)/.test(text)) {
    return {
      content:
        "La mentoría es para quien quiere aprender y ejecutar con un roadmap propio. Incluye cuatro clases personalizadas mensuales, ejercicios, feedback y seguimiento; tú mantienes la responsabilidad de aplicar el trabajo entre sesiones.",
      nextStep: "mentoria",
    };
  }

  if (/(p[aá]gina web|sitio web|landing|web corporativa|dominio|dise[nñ]ar mi web|hacer una web)/.test(text)) {
    return {
      content:
        "Podemos evaluar una landing o web corporativa informativa. El servicio incluye diseño, desarrollo, texto basado en tus activos, dos rondas de revisión y entrega; ecommerce, logins, reservas e integraciones no aprobadas se evalúan aparte.",
      nextStep: "web",
    };
  }

  if (/(cu[aá]nto|precio|costo|vale|valor|presupuesto)/.test(text)) {
    return {
      content:
        "Depende de la vía: mentoría cuesta 397.000 CLP netos más IVA por ciclo mensual; el diagnóstico BPI, 200.000 CLP netos más IVA. Una implementación se cotiza por alcance y la operación según sistemas, criticidad y SLA. Los ebooks muestran su precio final en la biblioteca.",
      nextStep: "selector",
    };
  }

  if (/(operaci[oó]n|mantenci[oó]n|mantenimiento|monitoreo|sla|soporte permanente)/.test(text)) {
    return {
      content:
        "La operación y mantención se revisan para soluciones ya entregadas que tienen responsable, runbook y una línea base. El nivel de servicio y el fee mensual se confirman según sistemas y criticidad; no se promete un SLA sin definirlo.",
      nextStep: "whatsapp",
    };
  }

  if (/(necesito|quiero|busco).{0,25}implement|implementaci[oó]n de ia|automatizar un proceso|construir una soluci[oó]n|agente|automatizaci[oó]n/.test(text)) {
    return {
      content:
        "La implementación aplica cuando existe un proceso concreto, un responsable, datos y una métrica de éxito. Primero revisamos alcance, integraciones, riesgos y controles; luego se define una propuesta con plazo, anticipo y pagos por hitos.",
      nextStep: "implementacion",
    };
  }

  if (/(cu[aá]ndo|tiempo|demora|r[aá]pido|48)/.test(text)) {
    return {
      content:
        "El diagnóstico BPI toma dos semanas desde que están completos los accesos y la información. Para implementación, el plazo se define en la propuesta porque depende del proceso, datos, sistemas, controles y pruebas requeridas.",
      nextStep: "implementacion",
    };
  }

  if (/(sirve|negocio|empresa|rubro|industria|funciona|calza|encaja|proceso|diagn[oó]stico|auditor[ií]a|hoja de ruta)/.test(text)) {
    return {
      content:
        "El diagnóstico BPI sirve para procesos manuales, fragmentados o poco observables donde hay una oportunidad concreta de automatización o asistencia. Mapeamos el proceso, priorizamos oportunidades y riesgos, estimamos el trabajo y dejamos una hoja de ruta; no compromete una implementación automática.",
      nextStep: "implementacion",
    };
  }

  if (/(whatsapp|cliente|venta|ventas|atenci[oó]n|consulta|api|integraci[oó]n|sistema)/.test(text)) {
    return {
      content:
        "Podemos evaluar una solución para ese proceso, pero primero necesitamos conocer su inicio y fin, quién es responsable, el volumen, los sistemas y datos involucrados, y qué mejora medible esperan. Las integraciones, permisos y proveedores se revisan antes de aprobar alcance.",
      nextStep: "implementacion",
    };
  }

  return {
    content:
      "Para recomendar el camino correcto, cuéntanos si quieres aprender por tu cuenta, avanzar con mentoría, mejorar un proceso con IA o crear una presencia web informativa. También puedes ver el selector de alternativas.",
    nextStep: "selector",
  };
}

export default function ChatWidget() {
  const pathname = usePathname();
  const [open, setOpen]           = useState(false);
  const [messages, setMessages]   = useState<Message[]>([]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const replyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input on open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  useEffect(() => () => {
    if (replyTimerRef.current) clearTimeout(replyTimerRef.current);
  }, []);

  // El endpoint remoto que antes iniciaba las sesiones fue retirado. El
  // recorrido es local para que abrir el widget nunca dependa de un servicio
  // ajeno al sitio ni deje al visitante en una pantalla de error.
  const startSession = useCallback(() => {
    if (replyTimerRef.current) clearTimeout(replyTimerRef.current);
    replyTimerRef.current = null;
    setMessages([]);
    setInput("");
    setLoading(false);
    setMessages([{ id: "init", role: "bot", content: INITIAL_MESSAGE }]);
    trackEvent("chat_session_started", { status: "local" });
  }, []);

  const handleOpen = () => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    trackEvent("chat_opened");
    if (messages.length === 0) {
      startSession();
    }
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: trimmed };
    trackEvent("chat_message_sent", { message_type: "free_text" });

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    replyTimerRef.current = setTimeout(() => {
      const reply = buildReply(trimmed);
      setMessages((prev) => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          role: "bot",
          ...reply,
        },
      ]);
      setLoading(false);
      trackEvent("chat_response_received", { source: "local" });
      replyTimerRef.current = null;
    }, 350);
  };

  const showQuickReplies = messages.length === 1 && !loading;
  const conversationSummary = messages
    .filter((message) => message.role === "user")
    .slice(-3)
    .map((message) => message.content)
    .join(" | ");
  const directChatUrl = whatsappUrl(
    conversationSummary
      ? `Hola, vengo del chat de CrececonIA. Mi consulta es: ${conversationSummary}`
      : "Hola, vengo del chat de CrececonIA y quiero orientación.",
  );
  const nextStepLinks: Record<NextStep, { href: string; label: string; external?: boolean }> = {
    ebooks: { href: "/ebooks", label: "Explorar ebooks y recursos" },
    mentoria: { href: "/mentoria#requisitos", label: "Ver requisitos de mentoría" },
    implementacion: { href: "/implementacion#requisitos", label: "Evaluar implementación" },
    web: { href: directChatUrl, label: "Revisar proyecto web por WhatsApp", external: true },
    whatsapp: { href: directChatUrl, label: "Revisar mi caso por WhatsApp", external: true },
    selector: { href: "/ia", label: "Ver todas las alternativas" },
  };

  if (pathname === "/ia") return null;

  return (
    <>
      {/* ── Panel del chat ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="widget-panel"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="site-chat-panel fixed z-[60] w-[92vw] sm:w-[380px]"
            role="dialog"
            aria-modal="false"
            aria-label="Asistente de CrececonIA"
            style={{
              bottom: "calc(3.5rem + 24px + 12px)", // above the FAB
              right: 16,
              background: "var(--carbon)",
              border: "1px solid rgba(217,179,106,0.18)",
              borderRadius: 10,
              boxShadow: "0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(217,179,106,0.06)",
            }}
          >
            {/* Línea dorada superior */}
            <div
              style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 1,
                background: "linear-gradient(90deg, transparent, #c6db70, #9caee3, transparent)",
                opacity: 0.5, borderRadius: "10px 10px 0 0",
              }}
            />

            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: "var(--success)", boxShadow: "0 0 6px var(--success)" }}
                />
                <span className="text-sm font-medium" style={{ color: "#f2efe8" }}>
                  Crececon<em style={{ color: "#c6db70", fontStyle: "italic" }}>IA</em>
                </span>
                <span
                  className="text-[11px] px-1.5 py-0.5 rounded"
                  style={{
                    color: "#c6db70",
                    background: "rgba(198,219,112,0.1)",
                    border: "1px solid rgba(198,219,112,0.26)",
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  Asistente
                </span>
              </div>
              <div className="flex items-center gap-1">
                {/* Reiniciar — solo visible cuando hay conversación */}
                {messages.length > 1 && (
                  <button
                    onClick={() => !loading && startSession()}
                    disabled={loading}
                    className="w-7 h-7 flex items-center justify-center transition-opacity hover:opacity-60 disabled:opacity-30"
                    style={{ color: "#aeb4bf" }}
                    aria-label="Nueva conversación"
                    title="Nueva conversación"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                      <path d="M3 3v5h5" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="w-7 h-7 flex items-center justify-center text-lg leading-none transition-opacity hover:opacity-60"
                  style={{ color: "#aeb4bf" }}
                  aria-label="Cerrar chat"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Mensajes */}
            <div
              className="overflow-y-auto flex flex-col gap-2.5 px-3 py-3"
              style={{ height: 320 }}
            >
              {messages.map((m) => (
                <div key={m.id} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
                  <div
                    className="max-w-[88%] text-sm leading-relaxed px-3 py-2"
                    style={{
                      background:
                        m.role === "user"
                          ? "#c6db70"
                          : "rgba(255,255,255,0.055)",
                      color: m.role === "user" ? "#151618" : "#d6d9df",
                      borderRadius:
                        m.role === "user"
                          ? "12px 12px 3px 12px"
                          : "12px 12px 12px 3px",
                    }}
                  >
                    {m.content}
                  </div>

                  {m.nextStep && (
                    <motion.a
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      href={nextStepLinks[m.nextStep].href}
                      target={nextStepLinks[m.nextStep].external ? "_blank" : undefined}
                      rel={nextStepLinks[m.nextStep].external ? "noopener noreferrer" : undefined}
                      onClick={() => trackEvent("chat_service_recommended", { service: m.nextStep })}
                      className="mt-2 text-xs px-3 py-2 transition-opacity hover:opacity-80"
                      style={{
                        background: "rgba(198,219,112,0.12)",
                        border: "1px solid rgba(198,219,112,0.35)",
                        color: "#c6db70",
                        borderRadius: 9,
                        fontWeight: 500,
                      }}
                    >
                      {nextStepLinks[m.nextStep].label} →
                    </motion.a>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div
                  className="max-w-[80%] self-start"
                  style={{
                    background: "rgba(255,255,255,0.055)",
                    borderRadius: "12px 12px 12px 3px",
                  }}
                >
                  <TypingDots />
                </div>
              )}

              {/* Quick replies iniciales */}
              {showQuickReplies && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-wrap gap-1.5 mt-1"
                >
                  {QUICK_REPLIES.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="text-xs px-2.5 py-1.5 transition-all hover:opacity-80 active:scale-95"
                      style={{
                        border: "1px solid rgba(156,174,227,0.3)",
                        color: "#c6db70",
                        borderRadius: 9,
                        background: "rgba(156,174,227,0.1)",
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </motion.div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div
              className="flex items-center gap-2 px-3 py-2.5"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              <input
                ref={inputRef}
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: "#f2efe8" }}
                placeholder="Cuéntanos qué necesitas lograr…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
                disabled={loading}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                className="w-8 h-8 flex-shrink-0 flex items-center justify-center transition-all disabled:opacity-30 hover:opacity-80 active:scale-90"
                style={{
                  background: "#c6db70",
                  borderRadius: 9,
                }}
                aria-label="Enviar"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="#151618" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13" /><path d="M22 2L15 22 11 13 2 9l20-7z" />
                </svg>
              </button>
            </div>

            {/* Salida a WhatsApp siempre disponible. Reemplaza el
                "crececonia.cl" que no hacía nada: si el visitante se cansa
                del bot, no tiene que buscar un CTA fuera del panel. */}
            <div className="text-center pb-2.5">
              <a
                href={directChatUrl}
                onClick={() => trackEvent("chat_whatsapp_clicked")}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity hover:opacity-100"
                style={{
                  color: "#aeb4bf",
                  fontSize: 10,
                  opacity: 0.65,
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.08em",
                }}
              >
                o hablar directo por WhatsApp →
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Botón flotante ─────────────────────────────────────────────── */}
      <motion.button
        onClick={handleOpen}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="site-chat-fab fixed z-[61] flex items-center justify-center shadow-2xl"
        style={{
          bottom: 16,
          right: 16,
          width: 52,
          height: 52,
          borderRadius: 14,
          background: open ? "#17191b" : "#c6db70",
          border: "1px solid rgba(198,219,112,0.72)",
          boxShadow: open
            ? "0 8px 24px rgba(0,0,0,0.36)"
            : "0 12px 30px rgba(198,219,112,0.22)",
          transition: "background 0.2s, box-shadow 0.2s, transform 0.2s",
        }}
        aria-label={open ? "Cerrar chat" : "Abrir chat de ayuda"}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.svg
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              width="18" height="18" viewBox="0 0 24 24"
              fill="none" stroke="#c6db70" strokeWidth="2.5" strokeLinecap="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </motion.svg>
          ) : (
            <motion.svg
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              width="20" height="20" viewBox="0 0 24 24"
              fill="none" stroke="var(--obsidian)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}
