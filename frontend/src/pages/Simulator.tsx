import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  CheckCircle2,
  FlaskConical,
  Gauge,
  Layers3,
  LoaderCircle,
  Play,
  RefreshCcw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/layout/PageHeader";
import {
  getSimulatorBaseline,
  getSimulatorPresets,
  runSimulator,
} from "@/services/simulator";
import type {
  SimulationResult,
  SimulatorOverrides,
  SimulatorPreset,
} from "@/types/simulator";

const numberFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 1,
});

function getErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return "The simulator service is temporarily unavailable.";
}

function formatOverrideSummary(overrides: SimulatorOverrides) {
  const labels: string[] = [];

  if (overrides.total_officers !== undefined) {
    labels.push(`${overrides.total_officers} officers`);
  }
  if (overrides.frequency_reduction_pct !== undefined) {
    labels.push(
      `${Math.round(overrides.frequency_reduction_pct * 100)}% frequency reduction`
    );
  }
  if (overrides.temporal_risk_reduction_pct !== undefined) {
    labels.push(
      `${Math.round(overrides.temporal_risk_reduction_pct * 100)}% temporal reduction`
    );
  }
  if (overrides.enforcement_intensity !== undefined) {
    labels.push(
      `${numberFormatter.format(overrides.enforcement_intensity)}x enforcement`
    );
  }
  if (overrides.critical_min_officers !== undefined) {
    labels.push(`${overrides.critical_min_officers} critical minimum`);
  }
  if (overrides.high_min_officers !== undefined) {
    labels.push(`${overrides.high_min_officers} high-risk minimum`);
  }
  if (overrides.forecast_horizon_days !== undefined) {
    labels.push(`${overrides.forecast_horizon_days}-day horizon`);
  }
  if (overrides.target_hotspot_ids?.length) {
    labels.push(`${overrides.target_hotspot_ids.length} selected hotspots`);
  }

  return labels;
}

function riskTone(risk: string) {
  switch (risk.toLowerCase()) {
    case "critical":
      return "border-rose-400/20 bg-rose-400/10 text-rose-200";
    case "high":
      return "border-amber-400/20 bg-amber-400/10 text-amber-200";
    case "medium":
      return "border-yellow-300/20 bg-yellow-300/10 text-yellow-100";
    default:
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";
  }
}

export default function SimulatorPage() {
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<SimulatorOverrides>({});
  const [simulationResult, setSimulationResult] =
    useState<SimulationResult | null>(null);

  const baselineQuery = useQuery({
    queryKey: ["simulator-baseline"],
    queryFn: getSimulatorBaseline,
    staleTime: 30_000,
    retry: 1,
  });

  const presetsQuery = useQuery({
    queryKey: ["simulator-presets"],
    queryFn: getSimulatorPresets,
    staleTime: 30_000,
    retry: 1,
  });

  const runMutation = useMutation({
    mutationFn: runSimulator,
    onSuccess: setSimulationResult,
  });

  const baseline = useMemo(
    () => baselineQuery.data ?? [],
    [baselineQuery.data]
  );
  const presets = presetsQuery.data ?? [];

  const baselineSummary = useMemo(() => {
    const hotspotCount = baseline.length;
    const allocatedOfficers = baseline.reduce(
      (total, hotspot) => total + (hotspot.officers_allocated ?? 0),
      0
    );
    const averageEis = hotspotCount
      ? baseline.reduce((total, hotspot) => total + hotspot.current_eis, 0) /
        hotspotCount
      : null;
    const elevatedRisk = baseline.filter((hotspot) =>
      ["critical", "high"].includes(hotspot.current_risk_category.toLowerCase())
    ).length;

    return { hotspotCount, allocatedOfficers, averageEis, elevatedRisk };
  }, [baseline]);

  const officerCount =
    overrides.total_officers ?? baselineSummary.allocatedOfficers;
  const targetHotspotCount =
    overrides.target_hotspot_ids?.length ?? baselineSummary.hotspotCount;
  const officerMaximum = Math.max(
    20,
    baselineSummary.allocatedOfficers * 2,
    officerCount
  );

  const clearResult = () => {
    setSimulationResult(null);
    runMutation.reset();
  };

  const applyPreset = (preset: SimulatorPreset) => {
    setSelectedPreset(preset.name);
    setOverrides({ ...preset.overrides });
    clearResult();
  };

  const updateOfficerCount = (value: number) => {
    setSelectedPreset(null);
    setOverrides((current) => ({ ...current, total_officers: value }));
    clearResult();
  };

  const updateTargetCount = (value: number) => {
    setSelectedPreset(null);
    setOverrides((current) => ({
      ...current,
      target_hotspot_ids: baseline
        .slice(0, value)
        .map((hotspot) => hotspot.hotspot_id),
    }));
    clearResult();
  };

  const resetScenario = () => {
    setSelectedPreset(null);
    setOverrides({});
    clearResult();
  };

  const runScenario = () => {
    runMutation.mutate({
      scenario_name: selectedPreset ?? "Custom deployment scenario",
      overrides,
    });
  };

  const retryInitialData = () => {
    void baselineQuery.refetch();
    void presetsQuery.refetch();
  };

  const baselineUnavailable =
    baselineQuery.isError || (!baselineQuery.isLoading && baseline.length === 0);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        eyebrow="Operational planning"
        title="Deployment Impact Simulator"
        description="Test officer deployment scenarios against the latest EIS, forecast, and allocation baseline before operational rollout."
        actions={
          <div className="flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.07] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
            <ShieldCheck className="h-3.5 w-3.5" />
            Read-only analysis
          </div>
        }
      />

      <section className="relative overflow-hidden rounded-[30px] border border-cyan-300/[0.12] bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_35%),linear-gradient(145deg,rgba(8,24,36,0.96),rgba(3,11,20,0.98))] p-5 shadow-[0_30px_90px_-60px_rgba(34,211,238,0.65)] sm:p-7">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border border-cyan-300/10 bg-cyan-300/[0.025]" />
        <div className="relative grid gap-6 xl:grid-cols-[1.1fr_0.9fr] xl:items-end">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-300/70">
              <FlaskConical className="h-4 w-4" />
              Evidence-backed scenario analysis
            </div>
            <h2 className="mt-4 max-w-2xl font-display text-2xl font-bold tracking-[-0.03em] text-white sm:text-3xl">
              Measure operational impact before changing deployment.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Configure a scenario, run it against the current analytics
              baseline, and compare EIS and officer allocation outcomes. Results
              remain analytical and do not write to operational data.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-2">
            {[
              {
                label: "Baseline hotspots",
                value: baselineQuery.isLoading
                  ? "—"
                  : numberFormatter.format(baselineSummary.hotspotCount),
                icon: Target,
              },
              {
                label: "Allocated officers",
                value: baselineQuery.isLoading
                  ? "—"
                  : numberFormatter.format(baselineSummary.allocatedOfficers),
                icon: Users,
              },
              {
                label: "Average EIS",
                value:
                  baselineSummary.averageEis === null
                    ? "—"
                    : numberFormatter.format(baselineSummary.averageEis),
                icon: Gauge,
              },
              {
                label: "High / critical",
                value: baselineQuery.isLoading
                  ? "—"
                  : numberFormatter.format(baselineSummary.elevatedRisk),
                icon: AlertTriangle,
              },
            ].map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="rounded-2xl border border-white/[0.08] bg-black/20 p-3.5 backdrop-blur-sm"
              >
                <div className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  <Icon className="h-3.5 w-3.5 text-cyan-300/80" />
                  {label}
                </div>
                <p className="mt-2 font-mono text-xl font-bold text-white">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-cyan-300/70">
              API scenarios
            </p>
            <h2 className="mt-1 font-display text-lg font-semibold text-white">
              Preset strategies
            </h2>
          </div>
          {presetsQuery.isLoading && (
            <span className="flex items-center gap-2 text-xs text-slate-500">
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
              Loading presets
            </span>
          )}
        </div>

        {presetsQuery.isError ? (
          <Card className="flex items-center justify-between gap-4 rounded-2xl border-amber-400/15 bg-amber-400/[0.045] p-4">
            <div>
              <p className="text-sm font-semibold text-amber-100">
                Presets are currently unavailable
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {getErrorMessage(presetsQuery.error)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void presetsQuery.refetch()}
              className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-cyan-300/25 hover:bg-cyan-300/[0.06]"
            >
              Retry
            </button>
          </Card>
        ) : !presetsQuery.isLoading && presets.length === 0 ? (
          <Card className="rounded-2xl border-dashed p-5 text-sm text-slate-500">
            No preset strategies were returned by the simulator service.
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {presets.map((preset) => {
              const isSelected = selectedPreset === preset.name;
              const labels = formatOverrideSummary(preset.overrides);

              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={`group min-h-40 rounded-[22px] border p-4 text-left transition duration-300 ${
                    isSelected
                      ? "border-cyan-300/35 bg-cyan-300/[0.09] shadow-[0_18px_50px_-35px_rgba(34,211,238,0.9)]"
                      : "border-white/[0.08] bg-slate-950/45 hover:-translate-y-0.5 hover:border-cyan-300/20 hover:bg-slate-900/55"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-300/15 bg-cyan-300/[0.07] text-cyan-200">
                      <Layers3 className="h-4 w-4" />
                    </span>
                    {isSelected ? (
                      <CheckCircle2 className="h-4 w-4 text-cyan-300" />
                    ) : (
                      <ArrowRight className="h-4 w-4 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-cyan-300" />
                    )}
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-white">
                    {preset.name}
                  </h3>
                  {preset.description && (
                    <p className="mt-1.5 text-xs leading-5 text-slate-500">
                      {preset.description}
                    </p>
                  )}
                  {labels.length > 0 && (
                    <p className="mt-3 text-[10px] font-medium uppercase tracking-[0.12em] text-cyan-300/65">
                      {labels.join(" · ")}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </section>

      <div className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
        <Card className="h-fit rounded-[26px] border-white/[0.08] bg-slate-950/55 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-cyan-300/70">
                Scenario controls
              </p>
              <h2 className="mt-1 text-base font-semibold text-white">
                Deployment inputs
              </h2>
            </div>
            <Sparkles className="h-4 w-4 text-amber-300/80" />
          </div>

          {baselineQuery.isLoading ? (
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 text-sm text-slate-400">
              <LoaderCircle className="h-4 w-4 animate-spin text-cyan-300" />
              Loading current baseline
            </div>
          ) : baselineUnavailable ? (
            <div className="mt-6 rounded-2xl border border-rose-400/15 bg-rose-400/[0.045] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-rose-100">
                <AlertTriangle className="h-4 w-4" />
                Baseline unavailable
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {baselineQuery.isError
                  ? getErrorMessage(baselineQuery.error)
                  : "No baseline hotspots were returned by the simulator service."}
              </p>
              <button
                type="button"
                onClick={retryInitialData}
                className="mt-3 inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-cyan-300/25 hover:bg-cyan-300/[0.06]"
              >
                <RefreshCcw className="h-3.5 w-3.5" />
                Retry
              </button>
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              <label className="block">
                <span className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-300">
                  Total officers
                  <span className="rounded-lg border border-cyan-300/15 bg-cyan-300/[0.06] px-2 py-1 font-mono text-cyan-200">
                    {officerCount}
                  </span>
                </span>
                <input
                  type="range"
                  min={0}
                  max={officerMaximum}
                  step={1}
                  value={officerCount}
                  onChange={(event) =>
                    updateOfficerCount(Number(event.target.value))
                  }
                  className="mt-3 h-1.5 w-full cursor-pointer accent-cyan-300"
                />
                <span className="mt-2 block text-[11px] leading-4 text-slate-600">
                  Current allocation baseline:{" "}
                  {baselineSummary.allocatedOfficers}
                </span>
              </label>

              <label className="block">
                <span className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-300">
                  Target hotspots
                  <span className="rounded-lg border border-cyan-300/15 bg-cyan-300/[0.06] px-2 py-1 font-mono text-cyan-200">
                    {targetHotspotCount}
                  </span>
                </span>
                <input
                  type="range"
                  min={1}
                  max={baselineSummary.hotspotCount}
                  step={1}
                  value={targetHotspotCount}
                  onChange={(event) =>
                    updateTargetCount(Number(event.target.value))
                  }
                  className="mt-3 h-1.5 w-full cursor-pointer accent-cyan-300"
                />
                <span className="mt-2 block text-[11px] leading-4 text-slate-600">
                  Targets the highest-EIS hotspots in the returned baseline.
                </span>
              </label>

              {formatOverrideSummary(overrides).length > 0 && (
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3.5">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Active parameters
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {formatOverrideSummary(overrides).map((label) => (
                      <span
                        key={label}
                        className="rounded-lg border border-cyan-300/10 bg-cyan-300/[0.05] px-2 py-1 text-[10px] text-cyan-100/75"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-[1fr_auto] gap-2">
                <button
                  type="button"
                  onClick={runScenario}
                  disabled={runMutation.isPending || baselineUnavailable}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-xs font-bold text-slate-950 shadow-[0_12px_32px_-18px_rgba(103,232,249,0.95)] transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {runMutation.isPending ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 fill-current" />
                  )}
                  {runMutation.isPending ? "Running…" : "Run simulation"}
                </button>
                <button
                  type="button"
                  onClick={resetScenario}
                  className="inline-flex items-center justify-center rounded-xl border border-white/10 px-3.5 text-slate-400 transition hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
                  aria-label="Reset scenario"
                  title="Reset scenario"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </Card>

        <Card className="min-h-[390px] overflow-hidden rounded-[26px] border-white/[0.08] bg-slate-950/45">
          <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] px-5 py-4 sm:px-6">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-cyan-300/70">
                Comparative output
              </p>
              <h2 className="mt-1 text-base font-semibold text-white">
                Simulation results
              </h2>
            </div>
            {simulationResult && (
              <span className="max-w-[220px] truncate rounded-full border border-white/[0.08] bg-white/[0.035] px-3 py-1.5 text-[10px] font-medium text-slate-400">
                {simulationResult.scenario_name}
              </span>
            )}
          </div>

          {runMutation.isError ? (
            <div className="flex min-h-[320px] items-center justify-center p-6 text-center">
              <div className="max-w-md">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-400/15 bg-rose-400/[0.07] text-rose-300">
                  <AlertTriangle className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-white">
                  Simulation could not be completed
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {getErrorMessage(runMutation.error)}
                </p>
                <button
                  type="button"
                  onClick={runScenario}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/[0.07] px-4 py-2.5 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-300/[0.12]"
                >
                  <RefreshCcw className="h-3.5 w-3.5" />
                  Retry simulation
                </button>
              </div>
            </div>
          ) : !simulationResult ? (
            <div className="flex min-h-[320px] items-center justify-center p-6 text-center">
              <div className="max-w-md">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.055] text-cyan-200 shadow-[0_0_35px_-18px_rgba(34,211,238,0.9)]">
                  <FlaskConical className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-white">
                  Configure and run a scenario
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Results appear here only after the simulator API completes a
                  run. Changing controls does not trigger automatic analysis.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-5 p-5 sm:p-6">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    label: "Average EIS",
                    before: simulationResult.baseline_average_eis,
                    after: simulationResult.simulated_average_eis,
                    delta: simulationResult.average_eis_delta,
                  },
                  {
                    label: "Officer pool",
                    before: simulationResult.baseline_total_officers,
                    after: simulationResult.simulated_total_officers,
                    delta:
                      simulationResult.simulated_total_officers -
                      simulationResult.baseline_total_officers,
                  },
                ].map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-2xl border border-white/[0.07] bg-black/20 p-4 sm:col-span-1 lg:col-span-2"
                  >
                    <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {metric.label}
                    </p>
                    <div className="mt-3 flex items-end justify-between gap-4">
                      <div>
                        <span className="block text-[10px] text-slate-600">
                          Baseline
                        </span>
                        <span className="font-mono text-lg font-semibold text-slate-300">
                          {numberFormatter.format(metric.before)}
                        </span>
                      </div>
                      <ArrowRight className="mb-1 h-4 w-4 text-slate-700" />
                      <div className="text-right">
                        <span className="block text-[10px] text-cyan-300/70">
                          Simulated
                        </span>
                        <span className="font-mono text-2xl font-bold text-cyan-200">
                          {numberFormatter.format(metric.after)}
                        </span>
                      </div>
                    </div>
                    <p
                      className={`mt-2 flex items-center justify-end gap-1 text-[10px] font-semibold ${
                        metric.delta < 0
                          ? "text-emerald-300"
                          : metric.delta > 0
                            ? "text-amber-300"
                            : "text-slate-500"
                      }`}
                    >
                      <ArrowDownRight className="h-3 w-3" />
                      {metric.delta > 0 ? "+" : ""}
                      {numberFormatter.format(metric.delta)} change
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ["Hotspots assessed", simulationResult.total_hotspots],
                  ["Improved", simulationResult.improved_hotspots],
                  ["Unchanged", simulationResult.unchanged_hotspots],
                  ["Worsened", simulationResult.worsened_hotspots],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3"
                  >
                    <p className="text-[9px] uppercase tracking-[0.14em] text-slate-600">
                      {label}
                    </p>
                    <p className="mt-1.5 font-mono text-lg font-bold text-white">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              {simulationResult.hotspot_results.length > 0 && (
                <div className="overflow-hidden rounded-2xl border border-white/[0.07]">
                  <div className="border-b border-white/[0.07] bg-white/[0.025] px-4 py-3">
                    <h3 className="text-xs font-semibold text-white">
                      Hotspot impact
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[680px] text-left">
                      <thead className="bg-black/20 text-[9px] uppercase tracking-[0.14em] text-slate-600">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Hotspot</th>
                          <th className="px-4 py-3 font-semibold">Risk shift</th>
                          <th className="px-4 py-3 text-right font-semibold">
                            EIS
                          </th>
                          <th className="px-4 py-3 text-right font-semibold">
                            Officers
                          </th>
                          <th className="px-4 py-3 text-right font-semibold">
                            Impact
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.055]">
                        {simulationResult.hotspot_results.map((hotspot) => (
                          <tr
                            key={hotspot.hotspot_id}
                            className="text-xs text-slate-300 transition hover:bg-white/[0.025]"
                          >
                            <td className="px-4 py-3.5">
                              <span className="block font-semibold text-white">
                                {hotspot.hotspot_name ||
                                  `Hotspot ${hotspot.hotspot_id}`}
                              </span>
                              {hotspot.zone_id && (
                                <span className="mt-0.5 block text-[10px] text-slate-600">
                                  {hotspot.zone_id}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`rounded-lg border px-2 py-1 text-[9px] font-semibold uppercase ${riskTone(
                                    hotspot.baseline_risk_category
                                  )}`}
                                >
                                  {hotspot.baseline_risk_category}
                                </span>
                                <ArrowRight className="h-3 w-3 text-slate-700" />
                                <span
                                  className={`rounded-lg border px-2 py-1 text-[9px] font-semibold uppercase ${riskTone(
                                    hotspot.simulated_risk_category
                                  )}`}
                                >
                                  {hotspot.simulated_risk_category}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-right font-mono">
                              {numberFormatter.format(hotspot.baseline_eis)}
                              <span className="mx-1.5 text-slate-700">→</span>
                              <span className="text-cyan-200">
                                {numberFormatter.format(hotspot.simulated_eis)}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-right font-mono">
                              {hotspot.baseline_officers}
                              <span className="mx-1.5 text-slate-700">→</span>
                              <span className="text-white">
                                {hotspot.simulated_officers}
                              </span>
                            </td>
                            <td
                              className={`px-4 py-3.5 text-right font-mono font-semibold ${
                                hotspot.eis_delta < 0
                                  ? "text-emerald-300"
                                  : hotspot.eis_delta > 0
                                    ? "text-rose-300"
                                    : "text-slate-500"
                              }`}
                            >
                              {hotspot.eis_delta > 0 ? "+" : ""}
                              {numberFormatter.format(hotspot.eis_delta)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
