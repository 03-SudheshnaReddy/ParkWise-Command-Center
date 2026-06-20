import { useQuery } from "@tanstack/react-query";
import { fetchForecast } from "@/services/forecast";

export function useForecast(zoneId?: string, horizonDays = 30) {
  return useQuery({
    queryKey: ["forecast", zoneId, horizonDays],
    queryFn: () => fetchForecast({ zone_id: zoneId, horizon_days: horizonDays }),
  });
}
