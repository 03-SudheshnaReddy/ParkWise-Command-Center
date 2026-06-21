import type { HotspotRecord } from "@/services/hotspots";
import type { HotspotDisplayUniverseItem } from "@/services/hotspotDisplay";
import {
  applyPercentileRiskTiers,
  getHotspotDisplayName,
  getHotspotSubtext,
  type DisplayRiskTier,
} from "@/utils/hotspotDisplay";
import { getRiskTierFromScoreOrRank } from "@/utils/riskDisplay";

export type HotspotDisplayRecord = HotspotRecord & {
  displayName: string;
  displaySubtext: string | null;
  displayRiskTier: DisplayRiskTier;
  displayRiskScore: number;
  displayRiskRank: number;
};

export function adaptHotspotRecords(
  records: HotspotRecord[],
  riskUniverse: HotspotDisplayUniverseItem[]
): HotspotDisplayRecord[] {
  const recordById = new Map(records.map((record) => [record.id, record]));
  const ranked = applyPercentileRiskTiers(
    riskUniverse.map((hotspot) => {
      const record = recordById.get(hotspot.hotspot_id);
      return {
        ...hotspot,
        total_violations:
          record?.total_violations ?? hotspot.violation_count,
      };
    })
  );
  const riskByHotspot = new Map(
    ranked.map((score) => [score.hotspot_id, score])
  );
  const recordRiskFallback = records.map((record) => ({
    hotspot_id: record.id,
    total_violations: record.total_violations,
  }));

  return records
    .map((record) => {
    const rankedRecord = riskByHotspot.get(record.id);
    return {
      ...record,
      displayName: getHotspotDisplayName({
        ...record,
        hotspot_id: record.id,
      }),
      displaySubtext: getHotspotSubtext(record),
      displayRiskTier:
        rankedRecord?.displayRiskTier ??
        getRiskTierFromScoreOrRank(
          {
            hotspot_id: record.id,
            total_violations: record.total_violations,
          },
          recordRiskFallback
        ),
      displayRiskScore:
        rankedRecord?.displayRiskScore ?? record.total_violations,
      displayRiskRank:
        rankedRecord?.displayRiskRank ?? riskUniverse.length + 1,
    };
  })
    .sort(
      (a, b) =>
        b.displayRiskScore - a.displayRiskScore ||
        b.total_violations - a.total_violations ||
        a.id - b.id
    );
}
