import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { INITIAL_DESIRED, INITIAL_RUNTIME } from "../layers/rules";
import { evaluate, isDesiredButBlocked } from "../layers/evaluate";
import type { LayerId, DesiredMap, LayerRuntime } from "../layers/types";

/* ── controllable mock state ─────────────────────────────────────────── */

let mockDesired: DesiredMap = JSON.parse(JSON.stringify(INITIAL_DESIRED));
let mockRuntime: LayerRuntime = JSON.parse(JSON.stringify(INITIAL_RUNTIME));

const mockSetDataAvailability = vi.fn();
const mockSetLayerLoading = vi.fn();

vi.mock("../contexts/WatershedContext", () => ({
  useWatershed: () => {
    const eff = evaluate(mockDesired, mockRuntime);
    return {
      layerDesired: mockDesired,
      layerRuntime: mockRuntime,
      selectedHillslopeId: null,
      dispatch: vi.fn(),
      dispatchLayerAction: vi.fn(),
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

const mockFetchLanduse = vi.fn();

vi.mock("../api/landuseApi", () => ({
  fetchLanduse: (opts: { runId: string }) => mockFetchLanduse(opts),
}));

/* ── import AFTER mocks ──────────────────────────────────────────────── */

const { useLanduseData } = await import("../hooks/useLanduseData");

/* ── helpers ─────────────────────────────────────────────────────────── */

const desiredWith = (...ids: LayerId[]): DesiredMap => {
  const d = JSON.parse(JSON.stringify(INITIAL_DESIRED)) as DesiredMap;
  for (const id of ids) d[id].enabled = true;
  return d;
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

/* ── tests ───────────────────────────────────────────────────────────── */

describe("useLanduseData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDesired = JSON.parse(JSON.stringify(INITIAL_DESIRED));
    mockRuntime = JSON.parse(JSON.stringify(INITIAL_RUNTIME));
    mockFetchLanduse.mockResolvedValue({
      1: { desc: "Forest", color: "#ff0000" },
      2: { desc: "Grassland", color: "#00ff00" },
    });
  });

  it("returns empty legend when landuse is not effective", () => {
    const { result } = renderHook(() => useLanduseData("watershed-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current.landuseLegendMap).toEqual({});
  });

  it("computes legend map when landuse is effective and data available", async () => {
    mockDesired = desiredWith("subcatchment", "landuse");
    mockRuntime = {
      ...INITIAL_RUNTIME,
      dataAvailability: { subcatchment: true, landuse: true },
    };

    const { result } = renderHook(() => useLanduseData("watershed-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.landuseLegendMap).toEqual({
        "#ff0000": "Forest",
        "#00ff00": "Grassland",
      });
    });
  });

  it("reports data availability when data arrives", async () => {
    mockDesired = desiredWith("subcatchment", "landuse");

    renderHook(() => useLanduseData("watershed-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockSetDataAvailability).toHaveBeenCalledWith("landuse", true);
    });
  });

  it("reports landuse unavailable when fetch returns empty object", async () => {
    mockDesired = desiredWith("subcatchment", "landuse");
    mockFetchLanduse.mockResolvedValue({});

    renderHook(() => useLanduseData("watershed-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockSetDataAvailability).toHaveBeenCalledWith("landuse", false);
    });
  });

  it("reports loading flag", async () => {
    mockDesired = desiredWith("subcatchment", "landuse");

    renderHook(() => useLanduseData("watershed-1"), {
      wrapper: createWrapper(),
    });

    // Loading should be reported (initially true, then false)
    await waitFor(() => {
      expect(mockSetLayerLoading).toHaveBeenCalledWith("landuse", false);
    });
  });

  it("handles entries without color/desc gracefully", async () => {
    mockDesired = desiredWith("subcatchment", "landuse");
    mockRuntime = {
      ...INITIAL_RUNTIME,
      dataAvailability: { subcatchment: true, landuse: true },
    };
    mockFetchLanduse.mockResolvedValue({
      1: { desc: "", color: "" },
      2: { desc: "", color: "" },
    });

    const { result } = renderHook(() => useLanduseData("watershed-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.landuseLegendMap).toEqual({});
    });
  });

  it("returns empty legend when runId is null", () => {
    mockDesired = desiredWith("subcatchment", "landuse");

    const { result } = renderHook(() => useLanduseData(null), {
      wrapper: createWrapper(),
    });

    expect(result.current.landuseLegendMap).toEqual({});
  });
});
