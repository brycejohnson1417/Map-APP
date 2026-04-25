import "server-only";

export interface PrintavoAutoSyncSettings {
  enabled: boolean;
  cadenceHours: number;
  hourUtc: number;
}

const DEFAULT_SETTINGS: PrintavoAutoSyncSettings = {
  enabled: false,
  cadenceHours: 24,
  hourUtc: 5,
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function clampHour(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_SETTINGS.hourUtc;
  }

  return Math.max(0, Math.min(23, Math.floor(value)));
}

export function resolvePrintavoAutoSyncSettings(settings: Record<string, unknown> = {}): PrintavoAutoSyncSettings {
  const automations = asRecord(settings.automations);
  const printavoDailySync = asRecord(automations.printavoDailySync);

  return {
    enabled:
      typeof printavoDailySync.enabled === "boolean" ? printavoDailySync.enabled : DEFAULT_SETTINGS.enabled,
    cadenceHours: DEFAULT_SETTINGS.cadenceHours,
    hourUtc: clampHour(printavoDailySync.hourUtc),
  };
}

export function mergePrintavoAutoSyncSettings(
  settings: Record<string, unknown>,
  patch: Partial<PrintavoAutoSyncSettings>,
) {
  const automations = asRecord(settings.automations);
  const current = resolvePrintavoAutoSyncSettings(settings);

  return {
    ...settings,
    automations: {
      ...automations,
      printavoDailySync: {
        ...current,
        ...patch,
        cadenceHours: DEFAULT_SETTINGS.cadenceHours,
        hourUtc: clampHour(patch.hourUtc ?? current.hourUtc),
      },
    },
  };
}
