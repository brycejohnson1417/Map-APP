"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Archive, Check, ClipboardList, Copy, Loader2, MapPinned, Pencil, RefreshCw, Route, Save, Share2, Trash2, X } from "lucide-react";
import type { SavedRoutePlan, SavedRouteStop, SavedRouteVisibility } from "@/lib/domain/runtime";
import { orgScopedHref } from "@/lib/presentation/org-slug";

interface SavedRoutesWorkspaceProps {
  orgSlug: string;
  organizationName: string;
  initialRoutes: SavedRoutePlan[];
  permissionDenied: boolean;
}

interface RouteListResponse {
  ok: boolean;
  routes?: SavedRoutePlan[];
  error?: string;
}

interface RouteResponse {
  ok: boolean;
  route?: SavedRoutePlan;
  error?: string;
}

function formatDate(value: string | null | undefined) {
  return value ? value.slice(0, 10) : "None";
}

function formatDistance(value: number) {
  return `${Math.round(value)} mi`;
}

function formatDuration(value: number) {
  if (value < 60) {
    return `${value} min`;
  }
  return `${Math.floor(value / 60)}h ${value % 60}m`;
}

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function stopStatusLabel(stop: SavedRouteStop) {
  if (stop.status === "needs_review") {
    return "Needs coordinates";
  }
  if (stop.status === "completed") {
    return "Completed";
  }
  if (stop.status === "skipped") {
    return "Skipped";
  }
  return "Planned";
}

export function SavedRoutesWorkspace({ orgSlug, organizationName, initialRoutes, permissionDenied }: SavedRoutesWorkspaceProps) {
  const [routes, setRoutes] = useState(initialRoutes);
  const [selectedRouteId, setSelectedRouteId] = useState(initialRoutes[0]?.id ?? null);
  const [selectedRoute, setSelectedRoute] = useState<SavedRoutePlan | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(permissionDenied ? "Tenant login is required to view saved routes." : null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editVisibility, setEditVisibility] = useState<SavedRouteVisibility>("private");
  const [editShareEmails, setEditShareEmails] = useState("");
  const [completeNoteByStopId, setCompleteNoteByStopId] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  const selectedSummary = useMemo(
    () => routes.find((route) => route.id === selectedRouteId) ?? routes[0] ?? null,
    [routes, selectedRouteId],
  );
  const unsavedChanges = Boolean(
    selectedRoute &&
      (editName !== selectedRoute.name ||
        editDescription !== (selectedRoute.description ?? "") ||
        editVisibility !== selectedRoute.visibility ||
        editShareEmails !== selectedRoute.sharedWithEmails.join(", ")),
  );
  const activeStops = selectedRoute?.stops.filter((stop) => stop.status !== "needs_review") ?? [];
  const reviewStops = selectedRoute?.stops.filter((stop) => stop.status === "needs_review") ?? [];

  async function loadRoutes() {
    if (permissionDenied) {
      return;
    }
    setLoadingList(true);
    setError(null);
    try {
      const response = await fetch(`/api/runtime/organizations/${orgSlug}/routes`, { cache: "no-store" });
      const payload = (await response.json().catch(() => ({}))) as RouteListResponse;
      if (!response.ok || !payload.ok || !payload.routes) {
        throw new Error(payload.error || `Route list failed: ${response.status}`);
      }
      setRoutes(payload.routes);
      setSelectedRouteId((current) => current ?? payload.routes?.[0]?.id ?? null);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Unable to load saved routes.");
    } finally {
      setLoadingList(false);
    }
  }

  async function loadRoute(routeId: string | null) {
    if (!routeId || permissionDenied) {
      setSelectedRoute(null);
      return;
    }
    setLoadingRoute(true);
    setError(null);
    try {
      const response = await fetch(`/api/runtime/organizations/${orgSlug}/routes/${routeId}`, { cache: "no-store" });
      const payload = (await response.json().catch(() => ({}))) as RouteResponse;
      if (!response.ok || !payload.ok || !payload.route) {
        throw new Error(payload.error || `Route load failed: ${response.status}`);
      }
      setSelectedRoute(payload.route);
      setEditName(payload.route.name);
      setEditDescription(payload.route.description ?? "");
      setEditVisibility(payload.route.visibility);
      setEditShareEmails(payload.route.sharedWithEmails.join(", "));
      setConfirmDelete(false);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Unable to load saved route.");
    } finally {
      setLoadingRoute(false);
    }
  }

  useEffect(() => {
    void loadRoute(selectedSummary?.id ?? null);
  }, [selectedSummary?.id]);

  async function updateRoute(status?: SavedRoutePlan["status"]) {
    if (!selectedRoute) {
      return;
    }
    setSaving(true);
    setNotice(null);
    try {
      const response = await fetch(`/api/runtime/organizations/${orgSlug}/routes/${selectedRoute.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          description: editDescription,
          visibility: editVisibility,
          sharedWithEmails: editShareEmails.split(",").map((email) => email.trim()).filter(Boolean),
          status,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as RouteResponse;
      if (!response.ok || !payload.ok || !payload.route) {
        throw new Error(payload.error || `Route update failed: ${response.status}`);
      }
      setNotice(status === "archived" ? "Route archived." : "Route saved.");
      setSelectedRoute(payload.route);
      setRoutes((current) => current.map((route) => (route.id === payload.route?.id ? payload.route : route)));
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update route.");
    } finally {
      setSaving(false);
    }
  }

  async function duplicateRoute() {
    if (!selectedRoute) {
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`/api/runtime/organizations/${orgSlug}/routes/${selectedRoute.id}/duplicate`, { method: "POST" });
      const payload = (await response.json().catch(() => ({}))) as RouteResponse;
      if (!response.ok || !payload.ok || !payload.route) {
        throw new Error(payload.error || `Route duplicate failed: ${response.status}`);
      }
      setRoutes((current) => [payload.route!, ...current]);
      setSelectedRouteId(payload.route.id);
      setNotice("Route duplicated.");
    } catch (duplicateError) {
      setError(duplicateError instanceof Error ? duplicateError.message : "Unable to duplicate route.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteRoute() {
    if (!selectedRoute) {
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`/api/runtime/organizations/${orgSlug}/routes/${selectedRoute.id}`, { method: "DELETE" });
      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || `Route delete failed: ${response.status}`);
      }
      const nextRoutes = routes.filter((route) => route.id !== selectedRoute.id);
      setRoutes(nextRoutes);
      setSelectedRouteId(nextRoutes[0]?.id ?? null);
      setSelectedRoute(null);
      setConfirmDelete(false);
      setNotice("Route deleted.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete route.");
    } finally {
      setSaving(false);
    }
  }

  async function completeStop(stop: SavedRouteStop) {
    if (!selectedRoute) {
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`/api/runtime/organizations/${orgSlug}/routes/${selectedRoute.id}/stops/${stop.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: completeNoteByStopId[stop.id] ?? "" }),
      });
      const payload = (await response.json().catch(() => ({}))) as RouteResponse;
      if (!response.ok || !payload.ok || !payload.route) {
        throw new Error(payload.error || `Stop completion failed: ${response.status}`);
      }
      setSelectedRoute(payload.route);
      setRoutes((current) => current.map((route) => (route.id === payload.route?.id ? payload.route : route)));
      setCompleteNoteByStopId((current) => ({ ...current, [stop.id]: "" }));
      setNotice("Stop completed and account activity was recorded.");
    } catch (completeError) {
      setError(completeError instanceof Error ? completeError.message : "Unable to complete stop.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 md:px-10 md:py-8">
      <header className="border-b border-slate-200 pb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">{organizationName}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] md:text-5xl">Saved Routes</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              Saved optimized routes and call lists persist stop order, review buckets, sharing, and completion state.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => void loadRoutes()}
              disabled={loadingList || permissionDenied}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold disabled:opacity-60"
            >
              {loadingList ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh
            </button>
            <Link
              href={orgScopedHref("/territory", orgSlug)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
              style={{ color: "#fff" }}
            >
              <MapPinned className="h-4 w-4" />
              Create from map
            </Link>
          </div>
        </div>
      </header>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">{error}</div>
      ) : null}
      {notice ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss route notice">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="min-h-[20rem] border border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-4">
            <div className="flex items-center gap-2">
              <Route className="h-5 w-5 text-blue-700" />
              <h2 className="text-lg font-semibold">Route list</h2>
            </div>
          </div>
          <div className="max-h-[calc(100dvh-18rem)] overflow-auto">
            {routes.map((route) => (
              <button
                key={route.id}
                type="button"
                onClick={() => setSelectedRouteId(route.id)}
                className={classNames(
                  "block w-full border-b border-slate-100 p-4 text-left transition hover:bg-slate-50",
                  selectedSummary?.id === route.id && "bg-blue-50",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{route.name}</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      {route.status} / {route.visibility}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                    {route.stats.completedStops}/{route.stats.totalStops}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {formatDistance(route.stats.estimatedDistanceMiles)} / {formatDuration(route.stats.estimatedDurationMinutes)}
                </p>
              </button>
            ))}
            {!routes.length ? (
              <div className="p-6 text-sm leading-7 text-slate-600">
                No saved routes yet. Build one from selected territory map accounts and it will appear here.
              </div>
            ) : null}
          </div>
        </aside>

        <main className="min-h-[32rem] border border-slate-200 bg-white">
          {loadingRoute ? (
            <div className="flex h-full min-h-[32rem] items-center justify-center text-sm font-semibold text-slate-600">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading route
            </div>
          ) : selectedRoute ? (
            <div className="grid min-h-[32rem] gap-0 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="border-b border-slate-200 xl:border-b-0 xl:border-r">
                <div className="border-b border-slate-200 p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Call-list mode</p>
                      <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em]">{selectedRoute.name}</h2>
                      <p className="mt-2 text-sm text-slate-600">
                        {selectedRoute.stats.completedStops} of {selectedRoute.stats.totalStops} stops completed. Updated {formatDate(selectedRoute.updatedAt)}.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => void duplicateRoute()} disabled={saving} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold">
                        <Copy className="h-4 w-4" />
                        Duplicate
                      </button>
                      <button type="button" onClick={() => void updateRoute("archived")} disabled={saving} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold">
                        <Archive className="h-4 w-4" />
                        Archive
                      </button>
                      <button type="button" onClick={() => setConfirmDelete(true)} disabled={saving} className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>

                {confirmDelete ? (
                  <div className="border-b border-red-200 bg-red-50 p-4 text-sm text-red-900">
                    <p className="font-semibold">Delete this saved route?</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" onClick={() => void deleteRoute()} className="rounded-lg bg-red-700 px-3 py-2 font-semibold text-white" style={{ color: "#fff" }}>
                        Confirm delete
                      </button>
                      <button type="button" onClick={() => setConfirmDelete(false)} className="rounded-lg border border-red-200 px-3 py-2 font-semibold">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="divide-y divide-slate-100">
                  {activeStops.map((stop) => (
                    <div key={stop.id} className="p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white" style={{ color: "#fff" }}>
                              {stop.stopIndex}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-semibold">{stop.accountName}</p>
                              <p className="text-sm text-slate-600">{[stop.city, stop.state].filter(Boolean).join(", ") || "No location label"}</p>
                            </div>
                          </div>
                          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{stopStatusLabel(stop)}</p>
                        </div>
                        {stop.status === "completed" ? (
                          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                            <Check className="h-3.5 w-3.5" />
                            {formatDate(stop.completedAt)}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => void completeStop(stop)}
                            disabled={saving}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                            style={{ color: "#fff" }}
                          >
                            <Check className="h-4 w-4" />
                            Complete stop
                          </button>
                        )}
                      </div>
                      {stop.status !== "completed" ? (
                        <input
                          value={completeNoteByStopId[stop.id] ?? ""}
                          onChange={(event) => setCompleteNoteByStopId((current) => ({ ...current, [stop.id]: event.target.value }))}
                          placeholder="Optional completion note"
                          className="mt-3 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-400"
                        />
                      ) : null}
                    </div>
                  ))}
                </div>

                {reviewStops.length ? (
                  <div className="border-t border-amber-200 bg-amber-50 p-5">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-5 w-5 text-amber-800" />
                      <h3 className="font-semibold text-amber-950">Coordinate review bucket</h3>
                    </div>
                    <div className="mt-3 grid gap-2">
                      {reviewStops.map((stop) => (
                        <div key={stop.id} className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-amber-950">
                          <span className="font-semibold">{stop.accountName}</span>
                          <span className="text-amber-800"> needs a usable latitude/longitude before map navigation.</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <aside className="p-5">
                <div className="flex items-center gap-2">
                  <Pencil className="h-4 w-4 text-blue-700" />
                  <h3 className="font-semibold">Edit and share</h3>
                  {unsavedChanges ? <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800">Unsaved</span> : null}
                </div>
                <div className="mt-4 space-y-3">
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Name</span>
                    <input value={editName} onChange={(event) => setEditName(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none" />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Description</span>
                    <textarea value={editDescription} onChange={(event) => setEditDescription(event.target.value)} rows={3} className="mt-1 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none" />
                  </label>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Visibility</span>
                    <div className="mt-2 grid grid-cols-3 gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
                      {(["private", "organization", "shared"] as const).map((visibility) => (
                        <button
                          key={visibility}
                          type="button"
                          onClick={() => setEditVisibility(visibility)}
                          className={classNames("rounded-md px-2 py-2 text-xs font-semibold capitalize", editVisibility === visibility ? "bg-slate-950 text-white" : "text-slate-600")}
                          style={editVisibility === visibility ? { color: "#fff" } : undefined}
                        >
                          {visibility}
                        </button>
                      ))}
                    </div>
                  </div>
                  {editVisibility === "shared" ? (
                    <label className="block">
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Share with</span>
                      <input value={editShareEmails} onChange={(event) => setEditShareEmails(event.target.value)} placeholder="teammate@example.com" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none" />
                    </label>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void updateRoute()}
                    disabled={saving || !unsavedChanges}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                    style={{ color: "#fff" }}
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save changes
                  </button>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                    <Share2 className="mb-2 h-4 w-4 text-blue-700" />
                    Shared routes stay tenant-scoped and only expose product-owned route metadata and stop state.
                  </div>
                </div>
              </aside>
            </div>
          ) : (
            <div className="flex min-h-[32rem] flex-col items-center justify-center p-8 text-center">
              <Route className="h-10 w-10 text-slate-400" />
              <h2 className="mt-4 text-2xl font-semibold">No route selected</h2>
              <p className="mt-2 max-w-md text-sm leading-7 text-slate-600">
                Select a saved route, or create one from the territory map selection tools.
              </p>
            </div>
          )}
        </main>
      </div>
    </section>
  );
}
