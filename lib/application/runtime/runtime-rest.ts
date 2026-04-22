import "server-only";

import type { Organization } from "@/lib/domain/runtime";
import { getSupabaseAnonKey, getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/supabase/config";

const REST_FETCH_ATTEMPTS = 3;

function getRestConfig() {
  const baseUrl = getSupabaseUrl();
  const key = getSupabaseServiceRoleKey() || getSupabaseAnonKey();

  if (!baseUrl || !key) {
    throw new Error("Supabase is not configured");
  }

  return {
    restUrl: `${baseUrl.replace(/\/$/, "")}/rest/v1`,
    key,
  };
}

function parseContentRangeCount(value: string | null) {
  if (!value) {
    return 0;
  }

  const [, count] = value.split("/");
  return count && count !== "*" ? Number(count) : 0;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetryStatus(status: number) {
  return status === 429 || (status >= 500 && status < 600);
}

async function fetchWithRetry(input: string, init: RequestInit) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= REST_FETCH_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(input, init);
      if (!shouldRetryStatus(response.status) || attempt === REST_FETCH_ATTEMPTS) {
        return response;
      }
    } catch (error) {
      lastError = error;
      if (attempt === REST_FETCH_ATTEMPTS) {
        throw error;
      }
    }

    await delay(100 * attempt);
  }

  throw lastError instanceof Error ? lastError : new Error("Supabase REST request failed");
}

export async function runtimeRestRequest<T>(table: string, params: URLSearchParams, init?: RequestInit) {
  const { restUrl, key } = getRestConfig();
  const response = await fetchWithRetry(`${restUrl}/${table}?${params.toString()}`, {
    ...init,
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      ...init?.headers,
    },
    cache: "no-store",
    signal: init?.signal ?? AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase REST ${table} failed with ${response.status}: ${body.slice(0, 300)}`);
  }

  if (init?.method === "HEAD") {
    return {
      data: null as T,
      count: parseContentRangeCount(response.headers.get("content-range")),
    };
  }

  return {
    data: (await response.json()) as T,
    count: parseContentRangeCount(response.headers.get("content-range")),
  };
}

export async function runtimeExactCount(table: string, organizationId: string, extra?: Record<string, string>) {
  const params = new URLSearchParams({
    select: "id",
    organization_id: `eq.${organizationId}`,
    limit: "1",
    ...extra,
  });
  const result = await runtimeRestRequest<null>(table, params, {
    method: "HEAD",
    headers: {
      Prefer: "count=exact",
      Range: "0-0",
    },
  });

  return result.count;
}

function mapOrganization(row: Record<string, unknown>): Organization {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    status: String(row.status),
    settings: (row.settings ?? {}) as Record<string, unknown>,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function findRuntimeOrganization(slug: string) {
  const params = new URLSearchParams({
    slug: `eq.${slug}`,
    select: "id,slug,name,status,settings,created_at,updated_at",
    limit: "1",
  });
  const { data } = await runtimeRestRequest<Array<Record<string, unknown>>>("organization", params);
  return data[0] ? mapOrganization(data[0]) : null;
}
