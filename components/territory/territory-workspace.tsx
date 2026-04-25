"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import type * as Leaflet from "leaflet";
import {
  Check,
  ChevronDown,
  ExternalLink,
  Filter,
  List,
  Loader2,
  LocateFixed,
  Map as MapIcon,
  MessageSquareText,
  Navigation,
  RefreshCw,
  Route,
  Search,
  X,
} from "lucide-react";
import type {
  AccountRuntimeDetail,
  TerritoryAccountPin,
  TerritoryBoundaryRuntime,
  TerritoryMarkerRuntime,
  TerritoryRuntimeDashboard,
} from "@/lib/domain/runtime";
import type { WorkspaceDefinition, WorkspaceTerritoryColorMode } from "@/lib/domain/workspace";
import { resolveTenantPluginSettings } from "@/lib/application/runtime/plugin-settings";
import { orgScopedHref } from "@/lib/presentation/org-slug";

type GoogleNamespace = any;
type GoogleMap = any;
type GoogleDirectionsRenderer = any;
type MapProvider = "google_maps" | "openstreetmap";
type LeafletNamespace = typeof Leaflet;
type LeafletMap = Leaflet.Map;
type LayerCleanup = () => void;
type MapHandle =
  | { provider: "google_maps"; map: GoogleMap }
  | { provider: "openstreetmap"; map: LeafletMap; leaflet: LeafletNamespace };

interface TerritoryPinsResponse {
  ok: boolean;
  counts: TerritoryRuntimeDashboard["counts"];
  appliedFilters: TerritoryRuntimeDashboard["appliedFilters"];
  repFacets: TerritoryRuntimeDashboard["repFacets"];
  statusFacets: TerritoryRuntimeDashboard["statusFacets"];
  referralSourceFacets: TerritoryRuntimeDashboard["referralSourceFacets"];
  leadGradeFacets: TerritoryRuntimeDashboard["leadGradeFacets"];
  pins: TerritoryAccountPin[];
}

interface TerritoryOverlaysResponse {
  ok: boolean;
  boundaries: TerritoryBoundaryRuntime[];
  markers: TerritoryMarkerRuntime[];
}

interface MapConfigResponse {
  ok: boolean;
  mapProvider: MapProvider;
  browserApiKey: string | null;
  tileUrlTemplate: string | null;
  tileAttribution: string | null;
  configured: boolean;
  upgraded: boolean;
}

interface AccountResponse {
  ok: boolean;
  detail: AccountRuntimeDetail;
}

interface TerritoryWorkspaceProps {
  orgSlug: string;
  initialDashboard: TerritoryRuntimeDashboard;
  territoryConfig: WorkspaceDefinition["modules"]["territory"] | null;
}

const googleMapsScriptPromises = new Map<string, Promise<GoogleNamespace>>();
let leafletPromise: Promise<LeafletNamespace> | null = null;
const repPalette = ["#d74314", "#1958d6", "#209365", "#8b5cf6", "#c2410c", "#0f766e", "#be123c", "#4f46e5"];
const defaultOpenStreetMapTileUrlTemplate = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const defaultOpenStreetMapAttribution = "&copy; OpenStreetMap contributors";

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

function loadLeaflet() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Leaflet can only load in the browser"));
  }

  if (!leafletPromise) {
    leafletPromise = import("leaflet");
  }

  return leafletPromise;
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

function teardownMap(
  mapRef: MutableRefObject<MapHandle | null>,
  markerRefs: MutableRefObject<LayerCleanup[]>,
  polygonRefs: MutableRefObject<LayerCleanup[]>,
  overlayMarkerRefs: MutableRefObject<LayerCleanup[]>,
  routeLineRef: MutableRefObject<LayerCleanup | null>,
  directionsRendererRef: MutableRefObject<GoogleDirectionsRenderer | null>,
  lastFitSignatureRef: MutableRefObject<string>,
) {
  markerRefs.current.forEach((cleanup) => cleanup());
  polygonRefs.current.forEach((cleanup) => cleanup());
  overlayMarkerRefs.current.forEach((cleanup) => cleanup());
  markerRefs.current = [];
  polygonRefs.current = [];
  overlayMarkerRefs.current = [];
  routeLineRef.current?.();
  routeLineRef.current = null;
  directionsRendererRef.current?.setMap(null);
  directionsRendererRef.current = null;
  lastFitSignatureRef.current = "";

  const handle = mapRef.current;
  if (!handle) {
    return;
  }

  if (handle.provider === "openstreetmap") {
    handle.map.remove();
  } else {
    const google = (window as any).google;
    google?.maps?.event?.clearInstanceListeners?.(handle.map);
  }

  mapRef.current = null;
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

function getOrderColor(lastOrderDate: string | null | undefined) {
  if (!lastOrderDate) {
    return "#6b7280";
  }

  const days = Math.floor((Date.now() - new Date(lastOrderDate).getTime()) / 86_400_000);
  if (days <= 30) {
    return "#209365";
  }
  if (days <= 90) {
    return "#1958d6";
  }

  return "#d53e2a";
}

function getScoreColor(score: TerritoryAccountPin["leadScoreSummary"]) {
  switch (score?.grade) {
    case "A":
      return "#15825f";
    case "B":
      return "#1958d6";
    case "C":
      return "#d97706";
    case "D":
      return "#d53e2a";
    default:
      return "#6b7280";
  }
}

function getPinColor(pin: TerritoryAccountPin, mode: ColorMode) {
  if (mode === "score") {
    return getScoreColor(pin.leadScoreSummary);
  }
  if (mode === "status") {
    return getStatusColor(pin.status);
  }
  if (mode === "orders") {
    return getOrderColor(pin.lastOrderDate);
  }

  return pin.salesRepNames[0] ? getRepColor(pin.salesRepNames[0]) : "#6b7280";
}

function getPinLabel(pin: TerritoryAccountPin, mode: ColorMode) {
  if (mode === "score") {
    const grade = pin.leadScoreSummary?.grade ?? "Unscored";
    return grade === "Unscored" ? "?" : grade;
  }
  if (mode === "orders") {
    return pin.lastOrderDate ? "O" : "N";
  }
  if (mode === "status") {
    return (pin.status ?? "?").trim().slice(0, 1).toUpperCase() || "?";
  }

  return (pin.salesRepNames[0] ?? "?").trim().slice(0, 1).toUpperCase() || "?";
}

function buildMarkerIcon(google: GoogleNamespace, pin: TerritoryAccountPin, selected: boolean, mode: ColorMode) {
  const color = getPinColor(pin, mode);
  const size = selected ? 44 : 36;
  const strokeWidth = selected ? 4 : 2;
  const svg = `
    <svg width="${size}" height="${size + 8}" viewBox="0 0 ${size} ${size + 8}" xmlns="http://www.w3.org/2000/svg">
      <path d="M${size / 2} ${size + 4}C${size / 2} ${size + 4} ${size * 0.18} ${size * 0.58} ${size * 0.18} ${size * 0.36}C${size * 0.18} ${size * 0.16} ${size * 0.33} 4 ${size / 2} 4C${size * 0.67} 4 ${size * 0.82} ${size * 0.16} ${size * 0.82} ${size * 0.36}C${size * 0.82} ${size * 0.58} ${size / 2} ${size + 4} ${size / 2} ${size + 4}Z" fill="${color}" stroke="white" stroke-width="${strokeWidth}"/>
      <circle cx="${size / 2}" cy="${size * 0.36}" r="${selected ? 10 : 8}" fill="rgba(255,255,255,0.22)" stroke="rgba(255,255,255,0.65)" stroke-width="1"/>
    </svg>`;

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(size, size + 8),
    anchor: new google.maps.Point(size / 2, size + 4),
    labelOrigin: new google.maps.Point(size / 2, size * 0.36 + 1),
  };
}

function buildLiteGoogleMarkerIcon(google: GoogleNamespace, pin: TerritoryAccountPin, selected: boolean, mode: ColorMode) {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: getPinColor(pin, mode),
    fillOpacity: 0.92,
    strokeColor: "#ffffff",
    strokeWeight: selected ? 3 : 2,
    scale: selected ? 9 : 7,
  };
}

function buildLeafletMarkerHtml(pin: TerritoryAccountPin, selected: boolean, mode: ColorMode) {
  const color = getPinColor(pin, mode);
  const size = selected ? 44 : 36;
  const strokeWidth = selected ? 4 : 2;
  const label = getPinLabel(pin, mode);

  return `
    <div style="width:${size}px;height:${size + 8}px;position:relative;">
      <svg width="${size}" height="${size + 8}" viewBox="0 0 ${size} ${size + 8}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M${size / 2} ${size + 4}C${size / 2} ${size + 4} ${size * 0.18} ${size * 0.58} ${size * 0.18} ${size * 0.36}C${size * 0.18} ${size * 0.16} ${size * 0.33} 4 ${size / 2} 4C${size * 0.67} 4 ${size * 0.82} ${size * 0.16} ${size * 0.82} ${size * 0.36}C${size * 0.82} ${size * 0.58} ${size / 2} ${size + 4} ${size / 2} ${size + 4}Z" fill="${color}" stroke="white" stroke-width="${strokeWidth}"/>
        <circle cx="${size / 2}" cy="${size * 0.36}" r="${selected ? 10 : 8}" fill="rgba(255,255,255,0.22)" stroke="rgba(255,255,255,0.65)" stroke-width="1"/>
      </svg>
      <span style="position:absolute;left:0;top:${size * 0.36 - 8}px;width:${size}px;text-align:center;color:#fff;font-size:${selected ? 12 : 11}px;font-weight:800;line-height:16px;">${label}</span>
    </div>`;
}

function getNotionHref(detail: AccountRuntimeDetail | null) {
  const identity = detail?.identities.find((item) => item.provider === "notion");
  return identity?.externalId ? `https://www.notion.so/${identity.externalId.replaceAll("-", "")}` : null;
}

function getDirectionsHref(pin: TerritoryAccountPin | null, mapProvider: MapProvider = "openstreetmap") {
  if (!pin || !hasUsableCoordinates(pin)) {
    return null;
  }

  if (mapProvider === "google_maps") {
    return `https://www.google.com/maps/dir/?api=1&destination=${pin.latitude},${pin.longitude}`;
  }

  return `https://www.openstreetmap.org/directions?from=&to=${pin.latitude}%2C${pin.longitude}`;
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
  if (filters.leadGrade) {
    params.set("leadGrade", filters.leadGrade);
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
  leadGrade: string;
  flag: "" | "missing_referral_source" | "missing_sample_delivery" | "no_address_available" | "dnc_flagged";
}

type ColorMode = WorkspaceTerritoryColorMode;

const emptyFilters: Filters = {
  search: "",
  rep: "",
  status: "",
  referralSource: "",
  leadGrade: "",
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

function PinRow({
  pin,
  active,
  selected,
  routePlanningEnabled,
  colorMode,
  onFocus,
  onToggleRoute,
}: {
  pin: TerritoryAccountPin;
  active: boolean;
  selected: boolean;
  routePlanningEnabled: boolean;
  colorMode: ColorMode;
  onFocus: () => void;
  onToggleRoute: () => void;
}) {
  const score = pin.leadScoreSummary;
  const location = [pin.city, pin.state].filter(Boolean).join(", ") || "No location";
  return (
    <div
      className={classNames(
        "grid gap-3 border-b border-[var(--border-subtle)] p-4 last:border-b-0 md:grid-cols-[1fr_auto]",
        active && "bg-[rgba(25,88,214,0.08)]",
      )}
    >
      <button
        type="button"
        className="min-w-0 text-left"
        onClick={onFocus}
        aria-label={`Open ${pin.name}`}
        data-testid={`territory-pin-row-${pin.id}`}
      >
        <div className="flex items-start gap-3">
          <span
            className="mt-1 h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: getPinColor(pin, colorMode) }}
          />
          <span className="min-w-0">
            <span className="block truncate font-semibold">{pin.name}</span>
            <span className="mt-1 block text-sm text-[var(--text-secondary)]">
              {score
                ? `${location} / Score ${score.score ?? "-"} (${score.grade})`
                : `${location} / ${pin.salesRepNames.join(", ") || "No rep"}`}
            </span>
            <span className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-[var(--text-tertiary)]">
              {pin.status ? <span>{pin.status}</span> : null}
              {score ? (
                <span>
                  {score.closedOrders} closed / {score.lostOrders} lost
                </span>
              ) : pin.referralSource ? (
                <span>{pin.referralSource}</span>
              ) : (
                <span>No referral</span>
              )}
              <span>Last order: {formatDate(pin.lastOrderDate)}</span>
            </span>
          </span>
        </div>
      </button>
      {routePlanningEnabled ? (
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
      ) : null}
    </div>
  );
}

const colorModeLabels: Record<ColorMode, string> = {
  rep: "Rep",
  score: "Score",
  status: "Status",
  orders: "Orders",
};

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function readNarrowViewport() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia("(max-width: 767px)").matches;
}

export function TerritoryWorkspace({ orgSlug, initialDashboard, territoryConfig }: TerritoryWorkspaceProps) {
  const supportsLeadGradeFilter = territoryConfig?.leadGradeFilter ?? false;
  const enabledFlags = new Set(territoryConfig?.enabledFlags ?? []);
  const availableColorModes =
    territoryConfig?.colorModes?.length
      ? territoryConfig.colorModes
      : supportsLeadGradeFilter
        ? (["score", "status", "orders"] satisfies ColorMode[])
        : (["rep", "status", "orders"] satisfies ColorMode[]);
  const defaultColorMode =
    territoryConfig?.defaultColorMode && availableColorModes.includes(territoryConfig.defaultColorMode)
      ? territoryConfig.defaultColorMode
      : availableColorModes[0] ?? "rep";
  const pluginSettings = resolveTenantPluginSettings(orgSlug, initialDashboard.organization.settings);
  const routePlanningEnabled = pluginSettings.routePlanning.enabled;
  const initialIsNarrowViewport = readNarrowViewport();
  const initialPreferListView = initialIsNarrowViewport && initialDashboard.counts.geocodedPins > 1200;
  const [view, setView] = useState<"map" | "list">(initialPreferListView ? "list" : "map");
  const [colorMode, setColorMode] = useState<ColorMode>(defaultColorMode);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [data, setData] = useState<TerritoryPinsResponse>({
    ok: true,
    counts: initialDashboard.counts,
    appliedFilters: initialDashboard.appliedFilters,
    repFacets: initialDashboard.repFacets,
    statusFacets: initialDashboard.statusFacets,
    referralSourceFacets: initialDashboard.referralSourceFacets,
    leadGradeFacets: initialDashboard.leadGradeFacets,
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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(!initialIsNarrowViewport);
  const [detailsOpen, setDetailsOpen] = useState(!initialIsNarrowViewport);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [isNarrowViewport, setIsNarrowViewport] = useState(initialIsNarrowViewport);

  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapHandle | null>(null);
  const markerRefs = useRef<LayerCleanup[]>([]);
  const polygonRefs = useRef<LayerCleanup[]>([]);
  const overlayMarkerRefs = useRef<LayerCleanup[]>([]);
  const routeLineRef = useRef<LayerCleanup | null>(null);
  const directionsRendererRef = useRef<GoogleDirectionsRenderer | null>(null);
  const lastFitSignatureRef = useRef<string>("");
  const mobileViewAutoSwitchedRef = useRef(initialPreferListView);

  const pins = data.pins;
  const selectedPin = useMemo(() => pins.find((pin) => pin.id === selectedId) ?? null, [pins, selectedId]);
  const routeStops = useMemo(
    () =>
      routePlanningEnabled
        ? routeStopIds.map((id) => pins.find((pin) => pin.id === id)).filter((pin): pin is TerritoryAccountPin => Boolean(pin))
        : [],
    [pins, routePlanningEnabled, routeStopIds],
  );
  const mappablePinCount = useMemo(() => pins.filter(hasUsableCoordinates).length, [pins]);
  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const useLiteMarkers = isNarrowViewport || mappablePinCount > 1200;
  const mobileListMode = isNarrowViewport && view === "list";
  const shouldRenderInteractiveMap = Boolean(mapConfig?.configured) && !mobileListMode;

  const focusPin = useCallback((pin: TerritoryAccountPin) => {
    setSelectedId(pin.id);
    setView("map");
    setDetailsOpen(!isNarrowViewport);
    setMobileDetailOpen(isNarrowViewport);
    setConsoleOpen(false);
    setFiltersOpen(false);
    const handle = mapRef.current;
    if (handle && pin.latitude !== null && pin.longitude !== null) {
      if (handle.provider === "google_maps") {
        handle.map.panTo({ lat: pin.latitude, lng: pin.longitude });
        handle.map.setZoom(Math.max(handle.map.getZoom() ?? 12, 14));
        return;
      }

      handle.map.setView([pin.latitude, pin.longitude], Math.max(handle.map.getZoom(), 14), { animate: true });
    }
  }, [isNarrowViewport]);

  useIsomorphicLayoutEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const applyViewport = () => {
      const narrow = mediaQuery.matches;
      setIsNarrowViewport(narrow);
      if (narrow) {
        setConsoleOpen(false);
        setDetailsOpen(false);
        setMobileDetailOpen(false);
        if (mappablePinCount > 1200) {
          setView("list");
          mobileViewAutoSwitchedRef.current = true;
        }
      } else {
        setMobileDetailOpen(false);
      }
    };

    applyViewport();
    mediaQuery.addEventListener("change", applyViewport);
    return () => mediaQuery.removeEventListener("change", applyViewport);
  }, [mappablePinCount]);

  useEffect(() => {
    if (!isNarrowViewport || !selectedPin || view !== "map") {
      setMobileDetailOpen(false);
    }
  }, [isNarrowViewport, selectedPin, view]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.navigator.webdriver) {
      return undefined;
    }

    (window as any).__MAP_APP_TEST = {
      getFirstMappablePinId() {
        return pins.find(hasUsableCoordinates)?.id ?? null;
      },
      getLeafletClickPointForPin(pinId: string) {
        const handle = mapRef.current;
        const element = mapElementRef.current;
        const pin = pins.find((entry) => entry.id === pinId);
        if (!handle || handle.provider !== "openstreetmap" || !element || !pin || !hasUsableCoordinates(pin)) {
          return null;
        }

        const point = handle.map.latLngToContainerPoint([pin.latitude as number, pin.longitude as number]);
        const rect = element.getBoundingClientRect();
        return {
          x: rect.left + point.x,
          y: rect.top + point.y,
        };
      },
    };

    return () => {
      delete (window as any).__MAP_APP_TEST;
    };
  }, [pins]);

  useEffect(() => {
    if (shouldRenderInteractiveMap) {
      return;
    }

    teardownMap(mapRef, markerRefs, polygonRefs, overlayMarkerRefs, routeLineRef, directionsRendererRef, lastFitSignatureRef);
    setMapReady(false);
  }, [shouldRenderInteractiveMap]);

  const invalidateMapSize = useCallback(() => {
    const handle = mapRef.current;
    if (!handle) {
      return;
    }

    if (handle.provider === "openstreetmap") {
      handle.map.invalidateSize({ pan: false });
      return;
    }

    const google = (window as any).google;
    google?.maps?.event?.trigger(handle.map, "resize");
  }, []);

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
    if (!shouldRenderInteractiveMap || !mapConfig || !mapElementRef.current || mapRef.current) {
      return;
    }

    if (mapConfig.mapProvider === "google_maps" && mapConfig.browserApiKey) {
      void loadGoogleMaps(mapConfig.browserApiKey)
        .then((google) => {
          if (!mapElementRef.current || mapRef.current) {
            return;
          }

          const map = new google.maps.Map(mapElementRef.current, {
            center: { lat: 40.73, lng: -73.93 },
            zoom: 10,
            gestureHandling: "greedy",
            zoomControl: true,
            mapTypeControl: true,
            fullscreenControl: true,
            streetViewControl: false,
            clickableIcons: false,
            controlSize: 32,
          });
          mapRef.current = { provider: "google_maps", map };
          setMapReady(true);
        })
        .catch((error: unknown) => setNotice(error instanceof Error ? error.message : "Google Maps failed to load"));
      return;
    }

    void loadLeaflet()
      .then((leaflet) => {
        if (!mapElementRef.current || mapRef.current) {
          return;
        }

        const map = leaflet.map(mapElementRef.current, {
          zoomControl: true,
          attributionControl: true,
          preferCanvas: true,
        });
        map.setView([40.73, -73.93], 10);
        leaflet
          .tileLayer(mapConfig.tileUrlTemplate || defaultOpenStreetMapTileUrlTemplate, {
            attribution: mapConfig.tileAttribution || defaultOpenStreetMapAttribution,
            maxZoom: 19,
          })
          .addTo(map);
        mapRef.current = { provider: "openstreetmap", map, leaflet };
        requestAnimationFrame(() => {
          map.invalidateSize({ pan: false });
          setMapReady(true);
        });
        window.setTimeout(() => map.invalidateSize({ pan: false }), 250);
      })
      .catch((error: unknown) => setNotice(error instanceof Error ? error.message : "OpenStreetMap failed to load"));
  }, [mapConfig, shouldRenderInteractiveMap]);

  useEffect(() => {
    if (!mapReady) {
      return;
    }

    requestAnimationFrame(invalidateMapSize);
    const timeout = window.setTimeout(invalidateMapSize, 250);
    return () => window.clearTimeout(timeout);
  }, [consoleOpen, filtersOpen, invalidateMapSize, mapReady, view]);

  useEffect(() => {
    const element = mapElementRef.current;
    if (!element || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(() => invalidateMapSize());
    observer.observe(element);
    return () => observer.disconnect();
  }, [invalidateMapSize, mapReady]);

  useEffect(() => {
    const handle = mapRef.current;
    if (!handle) {
      return;
    }

    markerRefs.current.forEach((cleanup) => cleanup());
    markerRefs.current = [];

    const fitSignatureParts: string[] = [];

    if (handle.provider === "google_maps") {
      const google = (window as any).google;
      if (!google?.maps) {
        return;
      }

      const bounds = new google.maps.LatLngBounds();
      for (const pin of pins) {
        if (!hasUsableCoordinates(pin)) {
          continue;
        }

        const selected = pin.id === selectedId;
        const marker = new google.maps.Marker({
          map: handle.map,
          position: { lat: pin.latitude, lng: pin.longitude },
          title: pin.name,
          icon: useLiteMarkers
            ? buildLiteGoogleMarkerIcon(google, pin, selected, colorMode)
            : buildMarkerIcon(google, pin, selected, colorMode),
          label: useLiteMarkers
            ? undefined
            : {
                text: getPinLabel(pin, colorMode),
                color: "#ffffff",
                fontSize: selected ? "12px" : "11px",
                fontWeight: "800",
              },
          zIndex: selected ? 1000 : 1,
        });

        marker.addListener("click", () => focusPin(pin));
        markerRefs.current.push(() => marker.setMap(null));
        bounds.extend(marker.getPosition());
        fitSignatureParts.push(`${pin.id}:${pin.latitude}:${pin.longitude}`);
      }

      const nextFitSignature = fitSignatureParts.sort().join("|");
      if (!bounds.isEmpty() && nextFitSignature !== lastFitSignatureRef.current) {
        handle.map.fitBounds(bounds, 48);
        lastFitSignatureRef.current = nextFitSignature;
      }
      return;
    }

    const { leaflet, map } = handle;
    const bounds = leaflet.latLngBounds([]);
    for (const pin of pins) {
      if (!hasUsableCoordinates(pin)) {
        continue;
      }

      const selected = pin.id === selectedId;
      const marker = useLiteMarkers
        ? leaflet
            .circleMarker([pin.latitude as number, pin.longitude as number], {
              radius: selected ? 9 : 7,
              color: "#ffffff",
              weight: selected ? 3 : 2,
              fillColor: getPinColor(pin, colorMode),
              fillOpacity: 0.92,
            })
            .addTo(map)
        : (() => {
            const size = selected ? 44 : 36;
            return leaflet
              .marker([pin.latitude as number, pin.longitude as number], {
                title: pin.name,
                zIndexOffset: selected ? 1000 : 1,
                icon: leaflet.divIcon({
                  html: buildLeafletMarkerHtml(pin, selected, colorMode),
                  className: "runtime-map-pin",
                  iconSize: [size, size + 8],
                  iconAnchor: [size / 2, size + 4],
                }),
              })
              .addTo(map);
          })();

      marker.on("click", () => focusPin(pin));
      markerRefs.current.push(() => marker.remove());
      bounds.extend([pin.latitude as number, pin.longitude as number]);
      fitSignatureParts.push(`${pin.id}:${pin.latitude}:${pin.longitude}`);
    }

    const nextFitSignature = fitSignatureParts.sort().join("|");
    if (bounds.isValid() && nextFitSignature !== lastFitSignatureRef.current) {
      map.fitBounds(bounds, { padding: [48, 48] });
      lastFitSignatureRef.current = nextFitSignature;
    }
  }, [colorMode, focusPin, mapReady, pins, selectedId, useLiteMarkers]);

  useEffect(() => {
    const handle = mapRef.current;
    if (!handle) {
      return;
    }

    polygonRefs.current.forEach((cleanup) => cleanup());
    overlayMarkerRefs.current.forEach((cleanup) => cleanup());
    polygonRefs.current = [];
    overlayMarkerRefs.current = [];

    if (handle.provider === "google_maps") {
      const google = (window as any).google;
      if (!google?.maps) {
        return;
      }

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
          map: handle.map,
        });
        polygonRefs.current.push(() => polygon.setMap(null));
      }

      for (const markerRow of overlays.markers) {
        if (!markerRow.isVisibleByDefault) {
          continue;
        }

        const marker = new google.maps.Marker({
          map: handle.map,
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
        overlayMarkerRefs.current.push(() => marker.setMap(null));
      }
      return;
    }

    const { leaflet, map } = handle;
    for (const boundary of overlays.boundaries) {
      if (!boundary.isVisibleByDefault || boundary.coordinates.length < 3) {
        continue;
      }

      const polygon = leaflet
        .polygon(
          boundary.coordinates.map(([lng, lat]) => [lat, lng]),
          {
            color: boundary.color,
            opacity: 0.9,
            weight: boundary.borderWidth,
            fillColor: boundary.color,
            fillOpacity: 0.08,
          },
        )
        .addTo(map);
      polygonRefs.current.push(() => polygon.remove());
    }

    for (const markerRow of overlays.markers) {
      if (!markerRow.isVisibleByDefault) {
        continue;
      }

      const marker = leaflet
        .circleMarker([markerRow.latitude, markerRow.longitude], {
          radius: 7,
          color: "#ffffff",
          weight: 2,
          fillColor: markerRow.color,
          fillOpacity: 1,
        })
        .bindTooltip(markerRow.name)
        .addTo(map);
      overlayMarkerRefs.current.push(() => marker.remove());
    }
  }, [mapReady, overlays]);

  useEffect(() => {
    const handle = mapRef.current;
    if (!handle) {
      return;
    }

    routeLineRef.current?.();
    routeLineRef.current = null;
    directionsRendererRef.current?.setMap(null);
    directionsRendererRef.current = null;

    if (!routePlanningEnabled) {
      return;
    }

    const stops = routeStops.filter(hasUsableCoordinates);
    if (stops.length < 2) {
      return;
    }

    if (handle.provider === "openstreetmap") {
      const path = stops.map((pin) => [pin.latitude as number, pin.longitude as number] as [number, number]);
      const line = handle.leaflet
        .polyline(path, {
          color: "#1958d6",
          opacity: 0.72,
          weight: 5,
        })
        .addTo(handle.map);
      routeLineRef.current = () => line.remove();
      handle.map.fitBounds(line.getBounds(), { padding: [56, 56] });
      return;
    }

    const google = (window as any).google;
    if (!google?.maps) {
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
    renderer.setMap(handle.map);
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
          map: handle.map,
        });
        routeLineRef.current = () => fallback.setMap(null);
      },
    );
  }, [mapReady, routePlanningEnabled, routeStops]);

  function updateFilter<Key extends keyof Filters>(key: Key, value: Filters[Key]) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function toggleRouteStop(pinId: string) {
    if (!routePlanningEnabled) {
      return;
    }
    setRouteStopIds((current) => (current.includes(pinId) ? current.filter((id) => id !== pinId) : [...current, pinId]));
  }

  function openFiltersPanel() {
    setMobileDetailOpen(false);
    setConsoleOpen(true);
    setFiltersOpen(true);
  }

  function openCurrentLocation() {
    if (!navigator.geolocation) {
      setNotice("Browser location is not available");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const handle = mapRef.current;
        if (!handle) {
          return;
        }
        if (handle.provider === "google_maps") {
          handle.map.panTo({ lat: position.coords.latitude, lng: position.coords.longitude });
          handle.map.setZoom(13);
          return;
        }
        handle.map.setView([position.coords.latitude, position.coords.longitude], 13, { animate: true });
      },
      () => setNotice("Location permission was not granted"),
      { enableHighAccuracy: true, timeout: 8_000 },
    );
  }

  function fitVisiblePins() {
    const handle = mapRef.current;
    if (!handle) {
      return;
    }

    if (handle.provider === "google_maps") {
      const google = (window as any).google;
      if (!google?.maps) {
        return;
      }

      const bounds = new google.maps.LatLngBounds();
      for (const pin of pins) {
        if (hasUsableCoordinates(pin)) {
          bounds.extend({ lat: pin.latitude, lng: pin.longitude });
        }
      }
      if (!bounds.isEmpty()) {
        handle.map.fitBounds(bounds, 56);
      }
      return;
    }

    const bounds = handle.leaflet.latLngBounds([]);
    for (const pin of pins) {
      if (hasUsableCoordinates(pin)) {
        bounds.extend([pin.latitude as number, pin.longitude as number]);
      }
    }
    if (bounds.isValid()) {
      handle.map.fitBounds(bounds, { padding: [56, 56] });
    }
  }

  async function geocodeMissingPins() {
    setGeocoding(true);
    try {
      const response = await fetch(`/api/runtime/organizations/${orgSlug}/geocode-accounts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ limit: 20 }),
      });
      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
        summary?: {
          provider: "google_maps" | "openstreetmap";
          scanned: number;
          attempted: number;
          geocoded: number;
          skippedNoAddress: number;
          failed: number;
        };
      };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Geocoding failed");
      }

      setNotice(
        `Geocoded ${payload.summary?.geocoded ?? 0} accounts via ${payload.summary?.provider ?? "openstreetmap"}; ${payload.summary?.failed ?? 0} failed, ${payload.summary?.skippedNoAddress ?? 0} missing usable address.`,
      );
      await loadPins();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Geocoding failed");
    } finally {
      setGeocoding(false);
    }
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

  const directionsHref = getDirectionsHref(selectedPin, mapConfig?.mapProvider ?? "openstreetmap");
  const notionHref = getNotionHref(detail);
  const organizationName = initialDashboard.organization.name;
  const mapSurface =
    mapConfig === null ? (
      <div className="flex h-full items-center justify-center bg-[var(--surface-elevated)] p-8 text-center text-sm font-semibold text-[var(--text-secondary)]">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading map
      </div>
    ) : shouldRenderInteractiveMap && mapConfig.configured ? (
      <div ref={mapElementRef} className="h-full w-full" />
    ) : view === "map" ? (
      <div className="flex h-full items-center justify-center bg-[var(--surface-elevated)] p-8 text-center text-sm text-[var(--text-secondary)]">
        {mapConfig.configured ? "Switch back to Map to load the territory canvas." : "Map tiles are not configured for this organization."}
      </div>
    ) : (
      <div className="h-full w-full bg-[var(--surface-card)]" />
    );

  return (
    <div className="relative flex h-[calc(100dvh-65px)] min-h-0 flex-col overflow-hidden bg-[#d9ded6] text-[var(--text-primary)] md:min-h-[620px]">
      {!consoleOpen ? (
        <div
          className={classNames(
            isNarrowViewport
              ? "z-30 flex flex-wrap gap-2 border-b border-[var(--border-subtle)] bg-[color:color-mix(in_srgb,var(--background)_88%,transparent)] px-3 py-3 backdrop-blur-xl"
              : "absolute left-3 top-3 z-30 flex flex-wrap gap-2 sm:left-4 sm:top-4",
          )}
        >
          <button
            type="button"
            onClick={() => setConsoleOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-card)] px-4 py-2 text-sm font-semibold shadow-[var(--shadow-soft)]"
          >
            <MapIcon className="h-4 w-4" />
            Field console
          </button>
          <button
            type="button"
            onClick={openFiltersPanel}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-card)] px-4 py-2 text-sm font-semibold shadow-[var(--shadow-soft)]"
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount ? (
              <span className="rounded-full bg-[rgba(215,67,20,0.12)] px-2 py-0.5 text-xs text-[var(--accent-primary-strong)]">
                {activeFilterCount}
              </span>
            ) : null}
          </button>
        </div>
      ) : null}

      {consoleOpen ? (
      <div
        className={classNames(
          isNarrowViewport
            ? "z-30 flex flex-col gap-2 border-b border-[var(--border-subtle)] bg-[color:color-mix(in_srgb,var(--background)_88%,transparent)] px-3 py-3 backdrop-blur-xl"
            : "absolute left-3 top-3 z-30 flex w-[min(calc(100%-1.5rem),28rem)] flex-col gap-2 sm:left-4 sm:top-4",
        )}
      >
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[color:color-mix(in_srgb,var(--surface-card)_92%,transparent)] p-3 shadow-[var(--shadow-soft)] backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-secondary-strong)]">
                {organizationName} map
              </p>
              <h1 className="truncate text-lg font-semibold tracking-[-0.03em]">Field console</h1>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => void loadPins()}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-card)] px-3 text-sm font-semibold"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Refresh
              </button>
              <button
                type="button"
                onClick={() => {
                  setFiltersOpen(false);
                  setConsoleOpen(false);
                }}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-card)] text-[var(--text-secondary)]"
                aria-label="Hide field console"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <span className="rounded-lg border border-[var(--border-subtle)] bg-white/75 px-3 py-2 text-xs font-semibold shadow-sm">
              {formatNumber(data.counts.accounts)} accounts
            </span>
            <span className="rounded-lg border border-[var(--border-subtle)] bg-white/75 px-3 py-2 text-xs font-semibold shadow-sm">
              {formatNumber(data.counts.geocodedPins)} pins
            </span>
            <span className="rounded-lg border border-[var(--border-subtle)] bg-white/75 px-3 py-2 text-xs font-semibold shadow-sm">
              {formatNumber(data.counts.orders)} orders
            </span>
            <span className="rounded-lg border border-[var(--border-subtle)] bg-white/75 px-3 py-2 text-xs font-semibold shadow-sm">
              {formatNumber(data.counts.territoryBoundaries + data.counts.territoryMarkers)} overlays
            </span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="col-span-2 flex rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-card)] p-1">
              <button
                type="button"
                onClick={() => setView("map")}
                className={classNames("inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold", view === "map" && "bg-[var(--text-primary)] text-white")}
                style={view === "map" ? { color: "#fff" } : undefined}
              >
                <MapIcon className="h-4 w-4" />
                Map
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                className={classNames("inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold", view === "list" && "bg-[var(--text-primary)] text-white")}
                style={view === "list" ? { color: "#fff" } : undefined}
              >
                <List className="h-4 w-4" />
                List
              </button>
            </div>
            <button
              type="button"
              onClick={() => setFiltersOpen((current) => !current)}
              className={classNames(
                "inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold",
                filtersOpen || activeFilterCount
                  ? "border-[var(--accent-primary)] bg-[rgba(215,67,20,0.1)] text-[var(--accent-primary-strong)]"
                  : "border-[var(--border-subtle)] bg-[var(--surface-card)] text-[var(--text-secondary)]",
              )}
            >
              <Filter className="h-4 w-4" />
              {activeFilterCount ? activeFilterCount : "Filters"}
            </button>
          </div>
        </div>

        {filtersOpen ? (
          <div className="flex max-h-[calc(100dvh-18rem)] flex-col gap-2 overflow-auto rounded-xl border border-[var(--border-subtle)] bg-[color:color-mix(in_srgb,var(--surface-card)_95%,transparent)] p-2 shadow-[var(--shadow-soft)] backdrop-blur-xl">
            <label className="flex min-w-[240px] flex-1 items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] px-3 py-2">
              <Search className="h-4 w-4 text-[var(--text-tertiary)]" />
              <input
                value={filters.search}
                onChange={(event) => updateFilter("search", event.target.value)}
                placeholder="Search accounts, city, state"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--text-tertiary)]"
              />
            </label>
            {supportsLeadGradeFilter ? (
              <SelectFilter
                label="Score"
                value={filters.leadGrade}
                options={data.leadGradeFacets}
                onChange={(value) => updateFilter("leadGrade", value)}
              />
            ) : (
              <>
                <SelectFilter label="Rep" value={filters.rep} options={data.repFacets} onChange={(value) => updateFilter("rep", value)} />
                <SelectFilter label="Status" value={filters.status} options={data.statusFacets} onChange={(value) => updateFilter("status", value)} />
                <SelectFilter label="Referral" value={filters.referralSource} options={data.referralSourceFacets} onChange={(value) => updateFilter("referralSource", value)} />
              </>
            )}
            <div className="flex rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-1">
              {availableColorModes.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setColorMode(mode)}
                  className={classNames(
                    "rounded-lg px-3 py-2 text-sm font-semibold",
                    colorMode === mode ? "bg-[var(--text-primary)] text-white" : "text-[var(--text-secondary)]",
                  )}
                  style={colorMode === mode ? { color: "#fff" } : undefined}
                >
                  {colorModeLabels[mode]}
                </button>
              ))}
            </div>
            {enabledFlags.has("dnc_flagged") ? (
              <button
                type="button"
                onClick={() => updateFilter("flag", filters.flag === "dnc_flagged" ? "" : "dnc_flagged")}
                className={classNames(
                  "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold",
                  filters.flag === "dnc_flagged"
                    ? "border-[var(--accent-primary)] bg-[rgba(215,67,20,0.1)] text-[var(--accent-primary-strong)]"
                    : "border-[var(--border-subtle)] bg-[var(--surface-card)] text-[var(--text-secondary)]",
                )}
              >
                <Filter className="h-4 w-4" />
                DNC Flagged ({formatNumber(data.counts.dncFlagged)})
              </button>
            ) : null}
            {enabledFlags.has("missing_referral_source") ? (
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
            ) : null}
            <button
              type="button"
              onClick={() => updateFilter("flag", filters.flag === "no_address_available" ? "" : "no_address_available")}
              className={classNames(
                "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold",
                filters.flag === "no_address_available"
                  ? "border-[var(--accent-primary)] bg-[rgba(215,67,20,0.1)] text-[var(--accent-primary-strong)]"
                  : "border-[var(--border-subtle)] bg-[var(--surface-card)] text-[var(--text-secondary)]",
              )}
            >
              <MapIcon className="h-4 w-4" />
              No Address Available ({formatNumber(data.counts.noAddressAvailable)})
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
        ) : null}
      </div>
      ) : null}

      {!detailsOpen && selectedPin ? (
        <button
          type="button"
          onClick={() => setDetailsOpen(true)}
          className="absolute right-3 top-3 z-30 hidden max-w-[22rem] items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-card)] px-4 py-2 text-sm font-semibold shadow-[var(--shadow-soft)] xl:inline-flex"
        >
          <ExternalLink className="h-4 w-4" />
          {selectedPin.name}
        </button>
      ) : null}

      <div className={classNames("grid min-h-0 flex-1 w-full gap-0", detailsOpen ? "xl:grid-cols-[minmax(0,1fr)_420px]" : "xl:grid-cols-1")}>
        <main className={classNames("relative xl:min-h-0", isNarrowViewport ? "min-h-0 flex flex-1 flex-col" : "min-h-[560px]")}>
          <div className={classNames("absolute inset-0", view === "list" ? "z-0" : "z-10")}>
            {mapSurface}
            {view === "map" ? (
              <div className="pointer-events-none absolute bottom-4 left-4 flex flex-wrap gap-2">
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
                  <button
                    type="button"
                    onClick={fitVisiblePins}
                    className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-card)] px-4 py-2 text-sm font-semibold shadow-[var(--shadow-soft)]"
                  >
                    <MapIcon className="h-4 w-4" />
                    Fit
                  </button>
                  {data.counts.geocodedPins < data.counts.accounts ? (
                    <button
                      type="button"
                      onClick={() => void geocodeMissingPins()}
                      disabled={geocoding}
                      className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-card)] px-4 py-2 text-sm font-semibold shadow-[var(--shadow-soft)] disabled:opacity-60"
                    >
                      {geocoding ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
                      Geocode
                    </button>
                  ) : null}
              </div>
            ) : null}
          </div>
          {view === "list" ? (
            <div className="absolute inset-0 z-20 overflow-auto bg-[var(--surface-card)]">
              {pins.map((pin) => (
                <PinRow
                  key={pin.id}
                  pin={pin}
                  active={pin.id === selectedId}
                  selected={routeStopIds.includes(pin.id)}
                  routePlanningEnabled={routePlanningEnabled}
                  colorMode={colorMode}
                  onFocus={() => focusPin(pin)}
                  onToggleRoute={() => toggleRouteStop(pin.id)}
                />
              ))}
              {!pins.length ? <div className="p-8 text-sm text-[var(--text-secondary)]">No accounts match the current filters.</div> : null}
            </div>
          ) : null}
        </main>

        {detailsOpen ? (
        <aside className="z-10 hidden border-l border-[var(--border-subtle)] bg-[color:color-mix(in_srgb,var(--surface-card)_96%,transparent)] shadow-[var(--shadow-soft)] backdrop-blur-xl xl:block">
          <div className="h-full overflow-auto">
            <div className="border-b border-[var(--border-subtle)] p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-tertiary)]">Selected account</p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em]">{selectedPin?.name ?? "No account selected"}</h2>
                </div>
                <div className="flex items-center gap-2">
                  {detailLoading ? <Loader2 className="h-5 w-5 animate-spin text-[var(--text-tertiary)]" /> : null}
                  <button
                    type="button"
                    onClick={() => setDetailsOpen(false)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-card)] text-[var(--text-secondary)]"
                    aria-label="Collapse selected account details"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {selectedPin ? (
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  {[selectedPin.city, selectedPin.state].filter(Boolean).join(", ") || "No location"} /{" "}
                  {selectedPin.leadScoreSummary
                    ? `Score ${selectedPin.leadScoreSummary.score ?? "-"} (${selectedPin.leadScoreSummary.grade})`
                    : selectedPin.salesRepNames.join(", ") || "No rep"}
                </p>
              ) : null}
            </div>

            {selectedPin ? (
              <div className="space-y-5 p-5">
                <div className={classNames("grid gap-2", routePlanningEnabled && directionsHref ? "grid-cols-2" : "grid-cols-1")}>
                  {routePlanningEnabled ? (
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
                  ) : null}
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
                    {supportsLeadGradeFilter ? (
                      <>
                        <div className="flex justify-between gap-4">
                          <dt className="text-[var(--text-tertiary)]">Lead score</dt>
                          <dd className="font-semibold">
                            {selectedPin.leadScoreSummary?.score ?? "-"} / {selectedPin.leadScoreSummary?.grade ?? "Unscored"}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-[var(--text-tertiary)]">Close rate</dt>
                          <dd className="font-semibold">
                            {selectedPin.leadScoreSummary?.closeRate === null || selectedPin.leadScoreSummary?.closeRate === undefined
                              ? "-"
                              : `${Math.round(selectedPin.leadScoreSummary.closeRate * 100)}%`}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-[var(--text-tertiary)]">Closed / lost</dt>
                          <dd className="font-semibold">
                            {selectedPin.leadScoreSummary?.closedOrders ?? 0} / {selectedPin.leadScoreSummary?.lostOrders ?? 0}
                          </dd>
                        </div>
                      </>
                    ) : (
                        <div className="flex justify-between gap-4">
                          <dt className="text-[var(--text-tertiary)]">Referral</dt>
                          <dd className="text-right font-semibold">{selectedPin.referralSource ?? "None"}</dd>
                      </div>
                    )}
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
                        <a href={orgScopedHref(`/accounts/${detail.account.id}`, orgSlug)} className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent-primary-strong)]">
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
                        {!supportsLeadGradeFilter ? (
                          <div className="flex justify-between gap-4">
                            <dt className="text-[var(--text-tertiary)]">License</dt>
                            <dd className="max-w-[60%] truncate text-right font-semibold">{detail.account.licenseNumber ?? "None"}</dd>
                          </div>
                        ) : null}
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

                {routePlanningEnabled ? (
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
                ) : null}
              </div>
            ) : (
              <div className="p-5 text-sm text-[var(--text-secondary)]">Select a pin or account row to start working.</div>
            )}
          </div>
        </aside>
        ) : null}
      </div>

      {isNarrowViewport && selectedPin && mobileDetailOpen ? (
        <div className="absolute inset-x-0 bottom-0 z-30 border-t border-[var(--border-subtle)] bg-[color:color-mix(in_srgb,var(--surface-card)_96%,transparent)] shadow-[0_-18px_40px_rgba(15,23,42,0.18)] backdrop-blur-xl">
          <div className="max-h-[52dvh] overflow-auto px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-tertiary)]">Selected account</p>
                <h2 className="mt-1 truncate text-xl font-semibold tracking-[-0.03em]">{selectedPin.name}</h2>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  {[selectedPin.city, selectedPin.state].filter(Boolean).join(", ") || "No location"} /{" "}
                  {selectedPin.leadScoreSummary
                    ? `Score ${selectedPin.leadScoreSummary.score ?? "-"} (${selectedPin.leadScoreSummary.grade})`
                    : selectedPin.status ?? "No score yet"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {detailLoading ? <Loader2 className="h-4 w-4 animate-spin text-[var(--text-tertiary)]" /> : null}
                <button
                  type="button"
                  onClick={() => setMobileDetailOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] text-[var(--text-secondary)]"
                  aria-label="Hide selected account details"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Close rate</p>
                <p className="mt-1 text-base font-semibold">
                  {selectedPin.leadScoreSummary?.closeRate === null || selectedPin.leadScoreSummary?.closeRate === undefined
                    ? "-"
                    : `${Math.round(selectedPin.leadScoreSummary.closeRate * 100)}%`}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Closed / lost</p>
                <p className="mt-1 text-base font-semibold">
                  {selectedPin.leadScoreSummary?.closedOrders ?? 0} / {selectedPin.leadScoreSummary?.lostOrders ?? 0}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Revenue</p>
                <p className="mt-1 text-base font-semibold">{formatMoney(detail?.orderSummary.totalRevenue ?? 0)}</p>
              </div>
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Last order</p>
                <p className="mt-1 text-base font-semibold">{formatDate(selectedPin.lastOrderDate)}</p>
              </div>
            </div>

            <dl className="mt-4 space-y-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--text-tertiary)]">Status</dt>
                <dd className="text-right font-semibold">{selectedPin.status ?? "None"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--text-tertiary)]">Contacts</dt>
                <dd className="text-right font-semibold">{detail ? formatNumber(detail.contacts.length) : "-"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--text-tertiary)]">Orders</dt>
                <dd className="text-right font-semibold">
                  {detail ? formatNumber(detail.orderSummary.totalOrders) : formatNumber(selectedPin.leadScoreSummary?.totalOrders ?? 0)}
                </dd>
              </div>
            </dl>

            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={orgScopedHref(`/accounts/${selectedPin.id}`, orgSlug)}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--text-primary)] px-4 py-3 text-sm font-semibold text-white"
                style={{ color: "#fff" }}
              >
                Open account
                <ExternalLink className="h-4 w-4" />
              </a>
              {directionsHref ? (
                <a
                  href={directionsHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] px-4 py-3 text-sm font-semibold"
                >
                  <Navigation className="h-4 w-4" />
                  Directions
                </a>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

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
