import {
  adaptPatrolRouteFromAllocation,
  adaptPatrolRouteFromDetail,
  adaptPatrolRouteFromGenerate,
  adaptPatrolRouteFromPriorityHotspots,
  isPatrolRouteUsable,
  routeCoversAllocation,
} from "@/adapters/patrol";
import { fetchHotspotDisplayUniverse } from "@/services/hotspotDisplay";
import { apiGetLive, apiPostLive } from "@/lib/api";
import type {
  BackendGenerateRouteResponse,
  BackendAllocationPlan,
  BackendPatrolRouteDetail,
  BackendRouteLatest,
} from "@/types/backend";
import type { PatrolRouteView } from "@/types/views";

export async function fetchLatestPatrolRoute(): Promise<PatrolRouteView> {
  const [allocation, riskUniverse] = await Promise.all([
    apiGetLive<BackendAllocationPlan>("/allocation/latest").catch(() => null),
    fetchHotspotDisplayUniverse(),
  ]);

  try {
    const summary = await apiGetLive<BackendRouteLatest>("/routing/latest");
    const detail = await apiGetLive<BackendPatrolRouteDetail>(
      `/patrol/${summary.route_id}`
    );
    const route = adaptPatrolRouteFromDetail(detail, riskUniverse);
    if (
      isPatrolRouteUsable(route) &&
      (!allocation || routeCoversAllocation(route, allocation))
    ) {
      return route;
    }
  } catch (error) {
    console.warn(
      "[Patrol] Latest route is unavailable; using the latest real allocation.",
      error
    );
  }

  if (allocation?.allocations.length) {
    return adaptPatrolRouteFromAllocation(allocation, riskUniverse);
  }

  const priorityRoute = adaptPatrolRouteFromPriorityHotspots(riskUniverse);
  if (isPatrolRouteUsable(priorityRoute)) return priorityRoute;
  throw new Error("No allocated or priority hotspots are available for patrol routing.");
}

export async function generatePatrolRoute(): Promise<PatrolRouteView> {
  const allocation = await apiGetLive<BackendAllocationPlan>("/allocation/latest");
  const raw = await apiPostLive<BackendGenerateRouteResponse>("/routing/generate", {
    route_date: new Date().toISOString().split("T")[0],
    shift_name: "default",
    max_stops: Math.max(1, allocation.hotspots_covered),
    use_two_opt: true,
  });
  const riskUniverse = await fetchHotspotDisplayUniverse();
  const route = adaptPatrolRouteFromGenerate(raw, riskUniverse);
  return isPatrolRouteUsable(route) && routeCoversAllocation(route, allocation)
    ? route
    : adaptPatrolRouteFromAllocation(allocation, riskUniverse);
}
