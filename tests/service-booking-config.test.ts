import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { inspectBookingPreparation } from "@/lib/service-booking-config";
const service = { durationMinutes: 45, bufferMinutes: 15, minimumNoticeMinutes: 120, horizonDays: 14,
  cancellationPolicy: "Política sintética de prueba", windows: [{ day: 1, start: "09:00", end: "12:00" }] };
const config = { enabled: true, provider: "test-provider", calendarId: "private@example.test", timeZone: "America/Santiago",
  services: { mentoria: service, implementacion: service } };
const inspect = (value: unknown) => inspectBookingPreparation(JSON.stringify(value));
describe("booking readiness stays fail closed", () => {
  it("lists missing decisions without assigning commercial defaults", () => {
    const state = inspectBookingPreparation(undefined);
    expect(state.state).toBe("configuration_pending"); expect(state.canBook).toBe(false);
    expect(state.checks.every(check => !check.valid)).toBe(true);
  });
  it("never enables booking even with complete valid configuration", () => {
    const state = inspect(config); expect(state.state).toBe("integration_pending"); expect(state.canBook).toBe(false);
    expect(state.checks.every(check => check.valid)).toBe(true);
    expect(JSON.stringify(state)).not.toContain("private@example.test");
  });
  it("respects explicit disable and requires explicit boolean enable", () => {
    expect(inspect({ ...config, enabled: false }).state).toBe("disabled");
    expect(inspect({ ...config, enabled: "true" }).state).toBe("configuration_pending");
  });
  it.each(["{", "null", "[]", "x".repeat(32001)])("rejects malformed configuration without reflecting it", raw => {
    const state = inspectBookingPreparation(raw); expect(state.malformed).toBe(true); expect(state.canBook).toBe(false);
    expect(state.state).toBe("configuration_pending");
  });
  it("rejects unknown keys and unsupported zones", () => {
    expect(inspect({ ...config, timeZone: "UTC" }).state).toBe("integration_pending");
    expect(inspect({ ...config, accessToken: "secret" }).malformed).toBe(true);
    expect(inspect({ ...config, timeZone: "-03:00" }).state).toBe("configuration_pending");
    expect(inspect({ ...config, timeZone: "America/Imaginary" }).state).toBe("configuration_pending");
  });
  it.each([[], "private@example.test", 123, null])("rejects malformed service containers without reflecting values", services => {
    const result = inspect({ ...config, services });
    expect(result.malformed).toBe(true); expect(result.canBook).toBe(false);
    expect(JSON.stringify(result)).not.toContain("private@example.test");
    expect(inspect({ ...config, services: { mentoria: services, implementacion: service } }).malformed).toBe(true);
  });
  it.each([
    { durationMinutes: 0 }, { bufferMinutes: -1 }, { minimumNoticeMinutes: 14 * 1440 },
    { windows: [{ day: 1, start: "23:00", end: "01:00" }] },
    { windows: [{ day: 1, start: "09:00", end: "09:45" }] },
    { windows: [{ day: 1, start: "09:00", end: "12:00" }, { day: 1, start: "11:00", end: "14:00" }] },
    { windows: [{ day: 7, start: "09:00", end: "12:00" }] },
  ])("invalid service constraints block readiness %j", patch => {
    const result = inspect({ ...config, services: { ...config.services, mentoria: { ...service, ...patch } } });
    expect(result.state).toBe("configuration_pending"); expect(result.canBook).toBe(false);
  });
  it("keeps service validation independent", () => {
    const result = inspect({ ...config, services: { mentoria: service } });
    expect(result.checks.filter(c => c.field.startsWith("mentoria")).every(c => c.valid)).toBe(true);
    expect(result.checks.filter(c => c.field.startsWith("implementacion")).every(c => !c.valid)).toBe(true);
  });
});
