export interface RoutePlannerLocation {
  label?: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface RoutePlannerStop {
  accountId: string;
  name: string;
  city?: string | null;
  state?: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface OptimizedRouteStop extends RoutePlannerStop {
  stopIndex: number;
  distanceFromPreviousMiles: number | null;
  estimatedDurationFromPreviousMinutes: number | null;
}

export interface OptimizedRoutePreview {
  orderedStops: OptimizedRouteStop[];
  reviewStops: OptimizedRouteStop[];
  estimatedDistanceMiles: number;
  estimatedDurationMinutes: number;
  excludedStopCount: number;
}

export interface RouteStopSnapshot extends OptimizedRouteStop {
  status: "planned" | "needs_review";
}

const EARTH_RADIUS_MILES = 3958.8;
const ROUTE_DISTANCE_FACTOR = 1.18;
const AVERAGE_FIELD_SPEED_MPH = 38;

function hasCoordinates(stop: RoutePlannerLocation): stop is RoutePlannerLocation & { latitude: number; longitude: number } {
  return Number.isFinite(stop.latitude) && Number.isFinite(stop.longitude);
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function haversineMiles(left: RoutePlannerLocation, right: RoutePlannerLocation) {
  if (!hasCoordinates(left) || !hasCoordinates(right)) {
    return null;
  }

  const dLat = toRadians(right.latitude - left.latitude);
  const dLon = toRadians(right.longitude - left.longitude);
  const lat1 = toRadians(left.latitude);
  const lat2 = toRadians(right.latitude);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_MILES * c * ROUTE_DISTANCE_FACTOR;
}

function estimateDurationMinutes(distanceMiles: number | null) {
  return distanceMiles === null ? null : Math.max(1, Math.round((distanceMiles / AVERAGE_FIELD_SPEED_MPH) * 60));
}

export function buildOptimizedRoutePreview(input: {
  start?: RoutePlannerLocation | null;
  end?: RoutePlannerLocation | null;
  stops: RoutePlannerStop[];
}): OptimizedRoutePreview {
  const remaining = input.stops.filter(hasCoordinates);
  const reviewStops = input.stops.filter((stop) => !hasCoordinates(stop));
  const orderedStops: OptimizedRouteStop[] = [];
  let current: RoutePlannerLocation | null = input.start && hasCoordinates(input.start) ? input.start : null;
  let totalDistance = 0;
  let totalDuration = 0;

  while (remaining.length) {
    let nextIndex = 0;
    let nextDistance = current ? haversineMiles(current, remaining[0]) : null;

    if (current) {
      for (let index = 1; index < remaining.length; index += 1) {
        const candidateDistance = haversineMiles(current, remaining[index]);
        if (candidateDistance !== null && (nextDistance === null || candidateDistance < nextDistance)) {
          nextIndex = index;
          nextDistance = candidateDistance;
        }
      }
    }

    const [next] = remaining.splice(nextIndex, 1);
    const legDistance = current ? nextDistance : null;
    const legDuration = estimateDurationMinutes(legDistance);
    if (legDistance !== null) {
      totalDistance += legDistance;
    }
    if (legDuration !== null) {
      totalDuration += legDuration;
    }

    orderedStops.push({
      ...next,
      stopIndex: orderedStops.length + 1,
      distanceFromPreviousMiles: legDistance === null ? null : Math.round(legDistance * 10) / 10,
      estimatedDurationFromPreviousMinutes: legDuration,
    });
    current = next;
  }

  if (input.end && hasCoordinates(input.end) && current) {
    const finalLeg = haversineMiles(current, input.end);
    const finalDuration = estimateDurationMinutes(finalLeg);
    if (finalLeg !== null) {
      totalDistance += finalLeg;
    }
    if (finalDuration !== null) {
      totalDuration += finalDuration;
    }
  }

  return {
    orderedStops,
    reviewStops: reviewStops.map((stop, index) => ({
      ...stop,
      stopIndex: orderedStops.length + index + 1,
      distanceFromPreviousMiles: null,
      estimatedDurationFromPreviousMinutes: null,
    })),
    estimatedDistanceMiles: Math.round(totalDistance * 10) / 10,
    estimatedDurationMinutes: totalDuration,
    excludedStopCount: reviewStops.length,
  };
}

export function createRouteStopSnapshots(preview: OptimizedRoutePreview): RouteStopSnapshot[] {
  return [
    ...preview.orderedStops.map((stop) => ({ ...stop, status: "planned" as const })),
    ...preview.reviewStops.map((stop) => ({ ...stop, status: "needs_review" as const })),
  ];
}
