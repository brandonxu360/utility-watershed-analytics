import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ZoomInControl from "../components/map/controls/ZoomIn";
import ZoomOutControl from "../components/map/controls/ZoomOut";

const mockZoomIn = vi.fn();
const mockZoomOut = vi.fn();

vi.mock("react-leaflet", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-leaflet")>();
  return Object.assign({}, actual, {
    useMap: () => ({ zoomIn: mockZoomIn, zoomOut: mockZoomOut }),
  });
});

describe("Zoom Controls Component Tests", () => {
  beforeEach(() => {
    mockZoomIn.mockClear();
    mockZoomOut.mockClear();
  });

  describe("Zoom In Component Tests", () => {
    describe("rendering", () => {
      it("renders without crashing", () => {
        render(<ZoomInControl />);
      });

      it("renders a zoom in button", () => {
        render(<ZoomInControl />);
        expect(
          screen.getByRole("button", { name: /zoom in/i }),
        ).toBeInTheDocument();
      });

      it("calls map.zoomIn when clicked", () => {
        render(<ZoomInControl />);
        fireEvent.click(screen.getByRole("button", { name: /zoom in/i }));
        expect(mockZoomIn).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("Zoom Out Component Tests", () => {
    describe("rendering", () => {
      it("renders without crashing", () => {
        render(<ZoomOutControl />);
      });

      it("renders a zoom out button", () => {
        render(<ZoomOutControl />);
        expect(
          screen.getByRole("button", { name: /zoom out/i }),
        ).toBeInTheDocument();
      });

      it("calls map.zoomOut when clicked", () => {
        render(<ZoomOutControl />);
        fireEvent.click(screen.getByRole("button", { name: /zoom out/i }));
        expect(mockZoomOut).toHaveBeenCalledTimes(1);
      });
    });
  });
});
