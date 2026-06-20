import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/types";

export interface DashboardKPIs {
  total_violations: number;
  total_violations_delta: number;
  high_risk_zones: number;
  high_risk_zones_delta: number;
  officers_on_duty: number;
  avg_risk_score: number;
}

export async function fetchDashboardKPIs(): Promise<DashboardKPIs> {
  const { data } = await apiClient.get<ApiResponse<DashboardKPIs>>("/dashboard/kpis");
  return data.data;
}
