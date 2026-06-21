import type {
  BackendAllocationPlan,
  BackendGenerateRouteResponse,
  BackendPatrolRouteDetail,
  BackendRouteLatest,
  BackendRouteStop,
} from "@/types/backend";
import type { PatrolRouteView, PatrolStopView } from "@/types/views";
import type { HotspotDisplayUniverseItem } from "@/services/hotspotDisplay";
import {
  getHotspotDisplayName,
  getHotspotSubtext,
  type DisplayRiskTier,
} from "@/utils/hotspotDisplay";
import { getRiskTierFromScoreOrRank } from "@/utils/riskDisplay";

function validCoordinate(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function stopCoordinates(
  stop: BackendRouteStop
): { lat: number; lng: number } | null {
  const lat = stop.latitude ?? stop.lat;
  const lng = stop.longitude ?? stop.lon;
  if (!validCoordinate(lat) || !validCoordinate(lng)) {
    console.warn(
      `[Patrol] Skipping hotspot ${stop.hotspot_id} because route coordinates are missing.`
    );
    return null;
  }
  return { lat, lng };
}

function adaptStop(
  stop: BackendRouteStop,
  tierByHotspot: Map<number, DisplayRiskTier>
): PatrolStopView | null {
  const coordinates = stopCoordinates(stop);
  if (!coordinates) return null;
  const { lat, lng } = coordinates;
  const displaySource = {
    hotspot_id: stop.hotspot_id,
    hotspot_name: stop.hotspot_name,
    lat,
    lng,
  };
  const displayRiskTier =
    tierByHotspot.get(stop.hotspot_id) ??
    getRiskTierFromScoreOrRank(
      {
        hotspot_id: stop.hotspot_id,
        eis_score: stop.eis_snapshot,
      },
      [
        {
          hotspot_id: stop.hotspot_id,
          eis_score: stop.eis_snapshot,
        },
      ]
    );
  return {
    sequence: stop.sequence,
    hotspot_id: stop.hotspot_id,
    name: stop.hotspot_name ?? `Hotspot #${stop.hotspot_id}`,
    risk: displayRiskTier,
    displayName: getHotspotDisplayName(displaySource),
    displaySubtext: getHotspotSubtext(displaySource),
    displayRiskTier,
    lat,
    lng,
  };
}

function geometryFromStops(stops: PatrolStopView[]): Array<{ lat: number; lng: number }> {
  return stops.map(({ lat, lng }) => ({ lat, lng }));
}

function dedupeStops(stops: BackendRouteStop[]): BackendRouteStop[] {
  const seen = new Set<string>();
  return stops.filter((stop) => {
    const coordinates = stopCoordinates(stop);
    const key = stop.hotspot_id
      ? `id:${stop.hotspot_id}`
      : coordinates
        ? `point:${coordinates.lat.toFixed(6)}:${coordinates.lng.toFixed(6)}:${stop.hotspot_name ?? ""}`
        : `name:${stop.hotspot_name ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function haversineKm(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number }
): number {
  const earthRadiusKm = 6371;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const deltaLat = toRadians(end.lat - start.lat);
  const deltaLng = toRadians(end.lng - start.lng);
  const startLat = toRadians(start.lat);
  const endLat = toRadians(end.lat);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(deltaLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function distanceFromGeometry(
  geometry: Array<{ lat: number; lng: number }>
): number {
  return geometry.slice(1).reduce(
    (total, point, index) => total + haversineKm(geometry[index], point),
    0
  );
}

function validGeometry(
  geometry: Array<{ lat: number; lng: number }> | null | undefined
): Array<{ lat: number; lng: number }> {
  return (geometry ?? []).filter(
    (point) => validCoordinate(point.lat) && validCoordinate(point.lng)
  );
}

function buildPatrolRoute(
  routeId: number,
  rawStops: BackendRouteStop[],
  riskUniverse: HotspotDisplayUniverseItem[],
  backendGeometry?: Array<{ lat: number; lng: number }> | null,
  backendDistance?: number | null,
  backendDuration?: number | null
): PatrolRouteView {
  const tierByHotspot = new Map(
    riskUniverse.map((score) => [score.hotspot_id, score.displayRiskTier])
  );
  const stop_sequence = dedupeStops(rawStops)
    .map((stop) => adaptStop(stop, tierByHotspot))
    .filter((stop): stop is PatrolStopView => stop !== null)
    .map((stop, index) => ({ ...stop, sequence: index + 1 }));
  const stopGeometry = geometryFromStops(stop_sequence);
  const suppliedGeometry = validGeometry(backendGeometry);
  const route_geometry =
    suppliedGeometry.length >= 2 ? suppliedGeometry : stopGeometry;
  const calculatedDistance = distanceFromGeometry(route_geometry);
  const hasBackendDistance =
    validCoordinate(backendDistance) && backendDistance > 0;
  const total_distance_km = hasBackendDistance
    ? backendDistance
    : calculatedDistance;
  const hasBackendDuration =
    hasBackendDistance &&
    validCoordinate(backendDuration) &&
    backendDuration > 0;
  const estimated_travel_time_minutes = hasBackendDuration
    ? backendDuration
    : total_distance_km > 0
      ? Math.ceil((total_distance_km / 18) * 60)
      : 0;

  return {
    route_id: routeId,
    total_stops: stop_sequence.length,
    critical_high_stops: stop_sequence.filter(
      (stop) =>
        stop.displayRiskTier === "Critical" ||
        stop.displayRiskTier === "High"
    ).length,
    total_distance_km: Number(total_distance_km.toFixed(2)),
    estimated_travel_time_minutes,
    route_geometry,
    stop_sequence,
  };
}

export function isPatrolRouteUsable(route: PatrolRouteView): boolean {
  return (
    route.stop_sequence.length > 0 &&
    new Set(route.stop_sequence.map((stop) => stop.hotspot_id)).size ===
      route.stop_sequence.length
  );
}

export function routeCoversAllocation(
  route: PatrolRouteView,
  plan: BackendAllocationPlan
): boolean {
  const allocationIds = new Set(
    plan.allocations
      .filter(
        (item) =>
          validCoordinate(item.centroid_lat) &&
          validCoordinate(item.centroid_lon)
      )
      .map((item) => item.hotspot_id)
  );
  const routeIds = new Set(route.stop_sequence.map((stop) => stop.hotspot_id));
  return (
    allocationIds.size > 0 &&
    allocationIds.size === routeIds.size &&
    [...allocationIds].every((id) => routeIds.has(id))
  );
}

export function adaptPatrolRouteFromLatest(
  route: BackendRouteLatest,
  riskUniverse: HotspotDisplayUniverseItem[] = []
): PatrolRouteView {
  return buildPatrolRoute(
    route.route_id,
    route.stops ?? [],
    riskUniverse,
    undefined,
    route.total_distance_km,
    route.estimated_duration_min
  );
}

export function adaptPatrolRouteFromGenerate(
  response: BackendGenerateRouteResponse,
  riskUniverse: HotspotDisplayUniverseItem[] = []
): PatrolRouteView {
  return buildPatrolRoute(
    response.route_id,
    response.stops ?? [],
    riskUniverse,
    response.route_geometry,
    response.total_distance_km,
    response.estimated_total_minutes
  );
}

export function adaptPatrolRouteFromDetail(
  route: BackendPatrolRouteDetail,
  riskUniverse: HotspotDisplayUniverseItem[] = []
): PatrolRouteView {
  return buildPatrolRoute(
    route.id,
    route.stops.map((stop) => ({
      sequence: stop.sequence,
      hotspot_id: stop.hotspot_id,
      hotspot_name: stop.hotspot_name,
      lat: stop.lat,
      lon: stop.lon,
      eis_snapshot: stop.eis_score,
    })),
    riskUniverse,
    undefined,
    route.total_distance_km,
    route.estimated_duration_min
  );
}

export function adaptPatrolRouteFromAllocation(
  plan: BackendAllocationPlan,
  riskUniverse: HotspotDisplayUniverseItem[] = []
): PatrolRouteView {
  const stops: BackendRouteStop[] = [...plan.allocations]
    .sort((a, b) => a.priority_rank - b.priority_rank)
    .map((allocation, index) => ({
      sequence: index + 1,
      hotspot_id: allocation.hotspot_id,
      hotspot_name: allocation.hotspot_name,
      latitude: allocation.centroid_lat ?? undefined,
      longitude: allocation.centroid_lon ?? undefined,
      eis_snapshot: allocation.eis_snapshot,
      officers_allocated: allocation.officers_allocated,
      priority_rank: allocation.priority_rank,
      risk_category: allocation.risk_category ?? undefined,
    }));
  return buildPatrolRoute(0, stops, riskUniverse);
}

export function adaptPatrolRouteFromPriorityHotspots(
  riskUniverse: HotspotDisplayUniverseItem[],
  limit = 10
): PatrolRouteView {
  const stops: BackendRouteStop[] = [...riskUniverse]
    .sort((a, b) => a.displayRiskRank - b.displayRiskRank)
    .slice(0, limit)
    .map((hotspot, index) => ({
      sequence: index + 1,
      hotspot_id: hotspot.hotspot_id,
      hotspot_name: hotspot.name,
      latitude: hotspot.latitude,
      longitude: hotspot.longitude,
      eis_snapshot: hotspot.latest_eis,
      officers_allocated: hotspot.officers_allocated ?? undefined,
      priority_rank: hotspot.displayRiskRank,
      risk_category: hotspot.displayRiskTier,
    }));
  return buildPatrolRoute(0, stops, riskUniverse);
}
