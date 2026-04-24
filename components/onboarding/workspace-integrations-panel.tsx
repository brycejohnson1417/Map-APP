"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, PlugZap, Settings2, Zap } from "lucide-react";
import type { IntegrationInstallation } from "@/lib/domain/runtime";
import type { WorkspaceDefinition } from "@/lib/domain/workspace";
import type { TenantPluginKey, TenantPluginSettings } from "@/lib/application/runtime/plugin-settings";

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function fieldInputType(type: string) {
  if (type === "secret") {
    return "password";
  }
  if (type === "email") {
    return "email";
  }
  if (type === "url") {
    return "url";
  }
  return "text";
}

export function WorkspaceIntegrationsPanel({
  orgSlug,
  workspace,
  integrations,
  pluginSettings,
}: {
  orgSlug: string;
  workspace: WorkspaceDefinition;
  integrations: Array<Pick<IntegrationInstallation, "id" | "provider" | "displayName" | "externalAccountId" | "status" | "updatedAt">>;
  pluginSettings: TenantPluginSettings;
}) {
  const [connected, setConnected] = useState(integrations);
  const [plugins, setPlugins] = useState(pluginSettings);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [formState, setFormState] = useState<Record<string, Record<string, string>>>({});

  async function saveConnector(provider: string) {
    setBusyKey(`connector:${provider}`);
    setNotice(null);
    try {
      const response = await fetch(`/api/runtime/organizations/${encodeURIComponent(orgSlug)}/connectors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          fields: formState[provider] ?? {},
        }),
      });
      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
        integration?: Pick<IntegrationInstallation, "id" | "provider" | "displayName" | "externalAccountId" | "status" | "updatedAt">;
      };
      if (!response.ok || !payload.ok || !payload.integration) {
        throw new Error(payload.error ?? "Connector save failed");
      }
      setConnected((current) => {
        const next = current.filter((integration) => integration.provider !== payload.integration!.provider);
        next.push(payload.integration!);
        return next.sort((left, right) => left.displayName.localeCompare(right.displayName));
      });
      setNotice(`${payload.integration.displayName} saved for ${orgSlug}.`);
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : "Connector save failed");
    } finally {
      setBusyKey(null);
    }
  }

  async function togglePlugin(plugin: TenantPluginKey, enabled: boolean) {
    setBusyKey(`plugin:${plugin}`);
    setNotice(null);
    try {
      const response = await fetch(`/api/runtime/organizations/${encodeURIComponent(orgSlug)}/plugins`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plugin, enabled }),
      });
      const payload = (await response.json()) as { ok: boolean; error?: string; plugins?: TenantPluginSettings };
      if (!response.ok || !payload.ok || !payload.plugins) {
        throw new Error(payload.error ?? "Plugin update failed");
      }
      setPlugins(payload.plugins);
      setNotice(`${plugin} ${enabled ? "enabled" : "disabled"} for ${orgSlug}.`);
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : "Plugin update failed");
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <section className="flex flex-col gap-6 rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-soft)]">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--accent-secondary-strong)]">Integrations & plugins</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em] md:text-6xl">{workspace.displayName} setup</h1>
          <p className="mt-3 max-w-3xl text-base leading-8 text-[var(--text-secondary)]">{workspace.onboarding.summary}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-3 text-sm font-semibold text-[var(--text-secondary)]">
          {connected.length} connector{connected.length === 1 ? "" : "s"} configured
        </div>
      </header>

      {notice ? (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-3 text-sm font-semibold text-[var(--text-secondary)]">
          {notice}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {workspace.connectors.map((connector) => {
          const saved = connected.find((integration) => integration.provider === connector.provider);
          const providerState = formState[connector.provider] ?? {};

          return (
            <section
              key={connector.provider}
              className="rounded-[1.5rem] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">{connector.provider}</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{connector.label}</h2>
                  <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">{connector.description}</p>
                </div>
                {saved ? (
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    Configured
                  </span>
                ) : null}
              </div>

              <div className="mt-5 space-y-3">
                {connector.fields.map((field) =>
                  field.type === "textarea" ? (
                    <label key={field.key} className="block">
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">{field.label}</span>
                      <textarea
                        rows={4}
                        value={providerState[field.key] ?? ""}
                        onChange={(event) =>
                          setFormState((current) => ({
                            ...current,
                            [connector.provider]: {
                              ...current[connector.provider],
                              [field.key]: event.target.value,
                            },
                          }))
                        }
                        placeholder={field.placeholder}
                        className="mt-2 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] px-4 py-3 text-sm font-semibold outline-none placeholder:text-[var(--text-tertiary)]"
                      />
                    </label>
                  ) : (
                    <label key={field.key} className="block">
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">{field.label}</span>
                      <input
                        type={fieldInputType(field.type)}
                        value={providerState[field.key] ?? ""}
                        onChange={(event) =>
                          setFormState((current) => ({
                            ...current,
                            [connector.provider]: {
                              ...current[connector.provider],
                              [field.key]: event.target.value,
                            },
                          }))
                        }
                        placeholder={field.placeholder}
                        className="mt-2 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] px-4 py-3 text-sm font-semibold outline-none placeholder:text-[var(--text-tertiary)]"
                      />
                    </label>
                  ),
                )}
              </div>

              <div className="mt-5 flex items-center justify-between gap-4">
                <div className="text-sm text-[var(--text-secondary)]">
                  {saved?.externalAccountId
                    ? `Account: ${saved.externalAccountId}`
                    : connector.selfServe
                      ? connector.required
                        ? "Required connector"
                        : "Optional connector"
                      : "Guided setup required"}
                </div>
                <button
                  type="button"
                  onClick={() => saveConnector(connector.provider)}
                  disabled={busyKey === `connector:${connector.provider}` || !connector.selfServe}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--text-primary)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                  style={{ color: "#fff" }}
                >
                  {busyKey === `connector:${connector.provider}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlugZap className="h-4 w-4" />}
                  Save connector
                </button>
              </div>
            </section>
          );
        })}
      </div>

      <section className="rounded-[1.5rem] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-5">
        <div className="flex items-center gap-3">
          <Settings2 className="h-5 w-5 text-[var(--accent-secondary-strong)]" />
          <h2 className="text-xl font-semibold tracking-[-0.03em]">Workspace plugins</h2>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(Object.entries(plugins) as Array<[TenantPluginKey, { enabled: boolean }]>).map(([key, value]) => {
            if (key === "routePlanning" && !workspace.modules.integrations?.allowRoutePlanning) {
              return null;
            }

            return (
              <button
                key={key}
                type="button"
                onClick={() => togglePlugin(key, !value.enabled)}
                disabled={busyKey === `plugin:${key}`}
                className={classNames(
                  "rounded-xl border px-4 py-4 text-left transition",
                  value.enabled
                    ? "border-[var(--accent-success)] bg-[rgba(21,130,95,0.08)]"
                    : "border-[var(--border-subtle)] bg-[var(--surface-card)]",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">{key}</p>
                  {busyKey === `plugin:${key}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                </div>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{value.enabled ? "Enabled" : "Disabled"}</p>
              </button>
            );
          })}
        </div>
      </section>
    </section>
  );
}
