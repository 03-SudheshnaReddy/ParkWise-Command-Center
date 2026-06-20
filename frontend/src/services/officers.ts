import apiClient from "@/lib/axios";
import type { ApiResponse, Officer, PaginatedResponse } from "@/types";

export async function fetchOfficers(params?: {
  zone_id?: string;
  shift?: string;
  status?: string;
}): Promise<PaginatedResponse<Officer>> {
  const { data } = await apiClient.get<ApiResponse<PaginatedResponse<Officer>>>("/officers", {
    params,
  });
  return data.data;
}
