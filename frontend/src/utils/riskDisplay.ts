export type DisplayRiskTier = "Critical" | "High" | "Medium" | "Low";

export interface RiskDisplayRecord {
  id?: number | string | null;
  hotspot_id?: number | string | null;
  forecasted_eis?: number | null;
  forecast_score?: number | null;
  predicted_risk_score?: number | null;
  latest_eis?: number | null;
  eis_score?: number | null;
  risk_score?: number | null;
  final_risk_score?: number | null;
  current_risk_score?: number | null;
  total_violations?: number | null;
  violation_count?: number | null;
}

export type RiskMappedRecord<T extends RiskDisplayRecord> = T & {
  displayRiskTier: DisplayRiskTier;
  displayRiskScore: number;
  displayRiskRank: number;
};

const RISK_COLOR_CLASSES: Record<DisplayRiskTier, string> = {
  Critical: "border-rose-400/20 bg-rose-400/10 text-rose-200",
  High: "border-amber-400/20 bg-amber-400/10 text-amber-200",
  Medium: "border-blue-400/20 bg-blue-400/10 text-blue-200",
  Low: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
};

const RISK_HEX_COLORS: Record<DisplayRiskTier, string> = {
  Critical: "#EF4444",
  High: "#F59E0B",
  Medium: "#3B82F6",
  Low: "#10B981",
};

function firstFinite(
  ...values: Array<number | null | undefined>
): number | null {
  const value = values.find((candidate) => Number.isFinite(candidate));
  return value == null ? null : Number(value);
}

function recordId(record: RiskDisplayRecord): string {
  return String(record.hotspot_id ?? record.id ?? "");
}

export function getRiskMetric(record: RiskDisplayRecord): number {
  return (
    firstFinite(
      record.forecasted_eis,
      record.forecast_score,
      record.predicted_risk_score,
      record.latest_eis,
      record.eis_score,
      record.risk_score,
      record.final_risk_score,
      record.current_risk_score,
      record.total_violations,
      record.violation_count
    ) ?? 0
  );
}

function getSecondaryMetric(record: RiskDisplayRecord): number {
  return (
    firstFinite(
      record.latest_eis,
      record.eis_score,
      record.risk_score,
      record.final_risk_score,
      record.current_risk_score,
      record.total_violations,
      record.violation_count
    ) ?? 0
  );
}

function getViolationMetric(record: RiskDisplayRecord): number {
  return firstFinite(record.total_violations, record.violation_count) ?? 0;
}

function getScoreTier(score: number): DisplayRiskTier {
  if (score >= 85) return "Critical";
  if (score >= 70) return "High";
  if (score >= 50) return "Medium";
  return "Low";
}

export function applyPercentileRiskTiers<T extends RiskDisplayRecord>(
  records: T[]
): Array<RiskMappedRecord<T>> {
  const ranked = records
    .map((record) => ({ record, score: getRiskMetric(record) }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        getSecondaryMetric(b.record) - getSecondaryMetric(a.record) ||
        getViolationMetric(b.record) - getViolationMetric(a.record) ||
        recordId(a.record).localeCompare(recordId(b.record), undefined, {
          numeric: true,
        })
    );

  const criticalLimit = Math.ceil(ranked.length * 0.01);
  const highLimit = Math.ceil(ranked.length * 0.04);
  const mediumLimit = Math.ceil(ranked.length * 0.1);

  return ranked.map(({ record, score }, index) => {
    const rank = index + 1;
    const displayRiskTier =
      ranked.length < 100
        ? getScoreTier(score)
        : rank <= criticalLimit
          ? "Critical"
          : rank <= highLimit
            ? "High"
            : rank <= mediumLimit
              ? "Medium"
              : "Low";

    return {
      ...record,
      displayRiskTier,
      displayRiskScore: score,
      displayRiskRank: rank,
    };
  });
}

export function getRiskTierFromScoreOrRank<T extends RiskDisplayRecord>(
  record: T,
  rankedRecords: T[]
): DisplayRiskTier {
  const score = getRiskMetric(record);
  if (score >= 50 || rankedRecords.length < 100) {
    return getScoreTier(score);
  }
  const id = recordId(record);
  return (
    applyPercentileRiskTiers(rankedRecords).find(
      (candidate) => recordId(candidate) === id
    )?.displayRiskTier ?? getScoreTier(score)
  );
}

export function getRiskBadgeLabel(tier: DisplayRiskTier): string {
  return tier;
}

export function getRiskColorClass(tier: DisplayRiskTier): string {
  return RISK_COLOR_CLASSES[tier];
}

export function getRiskHexColor(tier: DisplayRiskTier): string {
  return RISK_HEX_COLORS[tier];
}
