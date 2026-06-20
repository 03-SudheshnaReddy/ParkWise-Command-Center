export interface SimulatorOverrides {
  total_officers?: number;
  enforcement_intensity?: number;
  severity_multiplier_delta?: number;
  frequency_reduction_pct?: number;
  temporal_risk_reduction_pct?: number;
  forecast_horizon_days?: number;
  target_hotspot_ids?: number[];
  critical_min_officers?: number;
  high_min_officers?: number;
}

export interface SimulatorPreset {
  name: string;
  description?: string;
  overrides: SimulatorOverrides;
}

export interface SimulatorBaseline {
  hotspot_id: number;
  hotspot_name?: string | null;
  zone_id?: string | null;
  current_eis: number;
  current_risk_category: string;
  frequency_score: number;
  recurrence_score: number;
  density_score: number;
  temporal_risk_score: number;
  severity_norm: number;
  exposure_score?: number | null;
  severity_multiplier?: number | null;
  forecasted_eis?: number | null;
  forecasted_risk_category?: string | null;
  officers_allocated?: number | null;
}

export interface SimulatedHotspotResult {
  hotspot_id: number;
  hotspot_name?: string | null;
  zone_id?: string | null;
  baseline_eis: number;
  simulated_eis: number;
  baseline_risk_category: string;
  simulated_risk_category: string;
  eis_delta: number;
  risk_delta_label: "improved" | "worsened" | "unchanged" | string;
  baseline_officers: number;
  simulated_officers: number;
  officer_delta: number;
  impact_notes: string[];
}

export interface SimulationResult {
  scenario_name: string;
  total_hotspots: number;
  improved_hotspots: number;
  worsened_hotspots: number;
  unchanged_hotspots: number;
  baseline_average_eis: number;
  simulated_average_eis: number;
  average_eis_delta: number;
  baseline_total_officers: number;
  simulated_total_officers: number;
  hotspot_results: SimulatedHotspotResult[];
  summary: Record<string, unknown>;
}

export interface RunSimulationRequest {
  scenario_name: string;
  overrides: SimulatorOverrides;
}
