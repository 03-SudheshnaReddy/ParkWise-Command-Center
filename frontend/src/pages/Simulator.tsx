import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AlertTriangle, Cpu, HelpCircle, Layers } from "lucide-react";
import { PageHeader } from "@/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { apiGet, apiPost } from "@/lib/api";

export default function SimulatorPage() {
  const [officers, setOfficers] = useState(20);
  const [hotspots, setHotspots] = useState(4);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  // Fetch baseline stats
  const { data: baseline, isLoading: isBaselineLoading, error: baselineError } = useQuery({
    queryKey: ["simulator-baseline"],
    queryFn: () => apiGet<any>("/simulator/baseline"),
    refetchInterval: 10000,
  });

  // Fetch presets
  const { data: presets = [], isLoading: isPresetsLoading, error: presetsError } = useQuery({
    queryKey: ["simulator-presets"],
    queryFn: () => apiGet<any[]>("/simulator/presets"),
    refetchInterval: 10000,
  });

  // Run simulation mutation
  const runMutation = useMutation({
    mutationFn: () =>
      apiPost<any>("/simulator/run", {
        total_officers: officers,
        top_n_hotspots: hotspots,
      }),
    onSuccess: (data) => {
      setSimulationResult(data);
    },
  });

  // Auto-run simulation when parameters change or baseline loads
  useEffect(() => {
    runMutation.mutate();
  }, [officers, hotspots]);

  // Apply a preset
  const applyPreset = (preset: any) => {
    setOfficers(preset.officers);
    setHotspots(preset.top_n_hotspots);
  };

  const isLoading = isBaselineLoading || isPresetsLoading;

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400" />
          <p className="text-sm font-semibold">Preparing virtual sandbox environment...</p>
        </div>
      </div>
    );
  }

  if (baselineError || presetsError) {
    return (
      <div className="rounded-3xl border border-red-900 bg-red-950/20 p-8 text-center text-red-300">
        <AlertTriangle className="mx-auto h-12 w-12 mb-3 text-red-500 animate-pulse" />
        <h3 className="text-lg font-semibold text-white">Simulator Stream Disconnected</h3>
        <p className="mt-2 text-sm text-slate-400">
          Verify backend connectivity at <code className="text-red-200">http://127.0.0.1:8000/api/v1</code> or toggle header Mode to Mock.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Impact Simulator"
        description="Verify virtual deployment scenarios and simulate city-wide coverage and average EIS risk levels in real-time."
      />

      {/* Preset Scenarios */}
      <div className="grid gap-4 sm:grid-cols-3">
        {presets.map((preset) => (
          <div
            key={preset.id}
            onClick={() => applyPreset(preset)}
            className="group rounded-2xl border border-slate-800 bg-slate-950/40 p-4 hover:border-cyan-500/40 hover:bg-slate-900/20 cursor-pointer transition"
          >
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">
              <Layers size={12} className="text-cyan-400" />
              <span>Preset Scenario</span>
            </div>
            <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
              {preset.name}
            </h4>
            <p className="text-xs text-slate-500 mt-2">
              Simulate dispatching {preset.officers} officers over {preset.top_n_hotspots} hotspot routes.
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
        {/* Sliders Panel */}
        <Card className="rounded-[28px] border border-slate-800 bg-slate-950/60 p-5 space-y-6 h-fit">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Sandbox Controls</h3>
            <p className="text-xs text-slate-500 mt-1">Simulate changes dynamically by moving the slider sliders</p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-xs font-semibold text-slate-400">
              <span>Simulated Officer Count</span>
              <span className="font-mono text-cyan-300 font-bold">{officers}</span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              value={officers}
              onChange={(e) => setOfficers(Number(e.target.value))}
              className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer h-1.5"
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-xs font-semibold text-slate-400">
              <span>Simulated Top Hotspots</span>
              <span className="font-mono text-cyan-300 font-bold">{hotspots}</span>
            </div>
            <input
              type="range"
              min="2"
              max="10"
              step="1"
              value={hotspots}
              onChange={(e) => setHotspots(Number(e.target.value))}
              className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer h-1.5"
            />
          </div>
        </Card>

        {/* Results Panel */}
        <Card className="rounded-[32px] border border-slate-800 bg-slate-950/45 p-6 space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-md font-semibold text-white">Simulation Metrics Output</h3>
              {runMutation.isPending && (
                <span className="text-xs text-slate-400 animate-pulse flex items-center gap-1.5">
                  <Cpu size={12} className="text-cyan-400" />
                  sandbox computing...
                </span>
              )}
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {/* Coverage comparison */}
              <div className="rounded-2xl bg-slate-950/80 p-4 border border-slate-800 space-y-3">
                <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">City Coverage (%)</p>
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Baseline</span>
                    <span className="text-lg font-mono font-semibold text-slate-300">{baseline?.baseline_coverage ?? 62.5}%</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-cyan-400 block">Simulated</span>
                    <span className="text-2xl font-mono font-bold text-cyan-300">
                      {simulationResult?.simulated_coverage ?? baseline?.baseline_coverage ?? 62.5}%
                    </span>
                  </div>
                </div>
              </div>

              {/* EIS Risk comparison */}
              <div className="rounded-2xl bg-slate-950/80 p-4 border border-slate-800 space-y-3">
                <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Avg EIS Risk Level</p>
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Baseline</span>
                    <span className="text-lg font-mono font-semibold text-slate-300">{baseline?.baseline_eis_avg ?? 77.5}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-amber-400 block">Simulated</span>
                    <span className="text-2xl font-mono font-bold text-amber-300">
                      {simulationResult?.simulated_eis_avg ?? baseline?.baseline_eis_avg ?? 77.5}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Recommendation */}
          {simulationResult && (
            <div className="rounded-2xl bg-cyan-950/20 p-4 border border-cyan-900/30 space-y-2 mt-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-cyan-400 font-bold">
                <HelpCircle size={13} />
                <span>AI sandbox recommendation</span>
              </div>
              <p className="text-sm text-slate-300 italic leading-relaxed">
                "{simulationResult.recommendation}"
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
