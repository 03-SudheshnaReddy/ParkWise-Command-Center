import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/types";

export interface HourlyBucket {
  hour: number;
  day_of_week: string;
  count: number;
}

export interface WeeklyTrend {
  date: string;
  count: number;
  zone_id?: string;
}

export async function fetchHourlyPattern(params?: {
  zone_ids?: string[];
  from_date?: string;
  to_date?: string;
}): Promise<HourlyBucket[]> {
  const { data } = await apiClient.get<ApiResponse<HourlyBucket[]>>("/temporal/hourly", { params });
  return data.data;
}

export async function fetchWeeklyTrend(params?: {
  zone_ids?: string[];
  from_date?: string;
  to_date?: string;
}): Promise<WeeklyTrend[]> {
  const { data } = await apiClient.get<ApiResponse<WeeklyTrend[]>>("/temporal/weekly", { params });
  return data.data;
}
