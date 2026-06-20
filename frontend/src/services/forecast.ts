import apiClient from "@/lib/axios";
import type { ApiResponse, ForecastPoint } from "@/types";

export async function fetchForecast(params?: {
  zone_id?: string;
  horizon_days?: number;
}): Promise<ForecastPoint[]> {
  const { data } = await apiClient.get<ApiResponse<ForecastPoint[]>>("/forecast", { params });
  return data.data;
}
