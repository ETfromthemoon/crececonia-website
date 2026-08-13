"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { whatsappUrl } from "@/lib/contact";

const API = "https://autodrive.cl";

type Message = {
  id: string;
  role: "user" | "bot";
  content: string;
  sugerir_evaluacion?: boolean;
  lead_capturado?: boolean;
  fallback?: boolean;
};

// Alineadas con lo que la landing realmente vende (agente IA en 48h, USD
// 297/mes). Antes preguntaban por el "Protocolo BPI" y el "Test de Fit",
// términos que la landing no menciona ni explica en ninguna parte — el
// visitante abría el chat y lo primero que veía era un producto del que
// nunca oyó hablar.
const QUICK_REPLIES = [
  "¿Cuánto cuesta?",
  "¿Sirve para mi negocio?",
  "¿En cuánto tiempo está listo?",
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

const SALUDO_FALLBACK =
  "¡Hola! Soy el asistente de CrececonIA 👋 Puedo contarte cómo funciona un agente IA para tu negocio, cuánto cuesta y en cuánto tiempo queda listo.";

export default function ChatWidget() {
  const pathname = usePathname();
  const [open, setOpen]           = useState(false);
  const [messages, setMessages]   = useState<Message[]>([]);
  const [input, setInput]         = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

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

  // Una sola función para abrir sesión: antes initSession y resetChat tenían
  // el mismo fetch y el mismo fallback duplicados línea por línea.
  const startSession = useCallback(async () => {
    setMessages([]);
    setInput("");
    setSessionId(null);
    setWhatsappMessage("");
    try {
      const r = await fetch(`${API}/api/public/widget/inicio`, {
        method: "POST",
        signal: AbortSignal.timeout(10000),
      });
      if (!r.ok) throw new Error("No se pudo iniciar el chat");
      const j = await r.json();
      if (!j.session_id || !j.mensaje) throw new Error("Respuesta de chat incompleta");
      setSessionId(j.session_id);
      setMessages([{ id: "init", role: "bot", content: j.mensaje }]);
    } catch {
      setMessages([{ id: "init", role: "bot", content: SALUDO_FALLBACK, fallback: true }]);
    }
  }, []);

  const handleOpen = () => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (!sessionId) {
      startSession();
    }
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: trimmed };

    if (!sessionId) {
      setWhatsappMessage(trimmed);
      setMessages((prev) => [
        ...prev,
        userMsg,
        {
          id: `f-${Date.now()}`,
          role: "bot",
          fallback: true,
          content: "No pudimos conectar el asistente en este momento. Puedes continuar por WhatsApp con tu consulta preparada.",
        },
      ]);
      setInput("");
      return;
    }

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const r = await fetch(`${API}/api/public/widget/mensaje`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, mensaje: trimmed }),
        signal: AbortSignal.timeout(20000),
      });
      if (!r.ok) throw new Error("No se pudo enviar el mensaje");
      const j = await r.json();
      const botMsg: Message = {
        id:                  `b-${Date.now()}`,
        role:                "bot",
        content:             j.respuesta || "No pude interpretar eso. Intenta de nuevo o escríbenos por WhatsApp.",
        sugerir_evaluacion:  j.sugerir_evaluacion,
        lead_capturado:      j.lead_capturado,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setSessionId(null);
      setWhatsappMessage(trimmed);
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: "bot",
          fallback: true,
          content: "No pudimos completar esa respuesta. Puedes continuar por WhatsApp con tu consulta preparada.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const showQuickReplies = messages.length === 1 && !loading;
  const directChatUrl = whatsappUrl(
    whatsappMessage
      ? `Hola, vengo del chat de CrececonIA. Mi consulta es: ${whatsappMessage}`
      : "Hola, vengo del chat de CrececonIA y quiero orientación.",
  );

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

                  {/* CTA cuando el bot detecta intención de compra. Va al
                      mismo WhatsApp que el resto de la landing: antes abría
                      el formulario de 3 pasos del Protocolo BPI, que es otro
                      producto y otro embudo. */}
                  {m.sugerir_evaluacion && (
                    <motion.a
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      href={directChatUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 text-xs px-3 py-2 transition-opacity hover:opacity-80"
                      style={{
                        background: "rgba(198,219,112,0.12)",
                        border: "1px solid rgba(198,219,112,0.35)",
                        color: "#c6db70",
                        borderRadius: 9,
                        fontWeight: 500,
                      }}
                    >
                      Quiero mi agente IA →
                    </motion.a>
                  )}

                  {m.fallback && (
                    <motion.a
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      href={directChatUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 text-xs px-3 py-2 transition-opacity hover:opacity-80"
                      style={{
                        background: "rgba(198,219,112,0.12)",
                        border: "1px solid rgba(198,219,112,0.35)",
                        color: "#c6db70",
                        borderRadius: 9,
                        fontWeight: 500,
                      }}
                    >
                      Continuar por WhatsApp →
                    </motion.a>
                  )}

                  {/* Confirmación lead capturado */}
                  {m.lead_capturado && !m.sugerir_evaluacion && (
                    <span
                      className="text-[11px] mt-1"
                      style={{ color: "#aeb4bf", fontFamily: "var(--font-mono)" }}
                    >
                      ✓ contacto guardado
                    </span>
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
                placeholder="Escribe tu pregunta…"
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
