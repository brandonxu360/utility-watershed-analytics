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

const mockFetchSubcatchments = vi.fn();

vi.mock("../api/api", () => ({
  fetchSubcatchments: (id: string) => mockFetchSubcatchments(id),
}));

/* ── import AFTER mocks ──────────────────────────────────────────────── */

const { useSubcatchmentData } = await import("../hooks/useSubcatchmentData");

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

const mockSubcatchmentData = {
  features: [
    {
      id: "sub-1",
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [] },
      properties: { topazid: 1, weppid: 101 },
    },
  ],
};

/* ── tests ───────────────────────────────────────────────────────────── */

describe("useSubcatchmentData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDesired = JSON.parse(JSON.stringify(INITIAL_DESIRED));
    mockRuntime = JSON.parse(JSON.stringify(INITIAL_RUNTIME));
    mockFetchSubcatchments.mockResolvedValue(mockSubcatchmentData);
  });

  it("returns subcatchment data when enabled", async () => {
    mockDesired = desiredWith("subcatchment");

    const { result } = renderHook(() => useSubcatchmentData("watershed-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.subcatchments).toEqual(mockSubcatchmentData);
    });
  });

  it("reports data availability when data arrives", async () => {
    mockDesired = desiredWith("subcatchment");

    renderHook(() => useSubcatchmentData("watershed-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockSetDataAvailability).toHaveBeenCalledWith(
        "subcatchment",
        true,
      );
    });
  });

  it("reports unavailable when fetch returns empty features", async () => {
    mockDesired = desiredWith("subcatchment");
    mockFetchSubcatchments.mockResolvedValue({ features: [] });

    renderHook(() => useSubcatchmentData("watershed-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockSetDataAvailability).toHaveBeenCalledWith(
        "subcatchment",
        false,
      );
    });
  });

  it("reports loading flag", async () => {
    mockDesired = desiredWith("subcatchment");

    renderHook(() => useSubcatchmentData("watershed-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockSetLayerLoading).toHaveBeenCalledWith("subcatchment", false);
    });
  });

  it("clears availability while loading", async () => {
    mockDesired = desiredWith("subcatchment");
    mockFetchSubcatchments.mockReturnValue(new Promise(() => {}));

    renderHook(() => useSubcatchmentData("watershed-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockSetDataAvailability).toHaveBeenCalledWith(
        "subcatchment",
        undefined,
      );
    });
  });

  it("does not fetch when runId is null", () => {
    mockDesired = desiredWith("subcatchment");

    const { result } = renderHook(() => useSubcatchmentData(null), {
      wrapper: createWrapper(),
    });

    expect(result.current.subcatchments).toBeUndefined();
    expect(mockFetchSubcatchments).not.toHaveBeenCalled();
  });
});
