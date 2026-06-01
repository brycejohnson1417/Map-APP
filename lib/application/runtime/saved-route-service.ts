import "server-only";

import type {
  MembershipRole,
  SavedRoutePlan,
  SavedRouteStats,
  SavedRouteStatus,
  SavedRouteStop,
  SavedRouteStopStatus,
  SavedRouteVisibility,
  TerritoryAccountPin,
} from "@/lib/domain/runtime";
import { AuditEventRepository } from "@/lib/infrastructure/supabase/audit-event-repository";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { findRuntimeOrganization } from "@/lib/application/runtime/runtime-rest";
import {
  buildOptimizedRoutePreview,
  createRouteStopSnapshots,
  type RoutePlannerLocation,
  type RoutePlannerStop,
} from "@/lib/application/runtime/route-planning-core";

const auditEvents = new AuditEventRepository();
const MANAGER_ROLES = new Set<MembershipRole>(["owner", "admin", "manager"]);

interface RoutePlanRow {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  status: SavedRouteStatus;
  visibility: SavedRouteVisibility;
  owner_email: string;
  shared_with_emails: string[] | null;
  start_label: string | null;
  start_latitude: number | null;
  start_longitude: number | null;
  end_label: string | null;
  end_latitude: number | null;
  end_longitude: number | null;
  optimization_mode: string;
  source_filters: Record<string, unknown> | null;
  stats: SavedRouteStats | null;
  created_at: string;
  updated_at: string;
}

interface RouteStopRow {
  id: string;
  organization_id: string;
  route_plan_id: string;
  account_id: string | null;
  stop_index: number;
  status: SavedRouteStopStatus;
  account_name: string;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  distance_from_previous_miles: number | null;
  estimated_duration_from_previous_minutes: number | null;
  notes: string | null;
  completed_at: string | null;
  completion_activity_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SaveRouteInput {
  name: string;
  description?: string | null;
  accountIds: string[];
  visibility?: SavedRouteVisibility;
  sharedWithEmails?: string[];
  start?: RoutePlannerLocation | null;
  end?: RoutePlannerLocation | null;
  sourceFilters?: Record<string, unknown>;
}

export interface UpdateRouteInput {
  name?: string;
  description?: string | null;
  visibility?: SavedRouteVisibility;
  sharedWithEmails?: string[];
  status?: SavedRouteStatus;
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizeEmailList(values: unknown): string[] {
  const raw = Array.isArray(values) ? values : typeof values === "string" ? values.split(",") : [];
  return [...new Set(raw.map((value) => normalizeEmail(String(value))).filter(Boolean))].slice(0, 25);
}

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, maxLength) : null;
}

function normalizeVisibility(value: unknown): SavedRouteVisibility {
  return value === "organization" || value === "shared" || value === "private" ? value : "private";
}

function normalizeStatus(value: unknown): SavedRouteStatus | null {
  return value === "draft" || value === "active" || value === "completed" || value === "archived" ? value : null;
}

function mapStats(value: SavedRouteStats | null | undefined): SavedRouteStats {
  return {
    totalStops: Number(value?.totalStops ?? 0),
    plannedStops: Number(value?.plannedStops ?? 0),
    completedStops: Number(value?.completedStops ?? 0),
    reviewStops: Number(value?.reviewStops ?? 0),
    estimatedDistanceMiles: Number(value?.estimatedDistanceMiles ?? 0),
    estimatedDurationMinutes: Number(value?.estimatedDurationMinutes ?? 0),
  };
}

function mapRouteStop(row: RouteStopRow): SavedRouteStop {
  return {
    id: row.id,
    organizationId: row.organization_id,
    routePlanId: row.route_plan_id,
    accountId: row.account_id,
    stopIndex: row.stop_index,
    status: row.status,
    accountName: row.account_name,
    city: row.city,
    state: row.state,
    latitude: row.latitude,
    longitude: row.longitude,
    distanceFromPreviousMiles: row.distance_from_previous_miles === null ? null : Number(row.distance_from_previous_miles),
    estimatedDurationFromPreviousMinutes: row.estimated_duration_from_previous_minutes,
    notes: row.notes,
    completedAt: row.completed_at,
    completionActivityId: row.completion_activity_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRoutePlan(row: RoutePlanRow, stops: SavedRouteStop[] = []): SavedRoutePlan {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    description: row.description,
    status: row.status,
    visibility: row.visibility,
    ownerEmail: row.owner_email,
    sharedWithEmails: row.shared_with_emails ?? [],
    startLabel: row.start_label,
    startLatitude: row.start_latitude,
    startLongitude: row.start_longitude,
    endLabel: row.end_label,
    endLatitude: row.end_latitude,
    endLongitude: row.end_longitude,
    optimizationMode: row.optimization_mode,
    sourceFilters: row.source_filters ?? {},
    stats: mapStats(row.stats),
    stops,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function buildStats(stops: SavedRouteStop[], estimatedDistanceMiles: number, estimatedDurationMinutes: number): SavedRouteStats {
  return {
    totalStops: stops.length,
    plannedStops: stops.filter((stop) => stop.status === "planned").length,
    completedStops: stops.filter((stop) => stop.status === "completed").length,
    reviewStops: stops.filter((stop) => stop.status === "needs_review").length,
    estimatedDistanceMiles,
    estimatedDurationMinutes,
  };
}

async function findMember(organizationId: string, sessionEmail: string) {
  const supabase = getSupabaseAdminClient() as any;
  const { data, error } = await supabase
    .from("organization_member")
    .select("id,email,role")
    .eq("organization_id", organizationId)
    .ilike("email", normalizeEmail(sessionEmail))
    .maybeSingle();

  if (error) {
    throw new Error(`route_member_lookup:${error.message}`);
  }

  return data ? { id: String(data.id), email: String(data.email), role: data.role as MembershipRole } : null;
}

function canReadRoute(route: RoutePlanRow, sessionEmail: string, role: MembershipRole | null) {
  const email = normalizeEmail(sessionEmail);
  if (MANAGER_ROLES.has(role ?? "guest")) {
    return true;
  }
  return (
    normalizeEmail(route.owner_email) === email ||
    route.visibility === "organization" ||
    (route.visibility === "shared" && (route.shared_with_emails ?? []).map(normalizeEmail).includes(email))
  );
}

function canManageRoute(route: RoutePlanRow, sessionEmail: string, role: MembershipRole | null) {
  return MANAGER_ROLES.has(role ?? "guest") || normalizeEmail(route.owner_email) === normalizeEmail(sessionEmail);
}

async function getRouteContext(slug: string, sessionEmail: string) {
  const organization = await findRuntimeOrganization(slug);
  if (!organization) {
    return null;
  }
  const member = await findMember(organization.id, sessionEmail);
  return { organization, member };
}

async function fetchRouteRow(organizationId: string, routeId: string): Promise<RoutePlanRow | null> {
  const supabase = getSupabaseAdminClient() as any;
  const { data, error } = await supabase
    .from("route_plan")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", routeId)
    .maybeSingle();

  if (error) {
    throw new Error(`route_plan_fetch:${error.message}`);
  }

  return (data as RoutePlanRow | null) ?? null;
}

async function fetchRouteStops(organizationId: string, routeId: string) {
  const supabase = getSupabaseAdminClient() as any;
  const { data, error } = await supabase
    .from("route_stop")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("route_plan_id", routeId)
    .order("stop_index", { ascending: true });

  if (error) {
    throw new Error(`route_stop_fetch:${error.message}`);
  }

  return ((data ?? []) as RouteStopRow[]).map(mapRouteStop);
}

async function fetchRouteAccountPins(organizationId: string, accountIds: string[]): Promise<TerritoryAccountPin[]> {
  const uniqueIds = [...new Set(accountIds)].filter(Boolean);
  if (!uniqueIds.length) {
    return [];
  }

  const supabase = getSupabaseAdminClient() as any;
  const { data, error } = await supabase
    .from("account")
    .select("id,name,display_name,account_status,lead_status,referral_source,vendor_day_status,city,state,latitude,longitude,sales_rep_names,last_contacted_at,last_order_date,last_sample_delivery_date,custom_fields")
    .eq("organization_id", organizationId)
    .in("id", uniqueIds);

  if (error) {
    throw new Error(`route_account_fetch:${error.message}`);
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    name: String(row.display_name ?? row.name),
    status: row.account_status ? String(row.account_status) : null,
    leadStatus: row.lead_status ? String(row.lead_status) : null,
    referralSource: row.referral_source ? String(row.referral_source) : null,
    vendorDayStatus: row.vendor_day_status ? String(row.vendor_day_status) : null,
    city: row.city ? String(row.city) : null,
    state: row.state ? String(row.state) : null,
    latitude: typeof row.latitude === "number" ? row.latitude : null,
    longitude: typeof row.longitude === "number" ? row.longitude : null,
    salesRepNames: Array.isArray(row.sales_rep_names) ? row.sales_rep_names.map(String) : [],
    lastContactedAt: row.last_contacted_at ? String(row.last_contacted_at) : null,
    lastOrderDate: row.last_order_date ? String(row.last_order_date) : null,
    lastSampleDeliveryDate: row.last_sample_delivery_date ? String(row.last_sample_delivery_date) : null,
    daysOverdue: null,
    leadScoreSummary: null,
    fraterniteesLeadScore: null,
  }));
}

function routeStopsFromPins(input: {
  pins: TerritoryAccountPin[];
  accountIds: string[];
  start?: RoutePlannerLocation | null;
  end?: RoutePlannerLocation | null;
}) {
  const pinsById = new Map(input.pins.map((pin) => [pin.id, pin]));
  const selectedPins = [...new Set(input.accountIds)].map((id) => pinsById.get(id)).filter((pin): pin is TerritoryAccountPin => Boolean(pin));
  const plannerStops: RoutePlannerStop[] = selectedPins.map((pin) => ({
    accountId: pin.id,
    name: pin.name,
    city: pin.city,
    state: pin.state,
    latitude: pin.latitude,
    longitude: pin.longitude,
  }));
  const preview = buildOptimizedRoutePreview({
    start: input.start,
    end: input.end,
    stops: plannerStops,
  });

  return {
    preview,
    snapshots: createRouteStopSnapshots(preview),
  };
}

async function refreshRouteStats(organizationId: string, routeId: string, estimatedDistanceMiles: number, estimatedDurationMinutes: number) {
  const supabase = getSupabaseAdminClient() as any;
  const stops = await fetchRouteStops(organizationId, routeId);
  const stats = buildStats(stops, estimatedDistanceMiles, estimatedDurationMinutes);
  const { error } = await supabase
    .from("route_plan")
    .update({ stats, updated_at: new Date().toISOString(), status: stats.totalStops > 0 && stats.completedStops === stats.totalStops ? "completed" : "active" })
    .eq("organization_id", organizationId)
    .eq("id", routeId);

  if (error) {
    throw new Error(`route_stats_update:${error.message}`);
  }

  return stats;
}

export async function listSavedRoutes(slug: string, sessionEmail: string) {
  const context = await getRouteContext(slug, sessionEmail);
  if (!context) {
    return null;
  }

  const supabase = getSupabaseAdminClient() as any;
  const { data, error } = await supabase
    .from("route_plan")
    .select("*")
    .eq("organization_id", context.organization.id)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`route_plan_list:${error.message}`);
  }

  return ((data ?? []) as RoutePlanRow[])
    .filter((route) => canReadRoute(route, sessionEmail, context.member?.role ?? null))
    .map((route) => mapRoutePlan(route));
}

export async function getSavedRoute(slug: string, routeId: string, sessionEmail: string) {
  const context = await getRouteContext(slug, sessionEmail);
  if (!context) {
    return null;
  }

  const row = await fetchRouteRow(context.organization.id, routeId);
  if (!row || !canReadRoute(row, sessionEmail, context.member?.role ?? null)) {
    return null;
  }

  return mapRoutePlan(row, await fetchRouteStops(context.organization.id, routeId));
}

export async function createSavedRoute(slug: string, input: SaveRouteInput, sessionEmail: string) {
  const context = await getRouteContext(slug, sessionEmail);
  if (!context) {
    return null;
  }

  const name = cleanText(input.name, 120);
  if (!name) {
    throw new Error("Route name is required.");
  }
  if (!input.accountIds.length) {
    throw new Error("Add at least one account before saving a route.");
  }

  const pins = await fetchRouteAccountPins(context.organization.id, input.accountIds);
  const { preview, snapshots } = routeStopsFromPins({
    pins,
    accountIds: input.accountIds,
    start: input.start,
    end: input.end,
  });
  if (!snapshots.length) {
    throw new Error("Selected accounts were not found in this organization.");
  }

  const visibility = normalizeVisibility(input.visibility);
  const sharedWithEmails = visibility === "shared" ? normalizeEmailList(input.sharedWithEmails ?? []) : [];
  if (visibility === "shared" && !MANAGER_ROLES.has(context.member?.role ?? "guest") && sharedWithEmails.length) {
    throw new Error("Only managers can share routes with specific teammates.");
  }

  const now = new Date().toISOString();
  const stats = buildStats(
    snapshots.map((stop) => ({
      id: "",
      organizationId: context.organization.id,
      routePlanId: "",
      accountId: stop.accountId,
      stopIndex: stop.stopIndex,
      status: stop.status,
      accountName: stop.name,
      city: stop.city ?? null,
      state: stop.state ?? null,
      latitude: stop.latitude,
      longitude: stop.longitude,
      distanceFromPreviousMiles: stop.distanceFromPreviousMiles,
      estimatedDurationFromPreviousMinutes: stop.estimatedDurationFromPreviousMinutes,
      notes: null,
      completedAt: null,
      completionActivityId: null,
      createdAt: now,
      updatedAt: now,
    })),
    preview.estimatedDistanceMiles,
    preview.estimatedDurationMinutes,
  );
  const supabase = getSupabaseAdminClient() as any;
  const { data: route, error: routeError } = await supabase
    .from("route_plan")
    .insert({
      organization_id: context.organization.id,
      name,
      description: cleanText(input.description, 600),
      status: "active",
      visibility,
      owner_email: normalizeEmail(sessionEmail),
      shared_with_emails: sharedWithEmails,
      start_label: cleanText(input.start?.label, 120),
      start_latitude: input.start?.latitude ?? null,
      start_longitude: input.start?.longitude ?? null,
      end_label: cleanText(input.end?.label, 120),
      end_latitude: input.end?.latitude ?? null,
      end_longitude: input.end?.longitude ?? null,
      optimization_mode: "nearest_neighbor",
      source_filters: input.sourceFilters ?? {},
      stats,
    })
    .select("*")
    .single();

  if (routeError) {
    throw new Error(`route_plan_create:${routeError.message}`);
  }

  const stopRows = snapshots.map((stop) => ({
    organization_id: context.organization.id,
    route_plan_id: route.id,
    account_id: stop.accountId,
    stop_index: stop.stopIndex,
    status: stop.status,
    account_name: stop.name,
    city: stop.city ?? null,
    state: stop.state ?? null,
    latitude: stop.latitude,
    longitude: stop.longitude,
    distance_from_previous_miles: stop.distanceFromPreviousMiles,
    estimated_duration_from_previous_minutes: stop.estimatedDurationFromPreviousMinutes,
  }));
  const { error: stopsError } = await supabase.from("route_stop").insert(stopRows);
  if (stopsError) {
    throw new Error(`route_stop_create:${stopsError.message}`);
  }

  await auditEvents.record({
    organizationId: context.organization.id,
    actorMemberId: context.member?.id ?? null,
    eventType: "route_plan_created",
    entityType: "route_plan",
    entityId: String(route.id),
    payload: { name, stopCount: stopRows.length, visibility },
  });

  return getSavedRoute(slug, String(route.id), sessionEmail);
}

export async function updateSavedRoute(slug: string, routeId: string, input: UpdateRouteInput, sessionEmail: string) {
  const context = await getRouteContext(slug, sessionEmail);
  if (!context) {
    return null;
  }
  const existing = await fetchRouteRow(context.organization.id, routeId);
  if (!existing || !canManageRoute(existing, sessionEmail, context.member?.role ?? null)) {
    return null;
  }

  const visibility = input.visibility ? normalizeVisibility(input.visibility) : existing.visibility;
  const sharedWithEmails = visibility === "shared" ? normalizeEmailList(input.sharedWithEmails ?? existing.shared_with_emails ?? []) : [];
  if (visibility === "shared" && !MANAGER_ROLES.has(context.member?.role ?? "guest") && sharedWithEmails.length) {
    throw new Error("Only managers can share routes with specific teammates.");
  }

  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    visibility,
    shared_with_emails: sharedWithEmails,
  };
  const name = input.name === undefined ? null : cleanText(input.name, 120);
  if (input.name !== undefined) {
    if (!name) {
      throw new Error("Route name is required.");
    }
    update.name = name;
  }
  if (input.description !== undefined) {
    update.description = cleanText(input.description, 600);
  }
  const status = normalizeStatus(input.status);
  if (status) {
    update.status = status;
  }

  const supabase = getSupabaseAdminClient() as any;
  const { error } = await supabase
    .from("route_plan")
    .update(update)
    .eq("organization_id", context.organization.id)
    .eq("id", routeId);

  if (error) {
    throw new Error(`route_plan_update:${error.message}`);
  }

  await auditEvents.record({
    organizationId: context.organization.id,
    actorMemberId: context.member?.id ?? null,
    eventType: "route_plan_updated",
    entityType: "route_plan",
    entityId: routeId,
    payload: { fields: Object.keys(update).filter((key) => key !== "updated_at") },
  });

  return getSavedRoute(slug, routeId, sessionEmail);
}

export async function duplicateSavedRoute(slug: string, routeId: string, sessionEmail: string) {
  const route = await getSavedRoute(slug, routeId, sessionEmail);
  if (!route) {
    return null;
  }
  const context = await getRouteContext(slug, sessionEmail);
  if (!context) {
    return null;
  }

  const supabase = getSupabaseAdminClient() as any;
  const { data: duplicate, error } = await supabase
    .from("route_plan")
    .insert({
      organization_id: route.organizationId,
      name: `${route.name} copy`.slice(0, 120),
      description: route.description,
      status: "active",
      visibility: "private",
      owner_email: normalizeEmail(sessionEmail),
      shared_with_emails: [],
      start_label: route.startLabel,
      start_latitude: route.startLatitude,
      start_longitude: route.startLongitude,
      end_label: route.endLabel,
      end_latitude: route.endLatitude,
      end_longitude: route.endLongitude,
      optimization_mode: route.optimizationMode,
      source_filters: route.sourceFilters,
      stats: {
        ...route.stats,
        completedStops: 0,
        plannedStops: route.stats.totalStops - route.stats.reviewStops,
      },
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`route_plan_duplicate:${error.message}`);
  }

  const stopRows = route.stops.map((stop) => ({
    organization_id: route.organizationId,
    route_plan_id: duplicate.id,
    account_id: stop.accountId,
    stop_index: stop.stopIndex,
    status: stop.status === "needs_review" ? "needs_review" : "planned",
    account_name: stop.accountName,
    city: stop.city,
    state: stop.state,
    latitude: stop.latitude,
    longitude: stop.longitude,
    distance_from_previous_miles: stop.distanceFromPreviousMiles,
    estimated_duration_from_previous_minutes: stop.estimatedDurationFromPreviousMinutes,
    notes: stop.notes,
  }));
  const { error: stopError } = await supabase.from("route_stop").insert(stopRows);
  if (stopError) {
    throw new Error(`route_stop_duplicate:${stopError.message}`);
  }

  await auditEvents.record({
    organizationId: route.organizationId,
    actorMemberId: context.member?.id ?? null,
    eventType: "route_plan_created",
    entityType: "route_plan",
    entityId: String(duplicate.id),
    payload: { duplicatedFromRouteId: route.id },
  });

  return getSavedRoute(slug, String(duplicate.id), sessionEmail);
}

export async function deleteSavedRoute(slug: string, routeId: string, sessionEmail: string) {
  const context = await getRouteContext(slug, sessionEmail);
  if (!context) {
    return null;
  }
  const existing = await fetchRouteRow(context.organization.id, routeId);
  if (!existing || !canManageRoute(existing, sessionEmail, context.member?.role ?? null)) {
    return null;
  }

  const supabase = getSupabaseAdminClient() as any;
  const { error } = await supabase.from("route_plan").delete().eq("organization_id", context.organization.id).eq("id", routeId);
  if (error) {
    throw new Error(`route_plan_delete:${error.message}`);
  }
  return true;
}

export async function completeSavedRouteStop(slug: string, routeId: string, stopId: string, sessionEmail: string, note?: string | null) {
  const context = await getRouteContext(slug, sessionEmail);
  if (!context) {
    return null;
  }
  const route = await fetchRouteRow(context.organization.id, routeId);
  if (!route || !canReadRoute(route, sessionEmail, context.member?.role ?? null)) {
    return null;
  }

  const stops = await fetchRouteStops(context.organization.id, routeId);
  const stop = stops.find((candidate) => candidate.id === stopId);
  if (!stop) {
    return null;
  }
  if (!stop.accountId) {
    throw new Error("Stops without linked accounts cannot be completed.");
  }

  const now = new Date().toISOString();
  const supabase = getSupabaseAdminClient() as any;
  const cleanNote = cleanText(note, 500);
  const { data: activity, error: activityError } = await supabase
    .from("activity")
    .insert({
      organization_id: context.organization.id,
      account_id: stop.accountId,
      actor_member_id: context.member?.id ?? null,
      activity_type: "route_stop_completed",
      summary: `Completed route stop: ${stop.accountName}`.slice(0, 180),
      occurred_at: now,
      metadata: {
        source: "map_app_route_builder",
        routePlanId: routeId,
        routeName: route.name,
        stopId,
        note: cleanNote,
      },
    })
    .select("id")
    .single();

  if (activityError) {
    throw new Error(`route_stop_activity:${activityError.message}`);
  }

  const { error: stopError } = await supabase
    .from("route_stop")
    .update({
      status: "completed",
      completed_at: now,
      completion_activity_id: activity.id,
      notes: cleanNote,
      updated_at: now,
    })
    .eq("organization_id", context.organization.id)
    .eq("route_plan_id", routeId)
    .eq("id", stopId);
  if (stopError) {
    throw new Error(`route_stop_complete:${stopError.message}`);
  }

  const { data: account } = await supabase
    .from("account")
    .select("custom_fields")
    .eq("organization_id", context.organization.id)
    .eq("id", stop.accountId)
    .maybeSingle();
  const { error: accountError } = await supabase
    .from("account")
    .update({
      last_contacted_at: now.slice(0, 10),
      custom_fields: {
        ...((account?.custom_fields ?? {}) as Record<string, unknown>),
        lastRouteStopCompletedAt: now,
        lastRoutePlanId: routeId,
      },
    })
    .eq("organization_id", context.organization.id)
    .eq("id", stop.accountId);
  if (accountError) {
    throw new Error(`route_stop_account_update:${accountError.message}`);
  }

  await auditEvents.record({
    organizationId: context.organization.id,
    actorMemberId: context.member?.id ?? null,
    eventType: "route_stop_completed",
    entityType: "route_plan",
    entityId: routeId,
    payload: { stopId, accountId: stop.accountId, activityId: String(activity.id) },
  });

  await refreshRouteStats(context.organization.id, routeId, route.stats?.estimatedDistanceMiles ?? 0, route.stats?.estimatedDurationMinutes ?? 0);
  return getSavedRoute(slug, routeId, sessionEmail);
}
