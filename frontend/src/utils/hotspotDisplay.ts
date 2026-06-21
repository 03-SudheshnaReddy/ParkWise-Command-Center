import {
  applyPercentileRiskTiers as applyRiskTiers,
  getRiskMetric,
  type DisplayRiskTier,
  type RiskMappedRecord,
} from "@/utils/riskDisplay";

export type { DisplayRiskTier } from "@/utils/riskDisplay";

export interface HotspotDisplaySource {
  id?: number | string | null;
  hotspot_id?: number | string | null;
  hotspot_name?: string | null;
  name?: string | null;
  junction_name?: string | null;
  location_name?: string | null;
  area_name?: string | null;
  road_name?: string | null;
  cluster_name?: string | null;
  label?: string | null;
  centroid_lat?: number | null;
  centroid_lon?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  lat?: number | null;
  lng?: number | null;
  lon?: number | null;
  forecasted_eis?: number | null;
  forecast_score?: number | null;
  predicted_risk_score?: number | null;
  latest_eis?: number | null;
  eis_score?: number | null;
  risk_score?: number | null;
  total_violations?: number | null;
  violation_count?: number | null;
}

export type DisplayMappedHotspot<T extends HotspotDisplaySource> = T & {
  displayName: string;
  displaySubtext: string | null;
  displayRiskTier: DisplayRiskTier;
  displayRiskScore: number;
  displayRiskRank: number;
};

const COORDINATE_NAME_PATTERN =
  /^\s*(-?\d{1,3}(?:\.\d+)?)\s*[,/]\s*(-?\d{1,3}(?:\.\d+)?)\s*$/;
const INVALID_NAMES = new Set(["no junction", "null", "undefined", "n/a"]);

function validName(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  if (
    !normalized ||
    INVALID_NAMES.has(normalized.toLowerCase()) ||
    COORDINATE_NAME_PATTERN.test(normalized) ||
    /^hotspot\s*#?\s*\d+$/i.test(normalized)
  ) {
    return null;
  }
  return normalized;
}

function hotspotId(hotspot: HotspotDisplaySource): number | string | null {
  return hotspot.hotspot_id ?? hotspot.id ?? null;
}

export function formatHotspotCoordinates(
  latitude: number | null | undefined,
  longitude: number | null | undefined
): string | null {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return `${Number(latitude).toFixed(3)}, ${Number(longitude).toFixed(3)}`;
}

export function getHotspotDisplayName(hotspot: HotspotDisplaySource): string {
  const candidates = [
    hotspot.hotspot_name,
    hotspot.name,
    hotspot.junction_name,
    hotspot.location_name,
    hotspot.area_name,
    hotspot.road_name,
    hotspot.cluster_name,
    hotspot.label,
  ];
  const bestName = candidates.map(validName).find(Boolean);
  if (bestName) return bestName;

  const id = hotspotId(hotspot);
  return id != null ? `Bengaluru Hotspot #${id}` : "Bengaluru Hotspot";
}

export function getHotspotSubtext(
  hotspot: HotspotDisplaySource
): string | null {
  const coordinateName = [
    hotspot.hotspot_name,
    hotspot.name,
    hotspot.junction_name,
    hotspot.location_name,
    hotspot.area_name,
    hotspot.road_name,
    hotspot.cluster_name,
    hotspot.label,
  ]
    .map((value) => value?.match(COORDINATE_NAME_PATTERN))
    .find(Boolean);

  if (coordinateName) {
    return `${Number(coordinateName[1]).toFixed(3)}, ${Number(coordinateName[2]).toFixed(3)}`;
  }

  return formatHotspotCoordinates(
    hotspot.centroid_lat ?? hotspot.latitude ?? hotspot.lat,
    hotspot.centroid_lon ?? hotspot.longitude ?? hotspot.lng ?? hotspot.lon
  );
}

export function getHotspotRiskScore(hotspot: HotspotDisplaySource): number {
  return getRiskMetric(hotspot);
}

export function applyPercentileRiskTiers<T extends HotspotDisplaySource>(
  hotspots: T[]
): Array<DisplayMappedHotspot<T>> {
  return applyRiskTiers(hotspots).map(
    (hotspot: RiskMappedRecord<T>) => {
    return {
      ...hotspot,
      displayName: getHotspotDisplayName(hotspot),
      displaySubtext: getHotspotSubtext(hotspot),
    };
  });
}
