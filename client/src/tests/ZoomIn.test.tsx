import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ZoomInControl from "../components/map/controls/ZoomIn/ZoomIn";

const mockZoomIn = vi.fn();

vi.mock("react-leaflet", async (importOriginal) => {
    const actual = await importOriginal<typeof import("react-leaflet")>();
    return Object.assign({}, actual, {
        useMap: () => ({ zoomIn: mockZoomIn }),
    });
});

describe("Zoom In Component Tests", () => {
    beforeEach(() => {
        mockZoomIn.mockClear();
    });

    describe("rendering", () => {
        it("renders without crashing", () => {
            render(<ZoomInControl />);
        });

        it("renders a zoom in button", () => {
            render(<ZoomInControl />);
            expect(screen.getByRole("button", { name: /zoom in/i })).toBeInTheDocument();
        });

        it("calls map.zoomIn when clicked", () => {
            render(<ZoomInControl />);
            fireEvent.click(screen.getByRole("button", { name: /zoom in/i }));
            expect(mockZoomIn).toHaveBeenCalledTimes(1);
        });
    });
});