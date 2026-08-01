import { describe, it, expect } from "vitest";
import { FLOW_GETSTATUS_PAGADO, flowGetStatus } from "./fixtures/flow-getstatus";

/**
 * Guarda del contrato de Flow. No prueba nuestro código: protege el fixture
 * del que dependen los demás tests.
 *
 * Si alguien "arregla" el fixture agregando un campo `email` (que es la
 * suposición intuitiva y equivocada), estos tests fallan y lo obligan a
 * revisar la realidad antes de romper la entrega en producción otra vez.
 *
 * Para verificar el contrato contra la API real de Flow (por si Flow cambia
 * los nombres de sus campos), correr `npm run flow:contract`.
 */
describe("contrato de getStatus de Flow", () => {
  it("el email del comprador viene en 'payer' y NO existe un campo 'email'", () => {
    expect(FLOW_GETSTATUS_PAGADO).toHaveProperty("payer");
    expect(FLOW_GETSTATUS_PAGADO).not.toHaveProperty("email");
  });

  it("amount viene como string, no como number", () => {
    expect(typeof FLOW_GETSTATUS_PAGADO.amount).toBe("string");
  });

  it("status 2 es 'pagada' — el único estado que gatilla la entrega", () => {
    expect(FLOW_GETSTATUS_PAGADO.status).toBe(2);
  });

  it("el helper conserva el shape real al variar status y monto", () => {
    const res = flowGetStatus({ status: 1, amount: 27000 });
    expect(res.status).toBe(1);
    expect(res.amount).toBe("27000");
    expect(res).toHaveProperty("payer");
    expect(res).not.toHaveProperty("email");
    expect(Object.keys(res).sort()).toEqual(Object.keys(FLOW_GETSTATUS_PAGADO).sort());
  });

  it("payer: null simula que Flow omite el campo (el caso que rompió la entrega)", () => {
    const res = flowGetStatus({ payer: null });
    expect(res).not.toHaveProperty("payer");
  });
});
