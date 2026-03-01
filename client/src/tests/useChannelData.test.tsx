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

const mockFetchChannels = vi.fn();

vi.mock("../api/api", () => ({
  fetchChannels: (id: string) => mockFetchChannels(id),
}));

/* ── import AFTER mocks ──────────────────────────────────────────────── */

const { useChannelData } = await import("../hooks/useChannelData");

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

const mockChannelData = {
  features: [
    {
      id: "channel-1",
      type: "Feature",
      geometry: { type: "LineString", coordinates: [] },
      properties: {},
    },
  ],
};

/* ── tests ───────────────────────────────────────────────────────────── */

describe("useChannelData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDesired = JSON.parse(JSON.stringify(INITIAL_DESIRED));
    mockRuntime = JSON.parse(JSON.stringify(INITIAL_RUNTIME));
    mockFetchChannels.mockResolvedValue(mockChannelData);
  });

  it("returns channel data when enabled", async () => {
    mockDesired = desiredWith("channels");

    const { result } = renderHook(() => useChannelData("watershed-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.channelData).toEqual(mockChannelData);
    });
  });

  it("reports data availability when data arrives", async () => {
    mockDesired = desiredWith("channels");

    renderHook(() => useChannelData("watershed-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockSetDataAvailability).toHaveBeenCalledWith("channels", true);
    });
  });

  it("reports unavailable when fetch returns empty features", async () => {
    mockDesired = desiredWith("channels");
    mockFetchChannels.mockResolvedValue({ features: [] });

    renderHook(() => useChannelData("watershed-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockSetDataAvailability).toHaveBeenCalledWith("channels", false);
    });
  });

  it("reports loading flag", async () => {
    mockDesired = desiredWith("channels");

    renderHook(() => useChannelData("watershed-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockSetLayerLoading).toHaveBeenCalledWith("channels", false);
    });
  });

  it("clears availability while loading", async () => {
    mockDesired = desiredWith("channels");
    mockFetchChannels.mockReturnValue(new Promise(() => {}));

    renderHook(() => useChannelData("watershed-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockSetDataAvailability).toHaveBeenCalledWith(
        "channels",
        undefined,
      );
    });
  });

  it("does not fetch when runId is null", () => {
    mockDesired = desiredWith("channels");

    const { result } = renderHook(() => useChannelData(null), {
      wrapper: createWrapper(),
    });

    expect(result.current.channelData).toBeUndefined();
    expect(mockFetchChannels).not.toHaveBeenCalled();
  });
});
