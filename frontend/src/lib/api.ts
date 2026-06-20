import apiClient from "./axios";
import { useAppStore } from "@/stores/appStore";
import { getMockResponse, getMockPostResponse } from "@/services/mockData";
import type { ApiResponse } from "@/types";

export async function apiGet<T>(url: string, params?: any): Promise<T> {
  const useMock = useAppStore.getState().useMockData;
  if (useMock) {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 350));
    return getMockResponse<T>(url, params);
  }
  const { data } = await apiClient.get<ApiResponse<T>>(url, { params });
  return data.data;
}

export async function apiPost<T>(url: string, body?: any): Promise<T> {
  const useMock = useAppStore.getState().useMockData;
  if (useMock) {
    await new Promise((resolve) => setTimeout(resolve, 350));
    return getMockPostResponse<T>(url, body);
  }
  const { data } = await apiClient.post<ApiResponse<T>>(url, body);
  return data.data;
}
