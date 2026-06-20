import { useQuery } from "@tanstack/react-query";
import { fetchHourlyPattern, fetchWeeklyTrend } from "@/services/temporal";
import { useFilterStore } from "@/stores/filterStore";

export function useHourlyPattern() {
  const { selectedZones, dateRange } = useFilterStore();
  return useQuery({
    queryKey: ["temporal", "hourly", selectedZones, dateRange],
    queryFn: () =>
      fetchHourlyPattern({
        zone_ids: selectedZones,
        from_date: dateRange.from,
        to_date: dateRange.to,
      }),
  });
}

export function useWeeklyTrend() {
  const { selectedZones, dateRange } = useFilterStore();
  return useQuery({
    queryKey: ["temporal", "weekly", selectedZones, dateRange],
    queryFn: () =>
      fetchWeeklyTrend({
        zone_ids: selectedZones,
        from_date: dateRange.from,
        to_date: dateRange.to,
      }),
  });
}
