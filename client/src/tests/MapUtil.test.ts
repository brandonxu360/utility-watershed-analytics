import { describe, it, expect, vi, beforeEach } from "vitest";
import { zoomToFeature } from "../utils/map/MapUtil";
import type { Map as LeafletMap } from "leaflet";

describe("MapUtil", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("zoomToFeature", () => {
        it("calls flyToBounds with correct bounds and maxZoom when bounds exist", () => {
            const mockBounds = { lat: 45, lng: -120 };
            const mockFlyToBounds = vi.fn();
            const mockMap = {
                flyToBounds: mockFlyToBounds,
            } as unknown as LeafletMap;

            const mockLayer = {
                getBounds: vi.fn(() => mockBounds),
            };

            zoomToFeature(mockMap, mockLayer as unknown as L.Layer);

            expect(mockLayer.getBounds).toHaveBeenCalledTimes(1);
            expect(mockFlyToBounds).toHaveBeenCalledTimes(1);
            expect(mockFlyToBounds).toHaveBeenCalledWith(mockBounds, {
                maxZoom: 16,
            });
        });

        it("does not call flyToBounds when bounds is undefined", () => {
            const mockFlyToBounds = vi.fn();
            const mockMap = {
                flyToBounds: mockFlyToBounds,
            } as unknown as LeafletMap;

            const mockLayer = {
                getBounds: vi.fn(() => undefined),
            };

            zoomToFeature(mockMap, mockLayer as unknown as L.Layer);

            expect(mockLayer.getBounds).toHaveBeenCalledTimes(1);
            expect(mockFlyToBounds).not.toHaveBeenCalled();
        });

        it("does not call flyToBounds when bounds is null", () => {
            const mockFlyToBounds = vi.fn();
            const mockMap = {
                flyToBounds: mockFlyToBounds,
            } as unknown as LeafletMap;

            const mockLayer = {
                getBounds: vi.fn(() => null),
            };

            zoomToFeature(mockMap, mockLayer as unknown as L.Layer);

            expect(mockFlyToBounds).not.toHaveBeenCalled();
        });

        it("does not crash when getBounds does not exist on layer", () => {
            const mockFlyToBounds = vi.fn();
            const mockMap = {
                flyToBounds: mockFlyToBounds,
            } as unknown as LeafletMap;

            const mockLayer = {};

            // Should not throw
            expect(() => {
                zoomToFeature(mockMap, mockLayer as unknown as L.Layer);
            }).not.toThrow();

            expect(mockFlyToBounds).not.toHaveBeenCalled();
        });

        it("handles valid LatLngBounds object", () => {
            const mockBounds = {
                getNorthEast: () => ({ lat: 46, lng: -119 }),
                getSouthWest: () => ({ lat: 44, lng: -121 }),
            };
            const mockFlyToBounds = vi.fn();
            const mockMap = {
                flyToBounds: mockFlyToBounds,
            } as unknown as LeafletMap;

            const mockLayer = {
                getBounds: vi.fn(() => mockBounds),
            };

            zoomToFeature(mockMap, mockLayer as unknown as L.Layer);

            expect(mockFlyToBounds).toHaveBeenCalledWith(mockBounds, {
                maxZoom: 16,
            });
        });
    });
});
