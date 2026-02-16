import { render, screen } from "@testing-library/react";
import { RouterProvider } from "@tanstack/react-router";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAppStore } from "../store/store";
import { router } from "../routes/router";
import Home from "../pages/Home";

const mockNavigate = vi.fn();

const { mockUseMatch } = vi.hoisted(() => ({
  mockUseMatch: vi.fn(),
}));

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal();
  return Object.assign({}, actual, {
    useMatch: () => mockUseMatch(),
    useNavigate: () => mockNavigate,
  });
});

vi.mock("../components/map/Map", () => ({
  default: () => <div role="region" aria-label="Map" />,
}));

vi.mock("../components/side-panels/WatershedOverview", () => ({
  default: () => <div role="region" aria-label="Watershed overview" />,
}));

vi.mock("../components/bottom-panels/BottomPanel", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <aside aria-label="Bottom panel">{children}</aside>
  ),
}));

describe("Home Component Tests", () => {
  beforeEach(() => {
    useAppStore.setState({
      isPanelOpen: false,
      panelContent: null,
    });
    mockUseMatch.mockReset();
    mockNavigate.mockReset();
  });

  describe("rendering", () => {
    it("renders without crashing", () => {
      mockUseMatch.mockReturnValue(null);
      render(<Home />);
    });

    it("renders the map placeholder", () => {
      mockUseMatch.mockReturnValue(null);
      render(<Home />);
      expect(screen.getByRole("region", { name: /map/i })).toBeInTheDocument();
    });

    it("shows the home info panel when no watershed ID is in the route", () => {
      mockUseMatch.mockReturnValue(null);
      render(<Home />);
      expect(
        screen.getByText("Explore Watershed Analytics"),
      ).toBeInTheDocument();
    });

    it("covers watershedID nullish branch when match exists but webcloudRunId is missing", () => {
      mockUseMatch.mockReturnValue({ params: {} });
      render(<Home />);
      expect(
        screen.getByText("Explore Watershed Analytics"),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("region", { name: /watershed overview/i }),
      ).not.toBeInTheDocument();
    });

    it("shows the watershed overview panel when a watershed ID is in the route", () => {
      mockUseMatch.mockReturnValue({
        params: { webcloudRunId: "test-watershed-123" },
      });
      render(<Home />);
      expect(
        screen.getByRole("region", { name: /watershed overview/i }),
      ).toBeInTheDocument();
      expect(
        screen.queryByText("Explore Watershed Analytics"),
      ).not.toBeInTheDocument();
    });

    it("does not render BottomPanel when isPanelOpen is false", () => {
      mockUseMatch.mockReturnValue(null);
      useAppStore.setState({ isPanelOpen: false, panelContent: "Hello" });
      render(<Home />);
      expect(
        screen.queryByRole("complementary", { name: /bottom panel/i }),
      ).not.toBeInTheDocument();
    });

    it("renders BottomPanel with panelContent when isPanelOpen is true", () => {
      mockUseMatch.mockReturnValue(null);
      useAppStore.setState({
        isPanelOpen: true,
        panelContent: "Test Panel Content",
      });
      render(<Home />);
      expect(
        screen.getByRole("complementary", { name: /bottom panel/i }),
      ).toBeInTheDocument();
      expect(screen.getByText("Test Panel Content")).toBeInTheDocument();
    });

    it("shows the small-screen notice when width < 768px", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).innerWidth = 500;
      render(<RouterProvider router={router} />);
      expect(
        screen.getByText(/Best viewed on larger screens/i),
      ).toBeInTheDocument();
    });
  });
});
