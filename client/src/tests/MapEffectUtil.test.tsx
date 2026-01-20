import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { MapEffect } from "../utils/map/MapEffectUtil";
import { WatershedProperties } from "../types/WatershedProperties";

const mockMap = { flyToBounds: vi.fn() };
vi.mock("react-leaflet", () => ({
    useMap: () => mockMap,
}));

const mockZoomToFeature = vi.fn();
vi.mock("../utils/map/MapUtil", () => ({
    zoomToFeature: (...args: unknown[]) => mockZoomToFeature(...args),
}));

const mockTempLayer = { getBounds: vi.fn() };
const mockGeoJSON = vi.fn((_feature: unknown) => mockTempLayer);
vi.mock("leaflet", () => ({
    default: {
        geoJSON: (feature: unknown) => mockGeoJSON(feature),
    },
}));

const mockResetOverlays = vi.fn();
vi.mock("../store/store", () => ({
    useAppStore: () => ({
        resetOverlays: mockResetOverlays,
    }),
}));

const createWatershedData = (
    features: Array<{ id: string | number; properties?: Partial<WatershedProperties> }>
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
    watersheds: GeoJSON.FeatureCollection<GeoJSON.Geometry, WatershedProperties> | null;
}) => {
    const { result } = renderHook(() => {
        return MapEffect({
            watershedId: props.watershedId,
            watersheds: props.watersheds as GeoJSON.FeatureCollection<GeoJSON.Geometry, WatershedProperties>,
        });
    });
    return result;
};

describe("MapEffectUtil", () => {
    beforeEach(() => {
        vi.clearAllMocks();
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

            expect(mockResetOverlays).not.toHaveBeenCalled();
            expect(mockZoomToFeature).not.toHaveBeenCalled();
        });

        it("does not zoom when watersheds is null", () => {
            renderMapEffect({ watershedId: "ws-1", watersheds: null });

            expect(mockResetOverlays).not.toHaveBeenCalled();
            expect(mockZoomToFeature).not.toHaveBeenCalled();
        });

        it("does not zoom when watersheds.features is not an array", () => {
            const invalidWatersheds = { type: "FeatureCollection", features: "not-an-array" };
            renderMapEffect({
                watershedId: "ws-1",
                watersheds: invalidWatersheds as unknown as GeoJSON.FeatureCollection<GeoJSON.Geometry, WatershedProperties>,
            });

            expect(mockResetOverlays).not.toHaveBeenCalled();
            expect(mockZoomToFeature).not.toHaveBeenCalled();
        });

        it("does not zoom when no matching feature is found", () => {
            const watersheds = createWatershedData([
                { id: "ws-1" },
                { id: "ws-2" },
            ]);
            renderMapEffect({ watershedId: "ws-999", watersheds });

            expect(mockResetOverlays).not.toHaveBeenCalled();
            expect(mockZoomToFeature).not.toHaveBeenCalled();
        });

        it("zooms to matching feature when found", () => {
            const watersheds = createWatershedData([
                { id: "ws-1" },
                { id: "ws-2" },
            ]);
            renderMapEffect({ watershedId: "ws-2", watersheds });

            expect(mockResetOverlays).toHaveBeenCalledTimes(1);
            expect(mockGeoJSON).toHaveBeenCalledWith(
                expect.objectContaining({ id: "ws-2" })
            );
            expect(mockZoomToFeature).toHaveBeenCalledWith(mockMap, mockTempLayer);
        });

        it("matches feature id as string when id is numeric", () => {
            const watersheds = createWatershedData([{ id: 123 }]);
            renderMapEffect({ watershedId: "123", watersheds });

            expect(mockResetOverlays).toHaveBeenCalledTimes(1);
            expect(mockZoomToFeature).toHaveBeenCalled();
        });

        it("does not match feature when feature.id is undefined", () => {
            const watersheds: GeoJSON.FeatureCollection<GeoJSON.Geometry, WatershedProperties> = {
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

            expect(mockResetOverlays).not.toHaveBeenCalled();
            expect(mockZoomToFeature).not.toHaveBeenCalled();
        });

        it("handles empty features array", () => {
            const watersheds = createWatershedData([]);
            renderMapEffect({ watershedId: "ws-1", watersheds });

            expect(mockResetOverlays).not.toHaveBeenCalled();
            expect(mockZoomToFeature).not.toHaveBeenCalled();
        });
    });
});
