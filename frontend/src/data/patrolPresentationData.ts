export interface PatrolRouteInsight {
  title: string;
  description: string;
  highlights: string[];
}

/**
 * Presentation-only copy for the Patrol Routes interface.
 * It describes the sequencing strategy without claiming live navigation,
 * GPS dispatch, or unsupported routing-provider behavior.
 */
export const patrolRouteInsight: PatrolRouteInsight = {
  title: "Route Insight",
  description:
    "This route prioritizes critical and high-risk hotspots first, minimizing travel overhead while maximizing enforcement coverage during the active shift.",
  highlights: [
    "Priority-first sequencing",
    "Reduced route overlap",
    "Critical zones covered first",
  ],
};
