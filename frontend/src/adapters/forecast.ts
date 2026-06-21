import type { HotspotDisplayUniverseItem } from "@/services/hotspotDisplay";
import type {
  BackendForecastItem,
  BackendForecastSummary,
} from "@/types/backend";
import type {
  EISScoreView,
  ForecastPredictionRow,
  ForecastSummaryView,
} from "@/types/views";
import {
  getHotspotDisplayName,
  getHotspotSubtext,
} from "@/utils/hotspotDisplay";
import {
  applyPercentileRiskTiers,
  type DisplayRiskTier,
} from "@/utils/riskDisplay";

export function adaptForecastSummary(
  summary: BackendForecastSummary
): ForecastSummaryView {
  const horizons = Object.keys(summary.horizon_distribution ?? {});
  const primaryHorizon =
    horizons.length > 0
      ? Math.max(...horizons.map((h) => Number(h)))
      : summary.trained_horizons?.[0];

  const highRisk =
    (summary.risk_distribution?.Critical ?? 0) +
    (summary.risk_distribution?.High ?? 0);

  return {
    totalForecasts: summary.total_forecasts ?? 0,
    forecastHorizonLabel: primaryHorizon
      ? `${primaryHorizon} Day${Number(primaryHorizon) === 1 ? "" : "s"}`
      : "—",
    predictedHighRiskHotspots: highRisk,
    avgPredictedEis: summary.average_predicted_eis ?? 0,
  };
}

function firstFinite(
  ...values: Array<number | null | undefined>
): number | null {
  const value = values.find((candidate) => Number.isFinite(candidate));
  return value == null ? null : Number(value);
}

function firstText(
  ...values: Array<string | null | undefined>
): string | null {
  return values.find((value) => value?.trim())?.trim() ?? null;
}

function getCurrentRiskScore(
  item: BackendForecastItem,
  hotspot: HotspotDisplayUniverseItem | undefined,
  eisScore: number | undefined
): number | null {
  return firstFinite(
    item.current_risk_score,
    item.latest_risk_score,
    item.current_eis_score,
    item.eis_score,
    item.risk_score,
    item.latest_score,
    item.current_score,
    hotspot?.latest_eis,
    eisScore
  );
}

function getForecastRiskScore(item: BackendForecastItem): number {
  return (
    firstFinite(
      item.forecast_risk_score,
      item.predicted_risk_score,
      item.forecast_score,
      item.predicted_score,
      item.predicted_eis
    ) ?? 0
  );
}

function deriveAction(
  item: BackendForecastItem,
  tier: DisplayRiskTier,
  violation: string | null
): string {
  const apiRecommendation = firstText(
    item.recommended_action,
    item.suggested_action,
    item.enforcement_focus
  );
  if (apiRecommendation) return apiRecommendation;

  const focus = violation?.toLowerCase() ?? "";
  const primaryViolation = focus.split(",")[0]?.trim() ?? "";
  if (
    primaryViolation.includes("main road") ||
    primaryViolation.includes("road crossing")
  ) {
    return tier === "Critical"
      ? "Increase patrol coverage and clear high-impact roadway obstructions"
      : tier === "High"
        ? "Prioritize roadway-obstruction enforcement"
        : "Monitor roadway obstruction risk with targeted field checks";
  }
  if (primaryViolation.includes("no parking")) {
    return tier === "Critical"
      ? "Deploy immediate no-parking enforcement and clearance checks"
      : tier === "High"
        ? "Prioritize monitoring and targeted no-parking enforcement"
        : "Monitor no-parking activity during peak periods";
  }
  if (primaryViolation.includes("footpath")) {
    return tier === "Critical" || tier === "High"
      ? "Prioritize footpath clearance and pedestrian-access enforcement"
      : "Schedule focused footpath-parking checks";
  }
  if (primaryViolation.includes("wrong parking")) {
    return tier === "Critical"
      ? "Increase patrol presence and immediate wrong-parking enforcement"
      : tier === "High"
        ? "Prioritize targeted wrong-parking enforcement"
        : "Schedule focused wrong-parking checks during peak periods";
  }
  if (focus.includes("no parking")) {
    return tier === "Critical"
      ? "Deploy immediate no-parking enforcement and clearance checks"
      : tier === "High"
        ? "Prioritize monitoring and targeted no-parking enforcement"
        : "Monitor no-parking activity during peak periods";
  }
  if (focus.includes("footpath")) {
    return tier === "Critical" || tier === "High"
      ? "Prioritize footpath clearance and pedestrian-access enforcement"
      : "Schedule focused footpath-parking checks";
  }
  if (focus.includes("main road") || focus.includes("road crossing")) {
    return tier === "Critical"
      ? "Increase patrol coverage and clear high-impact roadway obstructions"
      : "Monitor roadway obstruction risk with targeted field checks";
  }
  return tier === "Critical"
    ? "Increase patrol presence for immediate high-risk enforcement"
    : tier === "High"
      ? "Prioritize targeted enforcement during the forecast horizon"
      : tier === "Medium"
        ? "Monitor and schedule focused checks during peak periods"
        : "Maintain observation and routine enforcement coverage";
}

export function adaptForecastTop(
  forecasts: BackendForecastItem[],
  eisByHotspot: Map<number, number>,
  riskUniverse: HotspotDisplayUniverseItem[]
): ForecastPredictionRow[] {
  const hotspotById = new Map(
    riskUniverse.map((hotspot) => [hotspot.hotspot_id, hotspot])
  );
  const prepared = forecasts
    .map((item) => {
      const hotspot = hotspotById.get(item.hotspot_id);
      return {
        item,
        hotspot,
        hotspot_id: item.hotspot_id,
        current_risk_score: getCurrentRiskScore(
          item,
          hotspot,
          eisByHotspot.get(item.hotspot_id)
        ),
        forecasted_eis: getForecastRiskScore(item),
        violation_count: hotspot?.violation_count ?? 0,
      };
    });
  const ranked = applyPercentileRiskTiers(prepared);

  return ranked.map(
    ({
      item,
      hotspot,
      current_risk_score,
      forecasted_eis,
      violation_count,
      displayRiskTier,
      displayRiskRank,
    }) => {
      const violation = firstText(
        item.dominant_violation,
        item.violation_type,
        hotspot?.hotspot_type
      );
      const displaySource = {
        ...hotspot,
        hotspot_id: item.hotspot_id,
      };

      return {
        hotspot_id: item.hotspot_id,
        name: hotspot?.name ?? `Hotspot #${item.hotspot_id}`,
        displayName: getHotspotDisplayName(displaySource),
        displaySubtext: getHotspotSubtext(displaySource),
        displayRiskTier,
        displayRiskRank,
        current_eis: current_risk_score,
        forecasted_eis,
        risk_category: item.predicted_risk_category,
        totalViolations: violation_count,
        dominantViolation: violation,
        action_recommended: deriveAction(item, displayRiskTier, violation),
      };
    }
  );
}

export function buildEisLookup(
  scores: EISScoreView[]
): Map<number, number> {
  return new Map(scores.map((score) => [score.hotspot_id, score.eis_score]));
}
