import "server-only";

import type { IntegrationInstallation } from "@/lib/domain/runtime";

export interface NotionDirtyPageJobPayload {
  reason: string;
  pageIds: string[];
  requestedAt: string;
}

export class NotionCrmAdapter {
  constructor(private readonly installation: IntegrationInstallation) {}

  describe() {
    return {
      provider: this.installation.provider,
      displayName: this.installation.displayName,
      mode: "incremental-webhook-first",
      supportsOutboundAccountUpdates: true,
      config: this.installation.config,
    };
  }

  buildDirtyPageSyncPayload(input: { pageIds: string[]; reason: string }): NotionDirtyPageJobPayload {
    return {
      reason: input.reason,
      pageIds: [...new Set(input.pageIds)].filter(Boolean),
      requestedAt: new Date().toISOString(),
    };
  }

  getDataSourceIds() {
    const raw = this.installation.config.dataSourceIds;
    return Array.isArray(raw) ? raw.filter((value): value is string => typeof value === "string") : [];
  }
}
