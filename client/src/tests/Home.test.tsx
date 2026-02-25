import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAppStore } from "../store/store";
import Home from "../pages/Home";

const mockNavigate = vi.fn();

const { mockUseParams } = vi.hoisted(() => ({
  mockUseParams: vi.fn(),
}));

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal();
  return Object.assign({}, actual, {
    useParams: () => mockUseParams(),
    useNavigate: () => mockNavigate,
  });
});

vi.mock("../components/map/WatershedMap", () => ({
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
      activeDataLayer: "none",
    });
    mockUseParams.mockReset();
    mockNavigate.mockReset();
  });

  describe("rendering", () => {
    it("renders without crashing", () => {
      mockUseParams.mockReturnValue(null);
      render(<Home />);
    });

    it("renders the map placeholder", () => {
      mockUseParams.mockReturnValue(null);
      render(<Home />);
      expect(screen.getByRole("region", { name: /map/i })).toBeInTheDocument();
    });

    it("shows the home info panel when no watershed ID is in the route", () => {
      mockUseParams.mockReturnValue(null);
      render(<Home />);
      expect(
        screen.getByText("Explore Watershed Analytics"),
      ).toBeInTheDocument();
    });

    it("covers watershedID nullish branch when match exists but watershedID is missing", () => {
      mockUseParams.mockReturnValue(undefined);
      render(<Home />);
      expect(
        screen.getByText("Explore Watershed Analytics"),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("region", { name: /watershed overview/i }),
      ).not.toBeInTheDocument();
    });

    it("shows the watershed overview panel when a watershed ID is in the route", () => {
      mockUseParams.mockReturnValue("test-watershed-123");
      render(<Home />);
      expect(
        screen.getByRole("region", { name: /watershed overview/i }),
      ).toBeInTheDocument();
      expect(
        screen.queryByText("Explore Watershed Analytics"),
      ).not.toBeInTheDocument();
    });

    it("does not render BottomPanel when activeDataLayer is not vegetationCover", () => {
      mockUseParams.mockReturnValue(null);
      useAppStore.setState({ activeDataLayer: "none" });
      render(<Home />);
      expect(
        screen.queryByRole("complementary", { name: /bottom panel/i }),
      ).not.toBeInTheDocument();
    });

    it("renders BottomPanel when activeDataLayer is vegetationCover", () => {
      mockUseParams.mockReturnValue(null);
      useAppStore.setState({
        activeDataLayer: "vegetationCover",
      });
      render(<Home />);
      expect(
        screen.getByRole("complementary", { name: /bottom panel/i }),
      ).toBeInTheDocument();
    });

    it("shows the small-screen notice when width < 768px", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).innerWidth = 500;
      render(<Home />);
      const notice = await screen.findByText(/Best viewed on larger screens/i);
      expect(notice).toBeInTheDocument();
    });
  });
});
