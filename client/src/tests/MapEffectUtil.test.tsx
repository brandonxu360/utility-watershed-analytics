import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { MapEffect, resetSavedMapView } from "../utils/map/MapEffectUtil";
import { WatershedProperties } from "../types/WatershedProperties";

type MoveendHandler = () => void;
let moveendListeners: MoveendHandler[] = [];

const mockMap = {
  flyToBounds: vi.fn(),
  fitBounds: vi.fn(),
  setMaxBounds: vi.fn(),
  getBoundsZoom: vi.fn(() => 12),
  on: vi.fn((event: string, handler: MoveendHandler) => {
    if (event === "moveend") moveendListeners.push(handler);
  }),
  off: vi.fn((event: string, handler: MoveendHandler) => {
    if (event === "moveend")
      moveendListeners = moveendListeners.filter((h) => h !== handler);
  }),
  getCenter: vi.fn(() => ({ lat: 40, lng: -100 })),
  getZoom: vi.fn(() => 10),
};
vi.mock("react-leaflet", () => ({
  useMap: () => mockMap,
}));

const mockZoomToFeature = vi.fn();
vi.mock("../utils/map/MapUtil", () => ({
  zoomToFeature: (...args: unknown[]) => mockZoomToFeature(...args),
}));

const mockBounds = {
  isValid: vi.fn().mockReturnValue(true),
  pad: vi.fn().mockImplementation(() => mockBounds),
  getCenter: vi.fn().mockReturnValue({ lat: 42, lng: -105 }),
};

const mockTempLayer = { getBounds: vi.fn().mockReturnValue(mockBounds) };
const mockGeoJSON = vi.fn().mockReturnValue(mockTempLayer);
vi.mock("leaflet", () => ({
  default: {
    geoJSON: (...args: unknown[]) => mockGeoJSON(...args),
  },
}));

const createWatershedData = (
  features: Array<{
    id: string | number;
    properties?: Partial<WatershedProperties>;
  }>,
): GeoJSON.FeatureCollection<GeoJSON.Geometry, WatershedProperties> => ({
  type: "FeatureCollection",
  features: features.map((f) => ({
    type: "Feature" as const,
    id: f.id,
    geometry: { type: "Polygon" as const, coordinates: [] },
    properties: {
      pws_name: "Test Watershed",
      ...f.properties,
    } as WatershedProperties,
  })),
});

const renderMapEffect = (props: {
  watershedId: string | null;
  watersheds: GeoJSON.FeatureCollection<
    GeoJSON.Geometry,
    WatershedProperties
  > | null;
}) => {
  const { result } = renderHook(() => {
    return MapEffect({
      watershedId: props.watershedId,
      watersheds: props.watersheds as GeoJSON.FeatureCollection<
        GeoJSON.Geometry,
        WatershedProperties
      >,
    });
  });
  return result;
};

describe("MapEffectUtil", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetSavedMapView();
    moveendListeners = [];
  });

  describe("MapEffect component", () => {
    it("returns null", () => {
      const watersheds = createWatershedData([{ id: "ws-1" }]);
      const result = renderMapEffect({ watershedId: "ws-1", watersheds });
      expect(result.current).toBeNull();
    });

    it("does not zoom when watershedId is null", () => {
      const watersheds = createWatershedData([{ id: "ws-1" }]);
      renderMapEffect({ watershedId: null, watersheds });

      expect(mockZoomToFeature).not.toHaveBeenCalled();
    });

    it("does not zoom when watersheds is null", () => {
      renderMapEffect({ watershedId: "ws-1", watersheds: null });

      expect(mockZoomToFeature).not.toHaveBeenCalled();
    });

    it("does not zoom when watersheds.features is not an array", () => {
      const invalidWatersheds = {
        type: "FeatureCollection",
        features: "not-an-array",
      };
      renderMapEffect({
        watershedId: "ws-1",
        watersheds: invalidWatersheds as unknown as GeoJSON.FeatureCollection<
          GeoJSON.Geometry,
          WatershedProperties
        >,
      });

      expect(mockZoomToFeature).not.toHaveBeenCalled();
    });

    it("does not zoom when no matching feature is found", () => {
      const watersheds = createWatershedData([{ id: "ws-1" }, { id: "ws-2" }]);
      renderMapEffect({ watershedId: "ws-999", watersheds });

      expect(mockZoomToFeature).not.toHaveBeenCalled();
    });

    it("zooms to matching feature instantly on first render (no flyToBounds)", () => {
      const watersheds = createWatershedData([{ id: "ws-1" }, { id: "ws-2" }]);
      renderMapEffect({ watershedId: "ws-2", watersheds });

      expect(mockGeoJSON).toHaveBeenCalledWith(
        expect.objectContaining({ id: "ws-2" }),
      );
      // First-ever render: fitBounds (instant) not zoomToFeature (animated)
      expect(mockZoomToFeature).not.toHaveBeenCalled();
      expect(mockMap.fitBounds).toHaveBeenCalledWith(mockBounds, {
        maxZoom: 16,
      });
    });

    it("matches feature id as string when id is numeric", () => {
      const watersheds = createWatershedData([{ id: 123 }]);
      renderMapEffect({ watershedId: "123", watersheds });

      // First render uses instant fitBounds
      expect(mockMap.fitBounds).toHaveBeenCalledWith(mockBounds, {
        maxZoom: 16,
      });
    });

    it("does not match feature when feature.id is undefined", () => {
      const watersheds: GeoJSON.FeatureCollection<
        GeoJSON.Geometry,
        WatershedProperties
      > = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            id: undefined,
            geometry: { type: "Polygon", coordinates: [] },
            properties: { pws_name: "Test" } as WatershedProperties,
          },
        ],
      };
      renderMapEffect({ watershedId: "ws-1", watersheds });

      expect(mockZoomToFeature).not.toHaveBeenCalled();
    });

    it("handles empty features array", () => {
      const watersheds = createWatershedData([]);
      renderMapEffect({ watershedId: "ws-1", watersheds });

      expect(mockZoomToFeature).not.toHaveBeenCalled();
    });

    it("fits and locks bounds to all watersheds on initial load", () => {
      const watersheds = createWatershedData([{ id: "ws-1" }, { id: "ws-2" }]);

      renderMapEffect({ watershedId: null, watersheds });

      expect(mockGeoJSON).toHaveBeenCalledWith(watersheds);
      expect(mockTempLayer.getBounds).toHaveBeenCalled();
      expect(mockBounds.isValid).toHaveBeenCalled();
      expect(mockMap.fitBounds).toHaveBeenCalledWith(mockBounds, {
        padding: [30, 30],
      });
      expect(mockBounds.pad).toHaveBeenCalledWith(0.5);
      expect(mockMap.setMaxBounds).toHaveBeenCalledWith(mockBounds);
    });

    it("does not re-run initial fit on subsequent renders", () => {
      const watersheds = createWatershedData([{ id: "ws-1" }]);

      const { rerender } = renderHook(
        (props: {
          watershedId: string | null;
          watersheds: GeoJSON.FeatureCollection<
            GeoJSON.Geometry,
            WatershedProperties
          >;
        }) => MapEffect(props),
        {
          initialProps: {
            watershedId: null,
            watersheds,
          },
        },
      );

      expect(mockMap.fitBounds).toHaveBeenCalledTimes(1);
      expect(mockMap.setMaxBounds).toHaveBeenCalledTimes(1);

      rerender({ watershedId: null, watersheds });

      expect(mockMap.fitBounds).toHaveBeenCalledTimes(1);
      expect(mockMap.setMaxBounds).toHaveBeenCalledTimes(1);
    });

    it("animates to watershed on subsequent selection (not first render)", () => {
      const watersheds = createWatershedData([{ id: "ws-1" }, { id: "ws-2" }]);

      const { rerender } = renderHook(
        (props: {
          watershedId: string | null;
          watersheds: GeoJSON.FeatureCollection<
            GeoJSON.Geometry,
            WatershedProperties
          >;
        }) => MapEffect(props),
        {
          initialProps: {
            watershedId: null,
            watersheds,
          },
        },
      );

      // Initial fit happened
      expect(mockMap.fitBounds).toHaveBeenCalledTimes(1);

      // Now select a watershed
      rerender({ watershedId: "ws-2", watersheds });

      // Should animate via zoomToFeature (hasPositioned is true within this mount)
      expect(mockZoomToFeature).toHaveBeenCalledWith(mockMap, mockTempLayer);
    });

    it("animates to watershed after remount when savedCenter exists", () => {
      const watersheds = createWatershedData([{ id: "ws-1" }, { id: "ws-2" }]);

      // First mount — initial fit
      const { unmount } = renderHook(
        (props: {
          watershedId: string | null;
          watersheds: GeoJSON.FeatureCollection<
            GeoJSON.Geometry,
            WatershedProperties
          >;
        }) => MapEffect(props),
        { initialProps: { watershedId: null, watersheds } },
      );

      // Simulate user interaction that triggers moveend (saves position)
      moveendListeners.forEach((fn) => fn());
      unmount();

      vi.clearAllMocks();

      // Second mount — navigated to a watershed
      renderMapEffect({ watershedId: "ws-1", watersheds });

      // Should animate (savedCenter exists) instead of instant fitBounds
      expect(mockZoomToFeature).toHaveBeenCalledWith(mockMap, mockTempLayer);
      expect(mockMap.fitBounds).not.toHaveBeenCalled();
    });

    it("does not re-zoom on back navigation (watershed to home)", () => {
      const watersheds = createWatershedData([{ id: "ws-1" }, { id: "ws-2" }]);

      const { rerender } = renderHook(
        (props: {
          watershedId: string | null;
          watersheds: GeoJSON.FeatureCollection<
            GeoJSON.Geometry,
            WatershedProperties
          >;
        }) => MapEffect(props),
        {
          initialProps: {
            watershedId: null,
            watersheds,
          },
        },
      );

      // Initial fit
      expect(mockMap.fitBounds).toHaveBeenCalledTimes(1);

      // Select a watershed
      rerender({ watershedId: "ws-1", watersheds });

      // Navigate back — should NOT re-fit to all watersheds
      vi.clearAllMocks();
      rerender({ watershedId: null, watersheds });

      expect(mockMap.fitBounds).not.toHaveBeenCalled();
      expect(mockZoomToFeature).not.toHaveBeenCalled();
    });

    it("does not re-zoom on back navigation after remount", () => {
      const watersheds = createWatershedData([{ id: "ws-1" }, { id: "ws-2" }]);

      // First mount with a watershed selected
      const { unmount } = renderHook(
        (props: {
          watershedId: string | null;
          watersheds: GeoJSON.FeatureCollection<
            GeoJSON.Geometry,
            WatershedProperties
          >;
        }) => MapEffect(props),
        { initialProps: { watershedId: "ws-1", watersheds } },
      );

      // Simulate moveend to save position
      moveendListeners.forEach((fn) => fn());
      unmount();

      vi.clearAllMocks();

      // Remount at home (back-nav) — should stay put
      renderMapEffect({ watershedId: null, watersheds });

      expect(mockMap.fitBounds).not.toHaveBeenCalled();
      expect(mockZoomToFeature).not.toHaveBeenCalled();
    });
  });
});
