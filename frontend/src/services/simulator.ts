import apiClient from "@/lib/axios";
import type {
  RunSimulationRequest,
  SimulationResult,
  SimulatorBaseline,
  SimulatorPreset,
} from "@/types/simulator";

export async function getSimulatorPresets(): Promise<SimulatorPreset[]> {
  const { data } = await apiClient.get<SimulatorPreset[]>("/simulator/presets");
  return data;
}

export async function getSimulatorBaseline(): Promise<SimulatorBaseline[]> {
  const { data } = await apiClient.get<SimulatorBaseline[]>("/simulator/baseline");
  return data;
}

export async function runSimulator(
  payload: RunSimulationRequest
): Promise<SimulationResult> {
  const { data } = await apiClient.post<SimulationResult>(
    "/simulator/run",
    payload
  );
  return data;
}
