"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useEvaluacion } from "./EvaluacionProvider";

const API = "https://autodrive.cl";

type Message = {
  id: string;
  role: "user" | "bot";
  content: string;
  sugerir_evaluacion?: boolean;
  lead_capturado?: boolean;
};

const QUICK_REPLIES = [
  "¿Qué servicios ofrecen?",
  "¿Cuánto cuesta?",
  "¿Cómo funciona el diagnóstico?",
  "Quiero evaluar mi empresa",
];

const TypingDots = () => (
  <div className="flex gap-1 items-center px-3 py-2.5">
    {[0, 150, 300].map((d) => (
      <span
        key={d}
        className="w-1.5 h-1.5 rounded-full animate-bounce"
        style={{ background: "var(--ash)", animationDelay: `${d}ms` }}
      />
    ))}
  </div>
);

export default function ChatWidget() {
  const [open, setOpen]           = useState(false);
  const [messages, setMessages]   = useState<Message[]>([]);
  const [input, setInput]         = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);
  const [unread, setUnread]       = useState(false);
  const [initDone, setInitDone]   = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const { abrir } = useEvaluacion();

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setUnread(false);
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [open]);

  const initSession = useCallback(async () => {
    if (initDone) return;
    setInitDone(true);
    try {
      const r = await fetch(`${API}/api/public/widget/inicio`, { method: "POST" });
      const j = await r.json();
      setSessionId(j.session_id);
      setMessages([{ id: "init", role: "bot", content: j.mensaje }]);
    } catch {
      setMessages([{
        id: "init",
        role: "bot",
        content: "¡Hola! Soy el asistente de CrececonIA 👋 ¿En qué te puedo ayudar hoy?",
      }]);
    }
  }, [initDone]);

  const handleOpen = () => {
    setOpen(true);
    if (!initDone) initSession();
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: trimmed };
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
      const j = await r.json();
      const botMsg: Message = {
        id:                  `b-${Date.now()}`,
        role:                "bot",
        content:             j.respuesta,
        sugerir_evaluacion:  j.sugerir_evaluacion,
        lead_capturado:      j.lead_capturado,
      };
      setMessages((prev) => [...prev, botMsg]);
      if (!open) setUnread(true);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `e-${Date.now()}`, role: "bot", content: "Disculpa, hubo un error. Intenta de nuevo." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const showQuickReplies = messages.length === 1 && !loading;

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
            className="fixed z-[60] w-[92vw] sm:w-[380px]"
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
                background: "linear-gradient(90deg, transparent, var(--champagne), transparent)",
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
                  style={{ background: "#4ADE80", boxShadow: "0 0 6px #4ADE80" }}
                />
                <span className="text-sm font-medium" style={{ color: "var(--bone)" }}>
                  Crececon<em style={{ color: "var(--champagne)", fontStyle: "italic" }}>IA</em>
                </span>
                <span
                  className="text-[11px] px-1.5 py-0.5 rounded"
                  style={{
                    color: "var(--champagne)",
                    background: "rgba(217,179,106,0.08)",
                    border: "1px solid rgba(217,179,106,0.15)",
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  Asistente
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 flex items-center justify-center text-lg leading-none transition-opacity hover:opacity-60"
                style={{ color: "var(--smoke)" }}
                aria-label="Cerrar chat"
              >
                ×
              </button>
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
                          ? "var(--champagne)"
                          : "rgba(255,255,255,0.055)",
                      color: m.role === "user" ? "var(--obsidian)" : "var(--ash)",
                      borderRadius:
                        m.role === "user"
                          ? "12px 12px 3px 12px"
                          : "12px 12px 12px 3px",
                    }}
                  >
                    {m.content}
                  </div>

                  {/* CTA evaluación */}
                  {m.sugerir_evaluacion && (
                    <motion.button
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => { setOpen(false); abrir("chat-widget"); }}
                      className="mt-2 text-xs px-3 py-2 transition-opacity hover:opacity-80"
                      style={{
                        background: "rgba(217,179,106,0.12)",
                        border: "1px solid rgba(217,179,106,0.35)",
                        color: "var(--champagne)",
                        borderRadius: 4,
                        fontWeight: 500,
                      }}
                    >
                      Hacer el diagnóstico gratuito →
                    </motion.button>
                  )}

                  {/* Confirmación lead capturado */}
                  {m.lead_capturado && !m.sugerir_evaluacion && (
                    <span
                      className="text-[11px] mt-1"
                      style={{ color: "var(--smoke)", fontFamily: "var(--font-mono)" }}
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
                        border: "1px solid rgba(217,179,106,0.25)",
                        color: "var(--champagne)",
                        borderRadius: 4,
                        background: "rgba(217,179,106,0.07)",
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
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--smoke)]"
                style={{ color: "var(--bone)" }}
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
                  background: "var(--champagne)",
                  borderRadius: 6,
                }}
                aria-label="Enviar"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="var(--obsidian)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13" /><path d="M22 2L15 22 11 13 2 9l20-7z" />
                </svg>
              </button>
            </div>

            {/* Branding pie */}
            <div
              className="text-center pb-2"
              style={{ color: "var(--smoke)", fontSize: 10, opacity: 0.5, fontFamily: "var(--font-mono)" }}
            >
              crececonia.cl
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Botón flotante ─────────────────────────────────────────────── */}
      <motion.button
        onClick={handleOpen}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.93 }}
        className="fixed z-[61] flex items-center justify-center shadow-2xl"
        style={{
          bottom: 16,
          right: 16,
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: open ? "var(--carbon)" : "var(--champagne)",
          border: "1px solid rgba(217,179,106,0.45)",
          boxShadow: open
            ? "0 4px 20px rgba(0,0,0,0.4)"
            : "0 4px 24px rgba(217,179,106,0.35)",
          transition: "background 0.2s, box-shadow 0.2s",
        }}
        aria-label={open ? "Cerrar chat" : "Abrir chat de ayuda"}
      >
        {/* Badge no leídos */}
        <AnimatePresence>
          {unread && !open && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white font-bold"
              style={{ background: "#EF4444", fontSize: 9 }}
            >
              1
            </motion.span>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {open ? (
            <motion.svg
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              width="18" height="18" viewBox="0 0 24 24"
              fill="none" stroke="var(--champagne)" strokeWidth="2.5" strokeLinecap="round"
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
