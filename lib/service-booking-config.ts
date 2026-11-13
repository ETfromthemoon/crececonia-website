import "server-only";

const services = ["mentoria", "implementacion"] as const;
export type BookingCheck = { field: string; label: string; valid: boolean };
export type BookingPreparation = {
  state: "disabled" | "configuration_pending" | "integration_pending";
  canBook: false; malformed: boolean; checks: BookingCheck[];
};
const object = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
const text = (value: unknown) => typeof value === "string" && value.trim().length > 0 && value.length <= 1000;
const integer = (value: unknown, min: number, max: number) => typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;
const keys = (value: Record<string, unknown>, allowed: string[]) => Object.keys(value).every(key => allowed.includes(key));
function zone(value: unknown): boolean {
  if (typeof value !== "string" || !(value === "UTC" || /^[A-Za-z_]+(?:\/[A-Za-z0-9_+-]+)+$/.test(value))) return false;
  try { new Intl.DateTimeFormat("es-CL", { timeZone: value }); return true; } catch { return false; }
}
const minute = (value: unknown): number | null => {
  if (typeof value !== "string" || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)) return null;
  return Number(value.slice(0, 2)) * 60 + Number(value.slice(3));
};
function windows(value: unknown, duration: unknown, buffer: unknown): boolean {
  if (!Array.isArray(value) || !value.length || value.length > 100 || !integer(duration, 1, 1440) || !integer(buffer, 0, 1440)) return false;
  const parsed: { day: number; start: number; end: number }[] = [];
  for (const item of value) {
    const row = object(item);
    if (!row || !keys(row, ["day", "start", "end"]) || !integer(row.day, 0, 6)) return false;
    const start = minute(row.start), end = minute(row.end);
    if (start === null || end === null || end - start < (duration as number) + (buffer as number)) return false;
    parsed.push({ day: row.day as number, start, end });
  }
  parsed.sort((a, b) => a.day - b.day || a.start - b.start);
  return parsed.every((row, i) => !i || row.day !== parsed[i - 1].day || row.start >= parsed[i - 1].end);
}

// Return only field names and validity, never configured identifiers or raw parse errors.
export function inspectBookingPreparation(raw: string | undefined): BookingPreparation {
  let config: Record<string, unknown> = {};
  let malformed = false;
  if (raw) {
    try {
      if (raw.length > 32000) throw new Error();
      const parsed = object(JSON.parse(raw));
      if (!parsed || !keys(parsed, ["enabled", "provider", "calendarId", "timeZone", "services"])) throw new Error();
      config = parsed;
    } catch { malformed = true; }
  }
  const checks: BookingCheck[] = [];
  const check = (field: string, label: string, valid: boolean) => checks.push({ field, label, valid });
  check("enabled", "Decisión explícita de habilitación", typeof config.enabled === "boolean");
  check("provider", "Proveedor de calendario", text(config.provider));
  check("calendarId", "Calendario comercial", text(config.calendarId));
  check("timeZone", "Zona horaria IANA", zone(config.timeZone));
  const configs = object(config.services) ?? {};
  if (config.services !== undefined && !object(config.services)) malformed = true;
  if (!keys(configs, [...services])) malformed = true;
  for (const service of services) {
    const prefix = service === "mentoria" ? "Mentoría" : "Implementación";
    const row = object(configs[service]) ?? {};
    if (configs[service] !== undefined && !object(configs[service])) malformed = true;
    if (!keys(row, ["durationMinutes", "bufferMinutes", "minimumNoticeMinutes", "horizonDays", "cancellationPolicy", "windows"])) malformed = true;
    check(`${service}.duration`, `${prefix}: duración`, integer(row.durationMinutes, 1, 1440));
    check(`${service}.buffer`, `${prefix}: separación posterior`, integer(row.bufferMinutes, 0, 1440));
    check(`${service}.notice`, `${prefix}: antelación mínima`, integer(row.minimumNoticeMinutes, 0, 525600));
    check(`${service}.horizon`, `${prefix}: horizonte de reservas`, integer(row.horizonDays, 1, 366)
      && integer(row.minimumNoticeMinutes, 0, 525600) && (row.minimumNoticeMinutes as number) < (row.horizonDays as number) * 1440);
    check(`${service}.cancellation`, `${prefix}: política de cancelación`, text(row.cancellationPolicy));
    check(`${service}.windows`, `${prefix}: ventanas semanales válidas`, windows(row.windows, row.durationMinutes, row.bufferMinutes));
  }
  return { state: config.enabled === false ? "disabled" : !malformed && checks.every(check => check.valid) ? "integration_pending" : "configuration_pending",
    canBook: false, malformed, checks };
}
