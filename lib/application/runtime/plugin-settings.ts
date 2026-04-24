import { compileWorkspaceDefinition } from "@/lib/platform/workspace/registry";

export type TenantPluginKey = "routePlanning" | "printavoSync" | "runtimeDiagnostics";

export type TenantPluginSettings = Record<TenantPluginKey, { enabled: boolean }>;

const pluginKeys: TenantPluginKey[] = ["routePlanning", "printavoSync", "runtimeDiagnostics"];

function defaultPluginSettings(slug: string, settings: Record<string, unknown> = {}): TenantPluginSettings {
  const workspace = compileWorkspaceDefinition({
    slug,
    organization: {
      slug,
      settings,
    },
  });

  return {
    routePlanning: { enabled: workspace.modules.integrations?.allowRoutePlanning ?? true },
    printavoSync: { enabled: workspace.connectors.some((connector) => connector.provider === "printavo") },
    runtimeDiagnostics: { enabled: true },
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export function resolveTenantPluginSettings(slug: string, settings: Record<string, unknown> = {}): TenantPluginSettings {
  const defaults = defaultPluginSettings(slug, settings);
  const plugins = asRecord(settings.plugins);

  return pluginKeys.reduce<TenantPluginSettings>((resolved, key) => {
    const rawPlugin = asRecord(plugins[key]);
    resolved[key] = {
      enabled: typeof rawPlugin.enabled === "boolean" ? rawPlugin.enabled : defaults[key].enabled,
    };
    return resolved;
  }, defaults);
}

export function mergeTenantPluginSetting(
  settings: Record<string, unknown>,
  key: TenantPluginKey,
  enabled: boolean,
) {
  const plugins = asRecord(settings.plugins);
  const existingPlugin = asRecord(plugins[key]);

  return {
    ...settings,
    plugins: {
      ...plugins,
      [key]: {
        ...existingPlugin,
        enabled,
      },
    },
  };
}
