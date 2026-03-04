import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { INITIAL_DESIRED, INITIAL_RUNTIME } from "../layers/rules";
import { evaluate, isDesiredButBlocked } from "../layers/evaluate";
import type { LayerId, DesiredMap, LayerRuntime } from "../layers/types";

let mockDesired: DesiredMap = JSON.parse(JSON.stringify(INITIAL_DESIRED));
let mockRuntime: LayerRuntime = JSON.parse(JSON.stringify(INITIAL_RUNTIME));

const mockSetDataAvailability = vi.fn();
const mockSetLayerLoading = vi.fn();
const mockDispatchLayerAction = vi.fn();

vi.mock("../contexts/WatershedContext", () => ({
  useWatershed: () => {
    const eff = evaluate(mockDesired, mockRuntime);
    return {
      layerDesired: mockDesired,
      layerRuntime: mockRuntime,
      selectedHillslopeId: null,
      dispatch: vi.fn(),
      dispatchLayerAction: mockDispatchLayerAction,
      enableLayerWithParams: vi.fn(),
      setDataAvailability: mockSetDataAvailability,
      setLayerLoading: mockSetLayerLoading,
      setZoom: vi.fn(),
      setSelectedHillslope: vi.fn(),
      clearSelectedHillslope: vi.fn(),
      effective: eff,
      activeIds: [],
      isBlocked: (id: LayerId) => isDesiredButBlocked(id, mockDesired, eff),
      isEffective: (id: LayerId) => eff[id].enabled,
    };
  },
}));

let mockRunId: string | null = "watershed-1";
vi.mock("@tanstack/react-router", () => ({
  useParams: () => mockRunId,
}));

const mockFetchScenarioData = vi.fn();
vi.mock("../api/scenarioApi", () => ({
  fetchScenarioData: (opts: unknown) => mockFetchScenarioData(opts),
}));

const { useScenarioData } = await import("../hooks/useScenarioData");

function desiredWith(...ids: LayerId[]): DesiredMap {
  const d = JSON.parse(JSON.stringify(INITIAL_DESIRED)) as DesiredMap;
  for (const id of ids) d[id].enabled = true;
  return d;
}

function desiredWithScenario(
  scenario: string | null,
  variable = "sediment_yield",
): DesiredMap {
  const d = desiredWith("subcatchment", "scenario");
  d.scenario.params = { scenario, variable };
  return d;
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const MOCK_SCENARIO_ROWS = [
  {
    wepp_id: 1,
    runoff: 10.5,
    subrunoff: 3.2,
    baseflow: 1.1,
    soil_loss: 0.5,
    sediment_deposition: 0.3,
    sediment_yield: 20.3,
    hillslope_area: 5000,
  },
  {
    wepp_id: 2,
    runoff: 5.2,
    subrunoff: 2.0,
    baseflow: 0.8,
    soil_loss: 0.2,
    sediment_deposition: 0.1,
    sediment_yield: 8.1,
    hillslope_area: 3000,
  },
  {
    wepp_id: 3,
    runoff: 15.0,
    subrunoff: 5.5,
    baseflow: 2.0,
    soil_loss: 1.0,
    sediment_deposition: 0.6,
    sediment_yield: 35.7,
    hillslope_area: 7000,
  },
];

describe("useScenarioData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDesired = JSON.parse(JSON.stringify(INITIAL_DESIRED));
    mockRuntime = JSON.parse(JSON.stringify(INITIAL_RUNTIME));
    mockRunId = "watershed-1";
    mockFetchScenarioData.mockResolvedValue(MOCK_SCENARIO_ROWS);
  });

  it("returns hasData=true when scenario enabled and data available", async () => {
    mockDesired = desiredWithScenario("undisturbed");

    const { result } = renderHook(() => useScenarioData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.hasData).toBe(true);
    });
  });

  it("returns hasData=false when no scenario selected", () => {
    mockDesired = desiredWith("subcatchment", "scenario");
    mockDesired.scenario.params = {
      scenario: null,
      variable: "sediment_yield",
    };

    const { result } = renderHook(() => useScenarioData(), {
      wrapper: createWrapper(),
    });

    expect(result.current.hasData).toBe(false);
    expect(mockFetchScenarioData).not.toHaveBeenCalled();
  });

  it("returns hasData=false when runId is null", () => {
    mockRunId = null;
    mockDesired = desiredWithScenario("undisturbed");

    const { result } = renderHook(() => useScenarioData(), {
      wrapper: createWrapper(),
    });

    expect(result.current.hasData).toBe(false);
    expect(mockFetchScenarioData).not.toHaveBeenCalled();
  });

  it("returns hasData=false when scenario is disabled", () => {
    mockDesired = JSON.parse(JSON.stringify(INITIAL_DESIRED));
    mockDesired.scenario.params = {
      scenario: "undisturbed",
      variable: "sediment_yield",
    };
    // scenario.enabled is false

    const { result } = renderHook(() => useScenarioData(), {
      wrapper: createWrapper(),
    });

    expect(result.current.hasData).toBe(false);
    expect(mockFetchScenarioData).not.toHaveBeenCalled();
  });

  it("reports loading via isLoading", async () => {
    mockDesired = desiredWithScenario("undisturbed");
    mockFetchScenarioData.mockReturnValue(new Promise(() => {})); // never resolves

    const { result } = renderHook(() => useScenarioData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });
  });

  it("reports data unavailable (does not dispatch) when scenario returns no data", async () => {
    mockDesired = desiredWithScenario("undisturbed");
    mockFetchScenarioData.mockResolvedValue([]); // empty → no data

    renderHook(() => useScenarioData(), {
      wrapper: createWrapper(),
    });

    // The layer system handles blocking via dataAvailability — no dispatch needed.
    await waitFor(() => {
      expect(mockSetDataAvailability).toHaveBeenCalledWith("scenario", false);
    });
    expect(mockDispatchLayerAction).not.toHaveBeenCalled();
  });

  it("does NOT auto-revert when data is available", async () => {
    mockDesired = desiredWithScenario("undisturbed");

    renderHook(() => useScenarioData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockDispatchLayerAction).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: "TOGGLE", id: "scenario", on: false }),
      );
    });
  });

  it("returns null when scenario is not effective", async () => {
    // Desired enabled but data availability false → not effective
    mockDesired = desiredWithScenario("undisturbed");
    mockRuntime.dataAvailability.scenario = false;

    const { result } = renderHook(() => useScenarioData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.getScenarioStyle(1)).toBeNull();
    });
  });

  it("returns null when weppid is undefined", async () => {
    mockDesired = desiredWithScenario("undisturbed");
    mockRuntime.dataAvailability.scenario = true;
    mockRuntime.dataAvailability.subcatchment = true;

    const { result } = renderHook(() => useScenarioData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.hasData).toBe(true);
    });

    expect(result.current.getScenarioStyle(undefined)).toBeNull();
  });

  it("returns null when weppid not found in data", async () => {
    mockDesired = desiredWithScenario("undisturbed");
    mockRuntime.dataAvailability.scenario = true;
    mockRuntime.dataAvailability.subcatchment = true;

    const { result } = renderHook(() => useScenarioData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.hasData).toBe(true);
    });

    expect(result.current.getScenarioStyle(9999)).toBeNull();
  });

  it("returns a PathOptions style for a valid weppid", async () => {
    mockDesired = desiredWithScenario("undisturbed");
    mockRuntime.dataAvailability.scenario = true;
    mockRuntime.dataAvailability.subcatchment = true;

    const { result } = renderHook(() => useScenarioData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.hasData).toBe(true);
    });

    const style = result.current.getScenarioStyle(1);
    expect(style).not.toBeNull();
    expect(style).toMatchObject({
      color: "#2c2c2c",
      weight: 0.75,
      fillOpacity: 0.85,
    });
    expect(style!.fillColor).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
  });

  it("returns a style for runoff variable", async () => {
    mockDesired = desiredWithScenario("undisturbed", "runoff");
    mockRuntime.dataAvailability.scenario = true;
    mockRuntime.dataAvailability.subcatchment = true;

    const { result } = renderHook(() => useScenarioData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.hasData).toBe(true);
    });

    const style = result.current.getScenarioStyle(2);
    expect(style).not.toBeNull();
    expect(style!.fillColor).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
  });

  it("reports data availability via useLayerQuery", async () => {
    mockDesired = desiredWithScenario("undisturbed");

    renderHook(() => useScenarioData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockSetDataAvailability).toHaveBeenCalledWith("scenario", true);
    });
  });

  it("reports data unavailable when fetch returns empty", async () => {
    mockDesired = desiredWithScenario("undisturbed");
    mockFetchScenarioData.mockResolvedValue([]);

    renderHook(() => useScenarioData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockSetDataAvailability).toHaveBeenCalledWith("scenario", false);
    });
  });

  it("getScenarioStyle returns null when there is no data", () => {
    mockDesired = desiredWithScenario("undisturbed");

    const { result } = renderHook(() => useScenarioData(), {
      wrapper: createWrapper(),
    });

    // Before data loads
    expect(result.current.getScenarioStyle(1)).toBeNull();
  });

  it("getScenarioRow returns row data for a valid weppid", async () => {
    mockDesired = desiredWithScenario("undisturbed");
    mockRuntime.dataAvailability.scenario = true;
    mockRuntime.dataAvailability.subcatchment = true;

    const { result } = renderHook(() => useScenarioData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.hasData).toBe(true);
    });

    const row = result.current.getScenarioRow(1);
    expect(row).toEqual(MOCK_SCENARIO_ROWS[0]);
  });

  it("getScenarioRow returns null for unknown weppid", async () => {
    mockDesired = desiredWithScenario("undisturbed");
    mockRuntime.dataAvailability.scenario = true;
    mockRuntime.dataAvailability.subcatchment = true;

    const { result } = renderHook(() => useScenarioData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.hasData).toBe(true);
    });

    expect(result.current.getScenarioRow(9999)).toBeNull();
  });

  it("getScenarioRow returns null when scenario is not effective", async () => {
    mockDesired = desiredWithScenario("undisturbed");
    mockRuntime.dataAvailability.scenario = false;

    const { result } = renderHook(() => useScenarioData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.getScenarioRow(1)).toBeNull();
    });
  });

  it("getScenarioRow returns null when weppid is undefined", async () => {
    mockDesired = desiredWithScenario("undisturbed");
    mockRuntime.dataAvailability.scenario = true;
    mockRuntime.dataAvailability.subcatchment = true;

    const { result } = renderHook(() => useScenarioData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.hasData).toBe(true);
    });

    expect(result.current.getScenarioRow(undefined)).toBeNull();
  });
});
