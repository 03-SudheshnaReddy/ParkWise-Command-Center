import { useQuery } from "@tanstack/react-query";
import { fetchDashboardKPIs } from "@/services/dashboard";

export function useDashboardKPIs() {
  return useQuery({
    queryKey: ["dashboard", "kpis"],
    queryFn: fetchDashboardKPIs,
    refetchInterval: 5 * 60 * 1000, // auto-refresh every 5 min
  });
}
