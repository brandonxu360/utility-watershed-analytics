import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  useChoropleth,
  CHOROPLETH_CONFIG,
  CHOROPLETH_YEARS,
} from "../hooks/useChoropleth";
import { INITIAL_DESIRED } from "../layers/rules";
import type { DesiredMap } from "../layers/types";

const mockUseParams = vi.fn(() => "batch;;test-batch;;test-run");

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal();
  return Object.assign({}, actual, {
    useParams: () => mockUseParams(),
  });
});

vi.mock("../api/rapApi", () => ({
  fetchRapChoropleth: vi.fn(),
}));

import { fetchRapChoropleth } from "../api/rapApi";

const mockFetchRapChoropleth = vi.mocked(fetchRapChoropleth);

/* ── useWatershed mock ─────────────────────────────────────── */

let mockDesired: DesiredMap = JSON.parse(JSON.stringify(INITIAL_DESIRED));

const mockSetDataAvailability = vi.fn();
const mockSetLayerLoading = vi.fn();

vi.mock("../contexts/WatershedContext", () => ({
  useWatershed: () => ({
    layerDesired: mockDesired,
    setDataAvailability: mockSetDataAvailability,
    setLayerLoading: mockSetLayerLoading,
  }),
}));

/** Helper: build a DesiredMap with choropleth enabled and params set. */
function desiredWithChoropleth(
  metric = "vegetationCover",
  year: number | null = null,
  bands = "all",
): DesiredMap {
  const d: DesiredMap = JSON.parse(JSON.stringify(INITIAL_DESIRED));
  d.choropleth.enabled = true;
  d.choropleth.params = { metric, year, bands };
  return d;
}

/** Wrapper providing a fresh QueryClient for each test. */
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useChoropleth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseParams.mockReturnValue("batch;;test-batch;;test-run");
    mockDesired = JSON.parse(JSON.stringify(INITIAL_DESIRED));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("CHOROPLETH_CONFIG", () => {
    it("has configuration for evapotranspiration", () => {
      expect(CHOROPLETH_CONFIG.evapotranspiration).toBeDefined();
      expect(CHOROPLETH_CONFIG.evapotranspiration.title).toBe(
        "Evapotranspiration",
      );
      expect(CHOROPLETH_CONFIG.evapotranspiration.colormap).toBe("et-blue");
      expect(CHOROPLETH_CONFIG.evapotranspiration.bands).toEqual([1, 4, 5, 6]);
    });

    it("has configuration for vegetationCover", () => {
      expect(CHOROPLETH_CONFIG.vegetationCover).toBeDefined();
      expect(CHOROPLETH_CONFIG.vegetationCover.title).toBe("Vegetation Cover");
      expect(CHOROPLETH_CONFIG.vegetationCover.colormap).toBe("viridis");
      expect(CHOROPLETH_CONFIG.vegetationCover.bands).toEqual([5, 6]);
    });
  });

  describe("CHOROPLETH_YEARS", () => {
    it("generates years from 1986 to 2023", () => {
      expect(CHOROPLETH_YEARS[0]).toBe(1986);
      expect(CHOROPLETH_YEARS[CHOROPLETH_YEARS.length - 1]).toBe(2023);
      expect(CHOROPLETH_YEARS.length).toBe(38);
    });
  });

  describe("hook behavior", () => {
    it("returns inactive state when choropleth is disabled", () => {
      const { result } = renderHook(() => useChoropleth(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isActive).toBe(false);
      expect(result.current.choropleth).toBe("none");
      expect(result.current.config).toBeNull();
    });

    it("returns active state when choropleth is enabled", async () => {
      mockFetchRapChoropleth.mockResolvedValue([
        { wepp_id: 1, value: 50 },
        { wepp_id: 2, value: 75 },
      ]);

      mockDesired = desiredWithChoropleth("vegetationCover");
      const { result } = renderHook(() => useChoropleth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isActive).toBe(true);
      });

      expect(result.current.choropleth).toBe("vegetationCover");
      expect(result.current.config).toEqual(CHOROPLETH_CONFIG.vegetationCover);
    });

    it("fetches data when choropleth is enabled", async () => {
      mockFetchRapChoropleth.mockResolvedValue([
        { wepp_id: 1, value: 50 },
        { wepp_id: 2, value: 75 },
      ]);

      mockDesired = desiredWithChoropleth("vegetationCover");
      renderHook(() => useChoropleth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockFetchRapChoropleth).toHaveBeenCalledWith({
          runId: "batch;;test-batch;;test-run",
          band: [5, 6],
          year: null,
        });
      });
    });

    it("fetches data with year filter when year is set", async () => {
      mockFetchRapChoropleth.mockResolvedValue([{ wepp_id: 1, value: 50 }]);

      mockDesired = desiredWithChoropleth("vegetationCover", 2020);
      renderHook(() => useChoropleth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockFetchRapChoropleth).toHaveBeenCalledWith({
          runId: "batch;;test-batch;;test-run",
          band: [5, 6],
          year: 2020,
        });
      });
    });

    it("sets error state when fetch fails", async () => {
      mockFetchRapChoropleth.mockRejectedValue(new Error("Network error"));

      mockDesired = desiredWithChoropleth("vegetationCover");
      const { result } = renderHook(() => useChoropleth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.error).toContain("Failed to load data");
      });
    });

    it("sets error when response has no valid data", async () => {
      mockFetchRapChoropleth.mockResolvedValue([]);

      mockDesired = desiredWithChoropleth("vegetationCover");
      const { result } = renderHook(() => useChoropleth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.error).toContain("No valid data available");
      });
    });

    it("filters out non-finite values from data", async () => {
      mockFetchRapChoropleth.mockResolvedValue([
        { wepp_id: 1, value: 50 },
        { wepp_id: 2, value: NaN },
        { wepp_id: 3, value: Infinity },
        { wepp_id: 4, value: 75 },
      ]);

      mockDesired = desiredWithChoropleth("vegetationCover");
      const { result } = renderHook(() => useChoropleth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.getColor(1)).not.toBeNull();
      expect(result.current.getColor(4)).not.toBeNull();
      expect(result.current.getColor(2)).toBeNull();
      expect(result.current.getColor(3)).toBeNull();
    });

    it("clears data when choropleth is disabled", async () => {
      mockFetchRapChoropleth.mockResolvedValue([{ wepp_id: 1, value: 50 }]);

      mockDesired = desiredWithChoropleth("vegetationCover");
      const { result, rerender } = renderHook(() => useChoropleth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isActive).toBe(true);
      });

      mockDesired = JSON.parse(JSON.stringify(INITIAL_DESIRED));
      rerender();

      await waitFor(() => {
        expect(result.current.isActive).toBe(false);
      });
    });
  });

  describe("getColor", () => {
    it("returns null when choropleth is inactive", () => {
      const { result } = renderHook(() => useChoropleth(), {
        wrapper: createWrapper(),
      });
      expect(result.current.getColor(1)).toBeNull();
    });

    it("returns null for undefined id", async () => {
      mockFetchRapChoropleth.mockResolvedValue([{ wepp_id: 1, value: 50 }]);

      mockDesired = desiredWithChoropleth("vegetationCover");
      const { result } = renderHook(() => useChoropleth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.getColor(undefined)).toBeNull();
    });

    it("returns null for unknown id", async () => {
      mockFetchRapChoropleth.mockResolvedValue([{ wepp_id: 1, value: 50 }]);

      mockDesired = desiredWithChoropleth("vegetationCover");
      const { result } = renderHook(() => useChoropleth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.getColor(999)).toBeNull();
    });

    it("returns a color string for known id", async () => {
      mockFetchRapChoropleth.mockResolvedValue([
        { wepp_id: 1, value: 50 },
        { wepp_id: 2, value: 100 },
      ]);

      mockDesired = desiredWithChoropleth("vegetationCover");
      const { result } = renderHook(() => useChoropleth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const color = result.current.getColor(1);
      expect(color).toBeTruthy();
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  describe("getChoroplethStyle", () => {
    it("returns null when choropleth is inactive", () => {
      const { result } = renderHook(() => useChoropleth(), {
        wrapper: createWrapper(),
      });
      expect(result.current.getChoroplethStyle(1)).toBeNull();
    });

    it("returns style object for known id", async () => {
      mockFetchRapChoropleth.mockResolvedValue([
        { wepp_id: 1, value: 50 },
        { wepp_id: 2, value: 100 },
      ]);

      mockDesired = desiredWithChoropleth("vegetationCover");
      const { result } = renderHook(() => useChoropleth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const style = result.current.getChoroplethStyle(1);
      expect(style).not.toBeNull();
      expect(style).toHaveProperty("color", "#2c2c2c");
      expect(style).toHaveProperty("weight", 0.75);
      expect(style).toHaveProperty("fillColor");
      expect(style).toHaveProperty("fillOpacity", 0.85);
    });
  });

  describe("runtime reporting", () => {
    it("reports loading to layer runtime while fetching", async () => {
      mockFetchRapChoropleth.mockResolvedValue([{ wepp_id: 1, value: 50 }]);

      mockDesired = desiredWithChoropleth("vegetationCover");
      renderHook(() => useChoropleth(), {
        wrapper: createWrapper(),
      });

      // Initially loading
      expect(mockSetLayerLoading).toHaveBeenCalledWith("choropleth", true);

      await waitFor(() => {
        expect(mockSetLayerLoading).toHaveBeenCalledWith("choropleth", false);
      });
    });

    it("reports data availability after successful fetch", async () => {
      mockFetchRapChoropleth.mockResolvedValue([
        { wepp_id: 1, value: 50 },
        { wepp_id: 2, value: 75 },
      ]);

      mockDesired = desiredWithChoropleth("vegetationCover");
      renderHook(() => useChoropleth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockSetDataAvailability).toHaveBeenCalledWith(
          "choropleth",
          true,
        );
      });
    });

    it("reports data unavailable when fetch returns empty data", async () => {
      mockFetchRapChoropleth.mockResolvedValue([]);

      mockDesired = desiredWithChoropleth("vegetationCover");
      renderHook(() => useChoropleth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockSetDataAvailability).toHaveBeenCalledWith(
          "choropleth",
          false,
        );
      });
    });

    it("reports data unavailable on fetch error", async () => {
      mockFetchRapChoropleth.mockRejectedValue(new Error("Network error"));

      mockDesired = desiredWithChoropleth("vegetationCover");
      renderHook(() => useChoropleth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockSetDataAvailability).toHaveBeenCalledWith(
          "choropleth",
          false,
        );
      });
    });

    it("does not report availability when choropleth is disabled", () => {
      renderHook(() => useChoropleth(), {
        wrapper: createWrapper(),
      });

      // setLayerLoading is called for loading=false even when inactive
      expect(mockSetDataAvailability).not.toHaveBeenCalledWith(
        "choropleth",
        expect.anything(),
      );
    });
  });
});
