import { apiGetLive } from "@/lib/api";

export interface HotspotsParams {
  page?: number;
  page_size?: number;
  zone_id?: string;
  min_violations?: number;
}

export interface HotspotRecord {
  id: number;
  cluster_label: number;
  hotspot_name: string | null;
  centroid_lat: number;
  centroid_lon: number;
  total_violations: number;
  dominant_violation_type: string | null;
  zone_id: string | null;
  radius_m: number | null;
  unique_dates: number | null;
  dominant_vehicle_category: string | null;
  avg_fine_amount: number | null;
  violation_density: number | null;
  created_at: string;
  updated_at: string;
}

export interface HotspotListResponse {
  items: HotspotRecord[];
  total: number;
  page: number;
  page_size: number;
}

export async function fetchHotspots(
  params?: HotspotsParams
): Promise<HotspotListResponse> {
  return apiGetLive<HotspotListResponse>(
    "/hotspots/",
    params ? { ...params } : undefined
  );
}

export async function fetchAllHotspots(): Promise<HotspotListResponse> {
  const firstPage = await fetchHotspots({ page: 1, page_size: 500 });
  const totalPages = Math.ceil(firstPage.total / firstPage.page_size);
  if (totalPages <= 1) return firstPage;

  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      fetchHotspots({ page: index + 2, page_size: firstPage.page_size })
    )
  );

  return {
    ...firstPage,
    page: 1,
    page_size: firstPage.total,
    items: [
      ...firstPage.items,
      ...remainingPages.flatMap((response) => response.items),
    ],
  };
}

export async function fetchZoneById(zoneId: string): Promise<HotspotRecord> {
  return apiGetLive<HotspotRecord>(`/hotspots/${zoneId}`);
}
