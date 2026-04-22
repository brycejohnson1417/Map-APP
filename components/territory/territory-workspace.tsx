"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  ExternalLink,
  Filter,
  Home,
  List,
  Loader2,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  MessageSquareText,
  Navigation,
  RefreshCw,
  Route,
  Search,
  Users,
  X,
} from "lucide-react";
import type {
  AccountRuntimeDetail,
  TerritoryAccountPin,
  TerritoryBoundaryRuntime,
  TerritoryMarkerRuntime,
  TerritoryRuntimeDashboard,
} from "@/lib/domain/runtime";

type GoogleNamespace = any;
type GoogleMarker = any;
type GoogleMap = any;
type GooglePolygon = any;
type GooglePolyline = any;
type GoogleDirectionsRenderer = any;

interface TerritoryPinsResponse {
  ok: boolean;
  counts: TerritoryRuntimeDashboard["counts"];
  appliedFilters: TerritoryRuntimeDashboard["appliedFilters"];
  repFacets: TerritoryRuntimeDashboard["repFacets"];
  statusFacets: TerritoryRuntimeDashboard["statusFacets"];
  referralSourceFacets: TerritoryRuntimeDashboard["referralSourceFacets"];
  pins: TerritoryAccountPin[];
}

interface TerritoryOverlaysResponse {
  ok: boolean;
  boundaries: TerritoryBoundaryRuntime[];
  markers: TerritoryMarkerRuntime[];
}

interface MapConfigResponse {
  ok: boolean;
  browserApiKey: string | null;
  configured: boolean;
}

interface AccountResponse {
  ok: boolean;
  detail: AccountRuntimeDetail;
}

interface TerritoryWorkspaceProps {
  orgSlug: string;
  initialDashboard: TerritoryRuntimeDashboard;
}

const googleMapsScriptPromises = new Map<string, Promise<GoogleNamespace>>();
const repPalette = ["#d74314", "#1958d6", "#209365", "#8b5cf6", "#c2410c", "#0f766e", "#be123c", "#4f46e5"];

function loadGoogleMaps(apiKey: string) {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps can only load in the browser"));
  }

  const existing = (window as any).google?.maps;
  if (existing) {
    return Promise.resolve((window as any).google);
  }

  const cached = googleMapsScriptPromises.get(apiKey);
  if (cached) {
    return cached;
  }

  const promise = new Promise<GoogleNamespace>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=geometry,places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve((window as any).google);
    script.onerror = () => reject(new Error("Google Maps failed to load"));
    document.head.appendChild(script);
  });

  googleMapsScriptPromises.set(apiKey, promise);
  return promise;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "None";
  }

  return value.slice(0, 10);
}

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function getRepColor(rep: string | null | undefined) {
  const label = rep?.trim() || "Unassigned";
  let hash = 0;
  for (const char of label) {
    hash = (hash * 31 + char.charCodeAt(0)) % 997;
  }

  return repPalette[hash % repPalette.length];
}

function getStatusColor(status: string | null | undefined) {
  const normalized = status?.toLowerCase() ?? "";
  if (normalized.includes("customer")) {
    return "#209365";
  }
  if (normalized.includes("lead")) {
    return "#d74314";
  }
  if (normalized.includes("inactive") || normalized.includes("bad")) {
    return "#d53e2a";
  }
  return "#1958d6";
}

function getNotionHref(detail: AccountRuntimeDetail | null) {
  const identity = detail?.identities.find((item) => item.provider === "notion");
  return identity?.externalId ? `https://www.notion.so/${identity.externalId.replaceAll("-", "")}` : null;
}

function getDirectionsHref(pin: TerritoryAccountPin | null) {
  if (!pin || !hasUsableCoordinates(pin)) {
    return null;
  }

  return `https://www.google.com/maps/dir/?api=1&destination=${pin.latitude},${pin.longitude}`;
}

function hasUsableCoordinates(pin: TerritoryAccountPin) {
  if (pin.latitude === null || pin.longitude === null) {
    return false;
  }

  return !(pin.latitude === 0 && pin.longitude === 0);
}

function buildParams(filters: Filters) {
  const params = new URLSearchParams();
  if (filters.search.trim()) {
    params.set("q", filters.search.trim());
  }
  if (filters.rep) {
    params.set("rep", filters.rep);
  }
  if (filters.status) {
    params.set("status", filters.status);
  }
  if (filters.referralSource) {
    params.set("referralSource", filters.referralSource);
  }
  if (filters.flag) {
    params.set("flag", filters.flag);
  }
  return params;
}

interface Filters {
  search: string;
  rep: string;
  status: string;
  referralSource: string;
  flag: "" | "missing_referral_source" | "missing_sample_delivery";
}

const emptyFilters: Filters = {
  search: "",
  rep: "",
  status: "",
  referralSource: "",
  flag: "",
};

function SelectFilter({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ name: string; count: number }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="relative flex min-w-[150px] flex-1 items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] px-3 py-2 text-sm">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 appearance-none bg-transparent pr-6 text-sm font-semibold outline-none"
      >
        <option value="">All</option>
        {options.map((option) => (
          <option key={option.name} value={option.name}>
            {option.name} ({option.count})
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-[var(--text-tertiary)]" />
    </label>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: string; icon: typeof MapPin }) {
  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4 shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">{label}</p>
        <Icon className="h-4 w-4 text-[var(--accent-secondary-strong)]" />
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{value}</p>
    </div>
  );
}

function PinRow({
  pin,
  active,
  selected,
  onFocus,
  onToggleRoute,
}: {
  pin: TerritoryAccountPin;
  active: boolean;
  selected: boolean;
  onFocus: () => void;
  onToggleRoute: () => void;
}) {
  return (
    <div
      className={classNames(
        "grid gap-3 border-b border-[var(--border-subtle)] p-4 last:border-b-0 md:grid-cols-[1fr_auto]",
        active && "bg-[rgba(25,88,214,0.08)]",
      )}
    >
      <button type="button" className="min-w-0 text-left" onClick={onFocus}>
        <div className="flex items-start gap-3">
          <span
            className="mt-1 h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: pin.salesRepNames[0] ? getRepColor(pin.salesRepNames[0]) : getStatusColor(pin.status) }}
          />
          <span className="min-w-0">
            <span className="block truncate font-semibold">{pin.name}</span>
            <span className="mt-1 block text-sm text-[var(--text-secondary)]">
              {[pin.city, pin.state].filter(Boolean).join(", ") || "No location"} / {pin.salesRepNames.join(", ") || "No rep"}
            </span>
            <span className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-[var(--text-tertiary)]">
              {pin.status ? <span>{pin.status}</span> : null}
              {pin.referralSource ? <span>{pin.referralSource}</span> : <span>No referral</span>}
              <span>Last order: {formatDate(pin.lastOrderDate)}</span>
            </span>
          </span>
        </div>
      </button>
      <button
        type="button"
        onClick={onToggleRoute}
        className={classNames(
          "inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold",
          selected
            ? "border-[var(--accent-primary)] bg-[rgba(215,67,20,0.1)] text-[var(--accent-primary-strong)]"
            : "border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-[var(--text-secondary)]",
        )}
      >
        {selected ? <Check className="h-4 w-4" /> : <Route className="h-4 w-4" />}
        Route
      </button>
    </div>
  );
}

export function TerritoryWorkspace({ orgSlug, initialDashboard }: TerritoryWorkspaceProps) {
  const [view, setView] = useState<"map" | "list">("map");
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [data, setData] = useState<TerritoryPinsResponse>({
    ok: true,
    counts: initialDashboard.counts,
    appliedFilters: initialDashboard.appliedFilters,
    repFacets: initialDashboard.repFacets,
    statusFacets: initialDashboard.statusFacets,
    referralSourceFacets: initialDashboard.referralSourceFacets,
    pins: initialDashboard.pins,
  });
  const [overlays, setOverlays] = useState<TerritoryOverlaysResponse>({ ok: true, boundaries: [], markers: [] });
  const [mapConfig, setMapConfig] = useState<MapConfigResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(initialDashboard.pins[0]?.id ?? null);
  const [routeStopIds, setRouteStopIds] = useState<string[]>([]);
  const [detail, setDetail] = useState<AccountRuntimeDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [checkInNote, setCheckInNote] = useState("");
  const [savingCheckIn, setSavingCheckIn] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GoogleMap | null>(null);
  const markerRefs = useRef<GoogleMarker[]>([]);
  const polygonRefs = useRef<GooglePolygon[]>([]);
  const overlayMarkerRefs = useRef<GoogleMarker[]>([]);
  const routeLineRef = useRef<GooglePolyline | null>(null);
  const directionsRendererRef = useRef<GoogleDirectionsRenderer | null>(null);

  const pins = data.pins;
  const selectedPin = useMemo(() => pins.find((pin) => pin.id === selectedId) ?? null, [pins, selectedId]);
  const routeStops = useMemo(() => routeStopIds.map((id) => pins.find((pin) => pin.id === id)).filter((pin): pin is TerritoryAccountPin => Boolean(pin)), [pins, routeStopIds]);
  const mappablePinCount = useMemo(() => pins.filter(hasUsableCoordinates).length, [pins]);
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const loadPins = useCallback(async () => {
    setLoading(true);
    try {
      const params = buildParams(filters);
      const response = await fetch(`/api/runtime/organizations/${orgSlug}/territory/pins?${params.toString()}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`Pins request failed: ${response.status}`);
      }
      const payload = (await response.json()) as TerritoryPinsResponse;
      setData(payload);
      setSelectedId((current) => (current && payload.pins.some((pin) => pin.id === current) ? current : payload.pins[0]?.id ?? null));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Territory refresh failed");
    } finally {
      setLoading(false);
    }
  }, [filters, orgSlug]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadPins();
    }, 250);
    return () => window.clearTimeout(timeoutId);
  }, [loadPins]);

  useEffect(() => {
    async function loadRuntimeConfig() {
      const [configResponse, overlaysResponse] = await Promise.all([
        fetch(`/api/runtime/organizations/${orgSlug}/territory/map-config`, { cache: "no-store" }),
        fetch(`/api/runtime/organizations/${orgSlug}/territory/overlays`, { cache: "no-store" }),
      ]);
      if (configResponse.ok) {
        setMapConfig((await configResponse.json()) as MapConfigResponse);
      }
      if (overlaysResponse.ok) {
        setOverlays((await overlaysResponse.json()) as TerritoryOverlaysResponse);
      }
    }

    void loadRuntimeConfig().catch((error: unknown) => setNotice(error instanceof Error ? error.message : "Map config failed"));
  }, [orgSlug]);

  useEffect(() => {
    async function loadDetail() {
      if (!selectedId) {
        setDetail(null);
        return;
      }

      setDetailLoading(true);
      try {
        const response = await fetch(`/api/runtime/organizations/${orgSlug}/accounts/${selectedId}`, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Account request failed: ${response.status}`);
        }
        const payload = (await response.json()) as AccountResponse;
        setDetail(payload.detail);
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "Account detail failed");
      } finally {
        setDetailLoading(false);
      }
    }

    void loadDetail();
  }, [orgSlug, selectedId]);

  useEffect(() => {
    if (!mapConfig?.browserApiKey || !mapElementRef.current || mapRef.current) {
      return;
    }

    void loadGoogleMaps(mapConfig.browserApiKey)
      .then((google) => {
        if (!mapElementRef.current || mapRef.current) {
          return;
        }

        mapRef.current = new google.maps.Map(mapElementRef.current, {
          center: { lat: 40.73, lng: -73.93 },
          zoom: 11,
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
          clickableIcons: false,
        });
        setMapReady(true);
      })
      .catch((error: unknown) => setNotice(error instanceof Error ? error.message : "Google Maps failed to load"));
  }, [mapConfig]);

  useEffect(() => {
    const google = (window as any).google;
    const map = mapRef.current;
    if (!google?.maps || !map) {
      return;
    }

    markerRefs.current.forEach((marker) => marker.setMap(null));
    markerRefs.current = [];

    const bounds = new google.maps.LatLngBounds();
    for (const pin of pins) {
      if (!hasUsableCoordinates(pin)) {
        continue;
      }

      const color = pin.salesRepNames[0] ? getRepColor(pin.salesRepNames[0]) : getStatusColor(pin.status);
      const marker = new google.maps.Marker({
        map,
        position: { lat: pin.latitude, lng: pin.longitude },
        title: pin.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: color,
          fillOpacity: pin.id === selectedId ? 1 : 0.88,
          strokeColor: "#ffffff",
          strokeWeight: pin.id === selectedId ? 3 : 2,
          scale: pin.id === selectedId ? 9 : 7,
        },
      });

      marker.addListener("click", () => setSelectedId(pin.id));
      markerRefs.current.push(marker);
      bounds.extend(marker.getPosition());
    }

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, 48);
    }
  }, [mapReady, pins, selectedId]);

  useEffect(() => {
    const google = (window as any).google;
    const map = mapRef.current;
    if (!google?.maps || !map) {
      return;
    }

    polygonRefs.current.forEach((polygon) => polygon.setMap(null));
    overlayMarkerRefs.current.forEach((marker) => marker.setMap(null));
    polygonRefs.current = [];
    overlayMarkerRefs.current = [];

    for (const boundary of overlays.boundaries) {
      if (!boundary.isVisibleByDefault || boundary.coordinates.length < 3) {
        continue;
      }

      const polygon = new google.maps.Polygon({
        paths: boundary.coordinates.map(([lng, lat]) => ({ lat, lng })),
        strokeColor: boundary.color,
        strokeOpacity: 0.9,
        strokeWeight: boundary.borderWidth,
        fillColor: boundary.color,
        fillOpacity: 0.08,
        map,
      });
      polygonRefs.current.push(polygon);
    }

    for (const markerRow of overlays.markers) {
      if (!markerRow.isVisibleByDefault) {
        continue;
      }

      const marker = new google.maps.Marker({
        map,
        position: { lat: markerRow.latitude, lng: markerRow.longitude },
        title: markerRow.name,
        icon: {
          path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          fillColor: markerRow.color,
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
          scale: 6,
        },
      });
      overlayMarkerRefs.current.push(marker);
    }
  }, [mapReady, overlays]);

  useEffect(() => {
    const google = (window as any).google;
    const map = mapRef.current;
    if (!google?.maps || !map) {
      return;
    }

    routeLineRef.current?.setMap(null);
    routeLineRef.current = null;
    directionsRendererRef.current?.setMap(null);
    directionsRendererRef.current = null;

    const stops = routeStops.filter(hasUsableCoordinates);
    if (stops.length < 2) {
      return;
    }

    const path = stops.map((pin) => ({ lat: pin.latitude as number, lng: pin.longitude as number }));
    const renderer = new google.maps.DirectionsRenderer({
      suppressMarkers: true,
      preserveViewport: true,
      polylineOptions: {
        strokeColor: "#1958d6",
        strokeOpacity: 0.9,
        strokeWeight: 5,
      },
    });
    const service = new google.maps.DirectionsService();
    renderer.setMap(map);
    directionsRendererRef.current = renderer;

    service.route(
      {
        origin: path[0],
        destination: path[path.length - 1],
        waypoints: path.slice(1, -1).map((location) => ({ location, stopover: true })),
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: true,
      },
      (result: unknown, status: string) => {
        if (status === "OK") {
          renderer.setDirections(result);
          return;
        }

        const fallback = new google.maps.Polyline({
          path,
          strokeColor: "#1958d6",
          strokeOpacity: 0.65,
          strokeWeight: 4,
          map,
        });
        routeLineRef.current = fallback;
      },
    );
  }, [mapReady, routeStops]);

  function updateFilter<Key extends keyof Filters>(key: Key, value: Filters[Key]) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function focusPin(pin: TerritoryAccountPin) {
    setSelectedId(pin.id);
    setView("map");
    const map = mapRef.current;
    if (map && pin.latitude !== null && pin.longitude !== null) {
      map.panTo({ lat: pin.latitude, lng: pin.longitude });
      map.setZoom(Math.max(map.getZoom() ?? 12, 14));
    }
  }

  function toggleRouteStop(pinId: string) {
    setRouteStopIds((current) => (current.includes(pinId) ? current.filter((id) => id !== pinId) : [...current, pinId]));
  }

  function openCurrentLocation() {
    if (!navigator.geolocation) {
      setNotice("Browser location is not available");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        mapRef.current?.panTo({ lat: position.coords.latitude, lng: position.coords.longitude });
        mapRef.current?.setZoom(13);
      },
      () => setNotice("Location permission was not granted"),
      { enableHighAccuracy: true, timeout: 8_000 },
    );
  }

  async function submitCheckIn() {
    if (!selectedId || !checkInNote.trim()) {
      return;
    }

    setSavingCheckIn(true);
    try {
      const response = await fetch(`/api/runtime/organizations/${orgSlug}/accounts/${selectedId}/check-ins`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ note: checkInNote.trim() }),
      });
      if (!response.ok) {
        throw new Error(`Check-in failed: ${response.status}`);
      }
      setCheckInNote("");
      setNotice("Check-in saved");
      const accountResponse = await fetch(`/api/runtime/organizations/${orgSlug}/accounts/${selectedId}`, { cache: "no-store" });
      if (accountResponse.ok) {
        const payload = (await accountResponse.json()) as AccountResponse;
        setDetail(payload.detail);
      }
      void loadPins();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Check-in failed");
    } finally {
      setSavingCheckIn(false);
    }
  }

  const directionsHref = getDirectionsHref(selectedPin);
  const notionHref = getNotionHref(detail);
  const organizationName = initialDashboard.organization.name;

  return (
    <div className="flex min-h-[calc(100dvh-84px)] flex-col bg-[#e8e7e1] text-[var(--text-primary)]">
      <div className="border-b border-[var(--border-subtle)] bg-[color:color-mix(in_srgb,var(--background)_90%,white)] px-4 py-4 md:px-6">
        <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-4">
          <div className="flex flex-col justify-between gap-3 xl:flex-row xl:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent-secondary-strong)]">
                {organizationName} territory
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em] md:text-3xl">Field map console</h1>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:w-[760px]">
              <Metric label="Accounts" value={formatNumber(data.counts.accounts)} icon={Users} />
              <Metric label="Map pins" value={formatNumber(data.counts.geocodedPins)} icon={MapPin} />
              <Metric label="Orders" value={formatNumber(data.counts.orders)} icon={CalendarDays} />
              <Metric label="Overlays" value={formatNumber(data.counts.territoryBoundaries + data.counts.territoryMarkers)} icon={Home} />
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-3 lg:flex-row lg:items-center">
            <div className="flex rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-1">
              <button
                type="button"
                onClick={() => setView("map")}
                className={classNames("inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold", view === "map" && "bg-[var(--text-primary)] text-white")}
                style={view === "map" ? { color: "#fff" } : undefined}
              >
                <MapIcon className="h-4 w-4" />
                Map
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                className={classNames("inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold", view === "list" && "bg-[var(--text-primary)] text-white")}
                style={view === "list" ? { color: "#fff" } : undefined}
              >
                <List className="h-4 w-4" />
                List
              </button>
            </div>

            <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] px-3 py-2">
              <Search className="h-4 w-4 text-[var(--text-tertiary)]" />
              <input
                value={filters.search}
                onChange={(event) => updateFilter("search", event.target.value)}
                placeholder="Search accounts, city, state"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--text-tertiary)]"
              />
            </label>
            <button
              type="button"
              onClick={() => void loadPins()}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] px-4 py-2 text-sm font-semibold"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <SelectFilter label="Rep" value={filters.rep} options={data.repFacets} onChange={(value) => updateFilter("rep", value)} />
            <SelectFilter label="Status" value={filters.status} options={data.statusFacets} onChange={(value) => updateFilter("status", value)} />
            <SelectFilter label="Referral" value={filters.referralSource} options={data.referralSourceFacets} onChange={(value) => updateFilter("referralSource", value)} />
            <button
              type="button"
              onClick={() => updateFilter("flag", filters.flag === "missing_referral_source" ? "" : "missing_referral_source")}
              className={classNames(
                "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold",
                filters.flag === "missing_referral_source"
                  ? "border-[var(--accent-primary)] bg-[rgba(215,67,20,0.1)] text-[var(--accent-primary-strong)]"
                  : "border-[var(--border-subtle)] bg-[var(--surface-card)] text-[var(--text-secondary)]",
              )}
            >
              <Filter className="h-4 w-4" />
              No referral ({formatNumber(data.counts.noReferralSource)})
            </button>
            <button
              type="button"
              onClick={() => setFilters(emptyFilters)}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] px-3 py-2 text-sm font-semibold text-[var(--text-secondary)]"
            >
              <X className="h-4 w-4" />
              Clear {activeFilterCount ? `(${activeFilterCount})` : ""}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-[1800px] flex-1 gap-0 xl:grid-cols-[minmax(0,1fr)_420px]">
        <main className="relative min-h-[560px]">
          {view === "map" ? (
            <div className="absolute inset-0">
              {mapConfig === null ? (
                <div className="flex h-full min-h-[560px] items-center justify-center bg-[var(--surface-elevated)] p-8 text-center text-sm font-semibold text-[var(--text-secondary)]">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading map
                </div>
              ) : mapConfig.configured ? (
                <div ref={mapElementRef} className="h-full min-h-[560px] w-full" />
              ) : (
                <div className="flex h-full min-h-[560px] items-center justify-center bg-[var(--surface-elevated)] p-8 text-center text-sm text-[var(--text-secondary)]">
                  Google Maps is not configured for this organization.
                </div>
              )}
              <div className="pointer-events-none absolute left-4 top-4 flex flex-wrap gap-2">
                <div className="pointer-events-auto rounded-full border border-[var(--border-subtle)] bg-[var(--surface-card)] px-4 py-2 text-sm font-semibold shadow-[var(--shadow-soft)]">
                  Showing {formatNumber(mappablePinCount)} mapped pins
                </div>
                <button
                  type="button"
                  onClick={openCurrentLocation}
                  className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-card)] px-4 py-2 text-sm font-semibold shadow-[var(--shadow-soft)]"
                >
                  <LocateFixed className="h-4 w-4" />
                  Locate
                </button>
              </div>
            </div>
          ) : (
            <div className="min-h-[560px] overflow-auto bg-[var(--surface-card)]">
              {pins.map((pin) => (
                <PinRow
                  key={pin.id}
                  pin={pin}
                  active={pin.id === selectedId}
                  selected={routeStopIds.includes(pin.id)}
                  onFocus={() => focusPin(pin)}
                  onToggleRoute={() => toggleRouteStop(pin.id)}
                />
              ))}
              {!pins.length ? <div className="p-8 text-sm text-[var(--text-secondary)]">No accounts match the current filters.</div> : null}
            </div>
          )}
        </main>

        <aside className="border-l border-[var(--border-subtle)] bg-[var(--surface-card)]">
          <div className="sticky top-[84px] max-h-[calc(100dvh-84px)] overflow-auto">
            <div className="border-b border-[var(--border-subtle)] p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-tertiary)]">Selected account</p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em]">{selectedPin?.name ?? "No account selected"}</h2>
                </div>
                {detailLoading ? <Loader2 className="h-5 w-5 animate-spin text-[var(--text-tertiary)]" /> : null}
              </div>
              {selectedPin ? (
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  {[selectedPin.city, selectedPin.state].filter(Boolean).join(", ") || "No location"} /{" "}
                  {selectedPin.salesRepNames.join(", ") || "No rep"}
                </p>
              ) : null}
            </div>

            {selectedPin ? (
              <div className="space-y-5 p-5">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => toggleRouteStop(selectedPin.id)}
                    className={classNames(
                      "inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold",
                      routeStopIds.includes(selectedPin.id)
                        ? "border-[var(--accent-primary)] bg-[rgba(215,67,20,0.1)] text-[var(--accent-primary-strong)]"
                        : "border-[var(--border-subtle)] bg-[var(--surface-elevated)]",
                    )}
                  >
                    <Route className="h-4 w-4" />
                    {routeStopIds.includes(selectedPin.id) ? "Remove stop" : "Add stop"}
                  </button>
                  {directionsHref ? (
                    <a
                      href={directionsHref}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-3 text-sm font-semibold"
                    >
                      <Navigation className="h-4 w-4" />
                      Directions
                    </a>
                  ) : null}
                </div>

                <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Map/detail agreement</p>
                  <dl className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-[var(--text-tertiary)]">Status</dt>
                      <dd className="font-semibold">{selectedPin.status ?? "None"}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-[var(--text-tertiary)]">Referral</dt>
                      <dd className="text-right font-semibold">{selectedPin.referralSource ?? "None"}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-[var(--text-tertiary)]">Last order</dt>
                      <dd className="font-semibold">{formatDate(selectedPin.lastOrderDate)}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-[var(--text-tertiary)]">Last contacted</dt>
                      <dd className="font-semibold">{formatDate(detail?.account.lastContactedAt ?? selectedPin.lastContactedAt)}</dd>
                    </div>
                  </dl>
                </div>

                {detail ? (
                  <>
                    <div className="rounded-2xl border border-[var(--border-subtle)] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold">Account detail</p>
                        <a href={`/accounts/${detail.account.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent-primary-strong)]">
                          Open
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                      <dl className="mt-3 space-y-2 text-sm">
                        <div className="flex justify-between gap-4">
                          <dt className="text-[var(--text-tertiary)]">Orders</dt>
                          <dd className="font-semibold">
                            {formatNumber(detail.orderSummary.totalOrders)} / {formatMoney(detail.orderSummary.totalRevenue)}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-[var(--text-tertiary)]">Contacts</dt>
                          <dd className="font-semibold">{formatNumber(detail.contacts.length)}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-[var(--text-tertiary)]">License</dt>
                          <dd className="max-w-[60%] truncate text-right font-semibold">{detail.account.licenseNumber ?? "None"}</dd>
                        </div>
                      </dl>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {notionHref ? (
                          <a
                            href={notionHref}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-2 text-xs font-semibold"
                          >
                            Source CRM
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        ) : null}
                        {detail.identities.slice(0, 4).map((identity) => (
                          <span key={identity.id} className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)]">
                            {identity.provider}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[var(--border-subtle)] p-4">
                      <div className="flex items-center gap-2">
                        <MessageSquareText className="h-4 w-4 text-[var(--accent-primary)]" />
                        <p className="font-semibold">Field check-in</p>
                      </div>
                      <textarea
                        value={checkInNote}
                        onChange={(event) => setCheckInNote(event.target.value)}
                        rows={4}
                        placeholder="Log what happened at this account..."
                        className="mt-3 w-full resize-none rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-3 text-sm outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => void submitCheckIn()}
                        disabled={!checkInNote.trim() || savingCheckIn}
                        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--text-primary)] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                        style={{ color: "#fff" }}
                      >
                        {savingCheckIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        Save check-in
                      </button>
                    </div>

                    <div className="rounded-2xl border border-[var(--border-subtle)] p-4">
                      <p className="font-semibold">Recent activity</p>
                      <div className="mt-3 space-y-3">
                        {detail.activities.slice(0, 4).map((activity) => (
                          <div key={activity.id} className="rounded-xl bg-[var(--surface-elevated)] p-3 text-sm">
                            <p className="font-semibold">{activity.summary}</p>
                            <p className="mt-1 text-[var(--text-tertiary)]">{formatDate(activity.occurredAt)}</p>
                          </div>
                        ))}
                        {!detail.activities.length ? <p className="text-sm text-[var(--text-secondary)]">No activity yet.</p> : null}
                      </div>
                    </div>
                  </>
                ) : null}

                <div className="rounded-2xl border border-[var(--border-subtle)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">Route plan</p>
                    <button type="button" onClick={() => setRouteStopIds([])} className="text-sm font-semibold text-[var(--text-tertiary)]">
                      Clear
                    </button>
                  </div>
                  <div className="mt-3 space-y-2">
                    {routeStops.map((pin, index) => (
                      <div key={pin.id} className="flex items-center gap-3 rounded-xl bg-[var(--surface-elevated)] p-3 text-sm">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--text-primary)] text-xs font-semibold text-white" style={{ color: "#fff" }}>
                          {index + 1}
                        </span>
                        <button type="button" className="min-w-0 flex-1 truncate text-left font-semibold" onClick={() => focusPin(pin)}>
                          {pin.name}
                        </button>
                        <button type="button" onClick={() => toggleRouteStop(pin.id)}>
                          <X className="h-4 w-4 text-[var(--text-tertiary)]" />
                        </button>
                      </div>
                    ))}
                    {!routeStops.length ? <p className="text-sm text-[var(--text-secondary)]">Add accounts to preview a route on the map.</p> : null}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5 text-sm text-[var(--text-secondary)]">Select a pin or account row to start working.</div>
            )}
          </div>
        </aside>
      </div>

      {notice ? (
        <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4 text-sm font-semibold shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between gap-4">
            <span>{notice}</span>
            <button type="button" onClick={() => setNotice(null)}>
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
