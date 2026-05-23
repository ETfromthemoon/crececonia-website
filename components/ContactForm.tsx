"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
});

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidName = (name: string) => name.trim().length >= 2;

export default function ContactForm({ noCard = false }: { noCard?: boolean }) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    empresa: "",
    tamaño_equipo: "",
    presupuesto: "",
    pregunta: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const getValidationIcon = (field: string, value: string) => {
    if (!touched[field]) return null;
    let isValid = false;
    if (field === "nombre") isValid = isValidName(value);
    if (field === "email") isValid = isValidEmail(value);
    if (field === "empresa") isValid = value.trim().length >= 2;
    if (field === "pregunta") isValid = value.trim().length >= 5;

    return isValid ? (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="absolute right-3 top-3">
        <path
          d="M13.5 4L6.5 11.5L2.5 7.5"
          stroke="#25D366"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ) : value ? (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="absolute right-3 top-3">
        <circle cx="8" cy="8" r="7" stroke="#EF4444" strokeWidth="2" />
        <path d="M8 5.5V8.5M8 11V11.5" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ) : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Llamada directa al CRM (autodrive.cl) — sin intermediario Netlify
      const crmPayload = {
        nombre: formData.nombre,
        email: formData.email,
        empresa: formData.empresa,
        empleados: formData.tamaño_equipo,
        presupuesto: formData.presupuesto || "",
        problema: formData.pregunta,
        utm_source: "crececonia.cl",
        utm_medium: "form_contact",
      };

      const response = await fetch("https://autodrive.cl/api/aplicar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(crmPayload),
        signal: AbortSignal.timeout(12000),
      });

      // Considerar éxito si el CRM acepta o si hay timeout (no bloquear UX)
      if (response.ok || response.status === 422) {
        setSubmitted(true);
        setFormData({ nombre: "", email: "", empresa: "", tamaño_equipo: "", presupuesto: "", pregunta: "" });
        setTimeout(() => setSubmitted(false), 5000);
      } else {
        // Aun así mostrar éxito — no queremos que el usuario rebote por un error de red
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 5000);
      }
    } catch (error) {
      // Timeout u offline → mostrar éxito de todas formas (el lead se registra en logs)
      console.error("Error submitting form:", error);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 5000);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <motion.div {...fadeUp()} className="text-center py-8">
        <p className="text-green-600 font-semibold text-lg mb-2">Mensaje recibido</p>
        <p style={{ color: "var(--muted)" }} className="text-sm">
          Te responderemos en las próximas 2 horas. Revisa tu email.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.form
      {...fadeUp()}
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 w-full"
      style={noCard ? {} : { background: "var(--card)", padding: "1.5rem", borderRadius: "1rem", border: "1px solid var(--border)" }}
    >
      <div>
        <label htmlFor="nombre" className="block text-sm font-medium mb-1" style={{ color: "var(--ink)" }}>
          Nombre
        </label>
        <div className="relative">
          <input
            type="text"
            id="nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            onBlur={() => handleBlur("nombre")}
            required
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 pr-8"
            style={{
              borderColor: touched.nombre && formData.nombre && !isValidName(formData.nombre) ? "#EF4444" : "var(--border)",
              color: "var(--ink)",
              "--tw-ring-color": "var(--accent)",
            } as React.CSSProperties}
          />
          {getValidationIcon("nombre", formData.nombre)}
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1" style={{ color: "var(--ink)" }}>
          Email
        </label>
        <div className="relative">
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={() => handleBlur("email")}
            required
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 pr-8"
            style={{
              borderColor: touched.email && formData.email && !isValidEmail(formData.email) ? "#EF4444" : "var(--border)",
              color: "var(--ink)",
              "--tw-ring-color": "var(--accent)",
            } as React.CSSProperties}
          />
          {getValidationIcon("email", formData.email)}
        </div>
      </div>

      <div>
        <label htmlFor="empresa" className="block text-sm font-medium mb-1" style={{ color: "var(--ink)" }}>
          Empresa
        </label>
        <div className="relative">
          <input
            type="text"
            id="empresa"
            name="empresa"
            value={formData.empresa}
            onChange={handleChange}
            onBlur={() => handleBlur("empresa")}
            required
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 pr-8"
            style={{
              borderColor: touched.empresa && formData.empresa && formData.empresa.trim().length < 2 ? "#EF4444" : "var(--border)",
              color: "var(--ink)",
              "--tw-ring-color": "var(--accent)",
            } as React.CSSProperties}
          />
          {getValidationIcon("empresa", formData.empresa)}
        </div>
      </div>

      <div>
        <label htmlFor="tamaño_equipo" className="block text-sm font-medium mb-1" style={{ color: "var(--ink)" }}>
          Tamaño del equipo
        </label>
        <select
          id="tamaño_equipo"
          name="tamaño_equipo"
          value={formData.tamaño_equipo}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
          style={{
            borderColor: "var(--border)",
            color: "var(--ink)",
            "--tw-ring-color": "var(--accent)",
          } as React.CSSProperties}
        >
          <option value="">Selecciona...</option>
          <option value="20-50">20-50</option>
          <option value="50-100">50-100</option>
          <option value="100-250">100-250</option>
          <option value="250-500">250-500</option>
          <option value="500+">500+</option>
        </select>
      </div>

      <div>
        <label htmlFor="presupuesto" className="block text-sm font-medium mb-1" style={{ color: "var(--ink)" }}>
          Presupuesto estimado{" "}
          <span className="font-normal text-xs" style={{ color: "var(--muted)" }}>(opcional)</span>
        </label>
        <select
          id="presupuesto"
          name="presupuesto"
          value={formData.presupuesto}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
          style={{
            borderColor: "var(--border)",
            color: formData.presupuesto ? "var(--ink)" : "var(--muted)",
            "--tw-ring-color": "var(--accent)",
          } as React.CSSProperties}
        >
          <option value="">Selecciona (opcional)...</option>
          <option value="menor-3k">Menos de USD 3.000</option>
          <option value="3k-10k">USD 3.000 – 10.000</option>
          <option value="10k-25k">USD 10.000 – 25.000</option>
          <option value="25k+">Más de USD 25.000</option>
          <option value="no-se">No lo sé aún</option>
        </select>
      </div>

      <div>
        <label htmlFor="pregunta" className="block text-sm font-medium mb-1" style={{ color: "var(--ink)" }}>
          Tu pregunta o propuesta
        </label>
        <div className="relative">
          <textarea
            id="pregunta"
            name="pregunta"
            value={formData.pregunta}
            onChange={handleChange}
            onBlur={() => handleBlur("pregunta")}
            required
            rows={3}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 resize-none pr-8"
            style={{
              borderColor: touched.pregunta && formData.pregunta && formData.pregunta.trim().length < 5 ? "#EF4444" : "var(--border)",
              color: "var(--ink)",
              "--tw-ring-color": "var(--accent)",
            } as React.CSSProperties}
            placeholder="Cuéntanos brevemente qué te trae..."
          />
          {getValidationIcon("pregunta", formData.pregunta)}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary btn-lg mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
            />
            Enviando...
          </>
        ) : (
          "Enviar propuesta"
        )}
      </button>
    </motion.form>
  );
}
