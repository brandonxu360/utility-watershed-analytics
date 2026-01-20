import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { VegetationCover } from "../components/bottom-panels/VegetationCover";
import { SubcatchmentProperties } from "../types/SubcatchmentProperties";
import { useAppStore } from "../store/store";

const mockUseMatch = vi.fn(() => ({ params: { webcloudRunId: "or,wa-108" } }));

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal();
  return Object.assign({}, actual, {
    useMatch: () => mockUseMatch(),
  });
});

const { mockFetchRap } = vi.hoisted(() => ({
  mockFetchRap: vi.fn().mockImplementation(() =>
    Promise.resolve([
      { year: 1986, shrub: 10, tree: 20, coverage: 30 },
      { year: 1987, shrub: 15, tree: 25, coverage: 40 },
      { year: 2020, shrub: 30, tree: 40, coverage: 70 },
    ])
  ),
}));

vi.mock("../api/rapApi", () => ({
  default: mockFetchRap,
  fetchRap: mockFetchRap,
}));

const mockUseChoropleth = vi.fn(() => ({
  config: null,
}));

vi.mock("../hooks/useChoropleth", () => ({
  useChoropleth: () => mockUseChoropleth(),
}));

vi.mock("../components/ChoroplethScale", () => ({
  ChoroplethScale: ({ colormap, range, unit }: { colormap: string; range: { min: number; max: number }; unit: string }) => (
    <div data-testid="choropleth-scale">
      {colormap} {range.min}-{range.max} {unit}
    </div>
  ),
}));

vi.mock("../components/coverage-line-chart/CoverageLineChart", () => ({
  CoverageLineChart: ({ data, title, lineKeys }: { data: unknown[]; title: string; lineKeys: unknown[] }) => (
    <div data-testid="coverage-chart">
      {title}
      <span data-testid="chart-data-length">{data.length}</span>
      <span data-testid="line-keys-length">{lineKeys.length}</span>
    </div>
  ),
}));

vi.mock("react-icons/fa6", () => ({
  FaXmark: ({ className, onClick }: { className?: string; onClick?: () => void }) => (
    <span data-testid="close-icon" className={className} onClick={onClick}>X</span>
  ),
  FaChevronDown: () => <span data-testid="chevron-down">▼</span>,
}));

const mockClose = vi.fn();
const mockClearSelectedHillslope = vi.fn();
const mockSetSubcatchment = vi.fn();
const mockResetChoropleth = vi.fn();
const mockSetChoroplethYear = vi.fn();
const mockSetChoroplethBands = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  mockFetchRap.mockImplementation(() =>
    Promise.resolve([
      { year: 1986, shrub: 10, tree: 20, coverage: 30 },
      { year: 1987, shrub: 15, tree: 25, coverage: 40 },
      { year: 2020, shrub: 30, tree: 40, coverage: 70 },
    ])
  );
  mockUseMatch.mockReturnValue({ params: { webcloudRunId: "or,wa-108" } });
  mockUseChoropleth.mockReturnValue({ config: null });

  useAppStore.setState({
    closePanel: mockClose,
    clearSelectedHillslope: mockClearSelectedHillslope,
    setSubcatchment: mockSetSubcatchment,
    resetChoropleth: mockResetChoropleth,
    setChoroplethYear: mockSetChoroplethYear,
    setChoroplethBands: mockSetChoroplethBands,
    selectedHillslopeId: null,
    selectedHillslopeProps: null,
    choropleth: {
      type: "vegetationCover",
      year: null,
      bands: "all",
      range: null,
      loading: false,
      data: null,
      error: null,
    },
  });
});

afterEach(async () => {
  await act(async () => {
    useAppStore.setState({
      selectedHillslopeId: null,
      selectedHillslopeProps: null,
    });
  });
});

describe("VegetationCover", () => {
  describe("rendering", () => {
    it("renders controls and chart with default values", async () => {
      await act(async () => {
        render(<VegetationCover />);
      });

      expect(screen.getByLabelText("Vegetation Cover:")).toBeInTheDocument();
      expect(screen.getByLabelText("Select Year:")).toBeInTheDocument();

      await waitFor(() => {
        expect(mockFetchRap).toHaveBeenCalled();
      });

      const chart = screen.getByTestId("coverage-chart");
      expect(chart).toBeInTheDocument();
      expect(chart).toHaveTextContent("All Coverage (All)");
    });

    it("renders with initial choropleth year from store", async () => {
      useAppStore.setState({
        choropleth: {
          type: "vegetationCover",
          year: 2020,
          bands: "all",
          range: null,
          loading: false,
          data: null,
          error: null,
        },
      });

      await act(async () => {
        render(<VegetationCover />);
      });

      await waitFor(() => {
        expect(mockFetchRap).toHaveBeenCalled();
      });

      const chart = screen.getByTestId("coverage-chart");
      expect(chart).toHaveTextContent("All Coverage (2020)");
    });

    it("renders with initial shrub band from store", async () => {
      useAppStore.setState({
        choropleth: {
          type: "vegetationCover",
          year: null,
          bands: "shrub",
          range: null,
          loading: false,
          data: null,
          error: null,
        },
      });

      await act(async () => {
        render(<VegetationCover />);
      });

      await waitFor(() => {
        expect(mockFetchRap).toHaveBeenCalled();
      });

      const chart = screen.getByTestId("coverage-chart");
      expect(chart).toHaveTextContent("Shrub Coverage (All)");
      expect(screen.getByTestId("line-keys-length")).toHaveTextContent("1");
    });

    it("renders with initial tree band from store", async () => {
      useAppStore.setState({
        choropleth: {
          type: "vegetationCover",
          year: null,
          bands: "tree",
          range: null,
          loading: false,
          data: null,
          error: null,
        },
      });

      await act(async () => {
        render(<VegetationCover />);
      });

      await waitFor(() => {
        expect(mockFetchRap).toHaveBeenCalled();
      });

      const chart = screen.getByTestId("coverage-chart");
      expect(chart).toHaveTextContent("Tree Coverage (All)");
      expect(screen.getByTestId("line-keys-length")).toHaveTextContent("1");
    });

    it("shows loading state while fetching data", async () => {
      let resolvePromise: (value: unknown) => void;
      mockFetchRap.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve;
          })
      );

      await act(async () => {
        render(<VegetationCover />);
      });

      expect(screen.getByText("Loading vegetation data…")).toBeInTheDocument();

      await act(async () => {
        resolvePromise!([{ year: 1986, shrub: 10, tree: 20, coverage: 30 }]);
      });

      await waitFor(() => {
        expect(screen.queryByText("Loading vegetation data…")).not.toBeInTheDocument();
      });
    });

    it("renders ChoroplethScale when config and range are available", async () => {
      mockUseChoropleth.mockReturnValue({
        config: { colormap: "viridis", unit: "% cover" },
      } as unknown as ReturnType<typeof mockUseChoropleth>);

      useAppStore.setState({
        choropleth: {
          type: "vegetationCover",
          year: null,
          bands: "all",
          range: { min: 0, max: 100 },
          loading: false,
          data: null,
          error: null,
        },
      });

      await act(async () => {
        render(<VegetationCover />);
      });

      await waitFor(() => {
        expect(mockFetchRap).toHaveBeenCalled();
      });

      expect(screen.getByTestId("choropleth-scale")).toBeInTheDocument();
      expect(screen.getByTestId("choropleth-scale")).toHaveTextContent("viridis 0-100 % cover");
    });

    it("does not render ChoroplethScale when loading", async () => {
      mockUseChoropleth.mockReturnValue({
        config: { colormap: "viridis", unit: "% cover" },
      } as unknown as ReturnType<typeof mockUseChoropleth>);

      useAppStore.setState({
        choropleth: {
          type: "vegetationCover",
          year: null,
          bands: "all",
          range: { min: 0, max: 100 },
          loading: true,
          data: null,
          error: null,
        },
      });

      await act(async () => {
        render(<VegetationCover />);
      });

      expect(screen.queryByTestId("choropleth-scale")).not.toBeInTheDocument();
    });

    it("does not render ChoroplethScale when range is null", async () => {
      mockUseChoropleth.mockReturnValue({
        config: { colormap: "viridis", unit: "% cover" },
      } as unknown as ReturnType<typeof mockUseChoropleth>);

      await act(async () => {
        render(<VegetationCover />);
      });

      await waitFor(() => {
        expect(mockFetchRap).toHaveBeenCalled();
      });

      expect(screen.queryByTestId("choropleth-scale")).not.toBeInTheDocument();
    });

    it("does not render ChoroplethScale when config is null", async () => {
      useAppStore.setState({
        choropleth: {
          type: "vegetationCover",
          year: null,
          bands: "all",
          range: { min: 0, max: 100 },
          loading: false,
          data: null,
          error: null,
        },
      });

      await act(async () => {
        render(<VegetationCover />);
      });

      await waitFor(() => {
        expect(mockFetchRap).toHaveBeenCalled();
      });

      expect(screen.queryByTestId("choropleth-scale")).not.toBeInTheDocument();
    });
  });

  describe("close button interactions", () => {
    it("calls all cleanup functions when close button is clicked", async () => {
      await act(async () => {
        render(<VegetationCover />);
      });

      await waitFor(() => {
        expect(mockFetchRap).toHaveBeenCalled();
      });

      const closeButton = document.querySelector(".vegCloseButton");
      expect(closeButton).toBeTruthy();

      await act(async () => {
        fireEvent.click(closeButton!);
      });

      expect(mockClearSelectedHillslope).toHaveBeenCalled();
      expect(mockSetSubcatchment).toHaveBeenCalledWith(false);
      expect(mockResetChoropleth).toHaveBeenCalled();
      expect(mockClose).toHaveBeenCalled();
    });
  });

  describe("vegetation option changes", () => {
    it("changes to Shrub option and updates store", async () => {
      await act(async () => {
        render(<VegetationCover />);
      });

      await waitFor(() => {
        expect(mockFetchRap).toHaveBeenCalled();
      });

      const chart = screen.getByTestId("coverage-chart");
      expect(chart).toHaveTextContent("All Coverage");

      await act(async () => {
        const selectButton = screen.getByTestId("select-veg-cover-title");
        fireEvent.click(selectButton);
      });

      await act(async () => {
        const shrubOption = screen.getByRole("option", { name: "Shrub" });
        fireEvent.click(shrubOption);
      });

      await waitFor(() => {
        expect(chart).toHaveTextContent("Shrub Coverage");
      });

      expect(mockSetChoroplethBands).toHaveBeenCalledWith("shrub");
    });

    it("changes to Tree option and updates store", async () => {
      await act(async () => {
        render(<VegetationCover />);
      });

      await waitFor(() => {
        expect(mockFetchRap).toHaveBeenCalled();
      });

      await act(async () => {
        const selectButton = screen.getByTestId("select-veg-cover-title");
        fireEvent.click(selectButton);
      });

      await act(async () => {
        const treeOption = screen.getByRole("option", { name: "Tree" });
        fireEvent.click(treeOption);
      });

      await waitFor(() => {
        expect(screen.getByTestId("coverage-chart")).toHaveTextContent("Tree Coverage");
      });

      expect(mockSetChoroplethBands).toHaveBeenCalledWith("tree");
    });

    it("changes back to All option and updates store", async () => {
      useAppStore.setState({
        choropleth: {
          type: "vegetationCover",
          year: null,
          bands: "tree",
          range: null,
          loading: false,
          data: null,
          error: null,
        },
      });

      await act(async () => {
        render(<VegetationCover />);
      });

      await waitFor(() => {
        expect(mockFetchRap).toHaveBeenCalled();
      });

      await act(async () => {
        const selectButton = screen.getByTestId("select-veg-cover-title");
        fireEvent.click(selectButton);
      });

      await act(async () => {
        const allOption = screen.getByRole("option", { name: "All" });
        fireEvent.click(allOption);
      });

      await waitFor(() => {
        expect(screen.getByTestId("coverage-chart")).toHaveTextContent("All Coverage");
      });

      expect(mockSetChoroplethBands).toHaveBeenCalledWith("all");
    });
  });

  describe("year selection changes", () => {
    it("changes to specific year and updates store", async () => {
      await act(async () => {
        render(<VegetationCover />);
      });

      await waitFor(() => {
        expect(mockFetchRap).toHaveBeenCalled();
      });

      await act(async () => {
        const yearSelect = screen.getByTestId("select-veg-year");
        fireEvent.click(yearSelect);
      });

      await act(async () => {
        const year2020 = screen.getByRole("option", { name: "2020" });
        fireEvent.click(year2020);
      });

      await waitFor(() => {
        expect(screen.getByTestId("coverage-chart")).toHaveTextContent("(2020)");
      });

      expect(mockSetChoroplethYear).toHaveBeenCalledWith(2020);
    });

    it("changes back to All years and updates store with null", async () => {
      useAppStore.setState({
        choropleth: {
          type: "vegetationCover",
          year: 2020,
          bands: "all",
          range: null,
          loading: false,
          data: null,
          error: null,
        },
      });

      await act(async () => {
        render(<VegetationCover />);
      });

      await waitFor(() => {
        expect(mockFetchRap).toHaveBeenCalled();
      });

      await act(async () => {
        const yearSelect = screen.getByTestId("select-veg-year");
        fireEvent.click(yearSelect);
      });

      await act(async () => {
        const allOption = screen.getByRole("option", { name: "All" });
        fireEvent.click(allOption);
      });

      await waitFor(() => {
        expect(screen.getByTestId("coverage-chart")).toHaveTextContent("(All)");
      });

      expect(mockSetChoroplethYear).toHaveBeenCalledWith(null);
    });
  });

  describe("hillslope selection", () => {
    it("shows selected hillslope in chart title", async () => {
      useAppStore.setState({
        selectedHillslopeId: 42,
        selectedHillslopeProps: {} as SubcatchmentProperties,
      });

      await act(async () => {
        render(<VegetationCover />);
      });

      await waitFor(() => {
        expect(mockFetchRap).toHaveBeenCalled();
      });

      const chart = screen.getByTestId("coverage-chart");
      expect(chart).toHaveTextContent("All Coverage - Hillslope 42 (All)");
    });

    it("fetches hillslope-specific data when hillslope is selected", async () => {
      useAppStore.setState({
        selectedHillslopeId: 123,
        selectedHillslopeProps: {} as SubcatchmentProperties,
      });

      await act(async () => {
        render(<VegetationCover />);
      });

      await waitFor(() => {
        expect(mockFetchRap).toHaveBeenCalledWith(
          expect.objectContaining({
            mode: "hillslope",
            topazId: 123,
          })
        );
      });
    });

    it("fetches watershed data when no hillslope is selected", async () => {
      await act(async () => {
        render(<VegetationCover />);
      });

      await waitFor(() => {
        expect(mockFetchRap).toHaveBeenCalledWith(
          expect.objectContaining({
            mode: "watershed",
            weppId: 108,
          })
        );
      });
    });

    it("fetches hillslope data with specific year", async () => {
      useAppStore.setState({
        selectedHillslopeId: 99,
        selectedHillslopeProps: {} as SubcatchmentProperties,
        choropleth: {
          type: "vegetationCover",
          year: 2010,
          bands: "all",
          range: null,
          loading: false,
          data: null,
          error: null,
        },
      });

      await act(async () => {
        render(<VegetationCover />);
      });

      await waitFor(() => {
        expect(mockFetchRap).toHaveBeenCalledWith(
          expect.objectContaining({
            mode: "hillslope",
            topazId: 99,
            year: 2010,
          })
        );
      });
    });

    it("fetches watershed data with specific year", async () => {
      useAppStore.setState({
        choropleth: {
          type: "vegetationCover",
          year: 2005,
          bands: "all",
          range: null,
          loading: false,
          data: null,
          error: null,
        },
      });

      await act(async () => {
        render(<VegetationCover />);
      });

      await waitFor(() => {
        expect(mockFetchRap).toHaveBeenCalledWith(
          expect.objectContaining({
            mode: "watershed",
            year: 2005,
          })
        );
      });
    });
  });

  describe("data fetching", () => {
    it("handles empty data response", async () => {
      mockFetchRap.mockImplementation(() => Promise.resolve([]));

      await act(async () => {
        render(<VegetationCover />);
      });

      await waitFor(() => {
        expect(mockFetchRap).toHaveBeenCalled();
      });

      expect(screen.getByTestId("coverage-chart")).toBeInTheDocument();
      expect(screen.getByTestId("chart-data-length")).toHaveTextContent("0");
    });

    it("handles fetch error gracefully", async () => {
      mockFetchRap.mockImplementation(() => Promise.reject(new Error("Network error")));

      await act(async () => {
        render(<VegetationCover />);
      });

      await waitFor(() => {
        expect(mockFetchRap).toHaveBeenCalled();
      });

      expect(screen.getByTestId("coverage-chart")).toBeInTheDocument();
    });

    it("handles fetch error without message", async () => {
      mockFetchRap.mockImplementation(() => Promise.reject("Unknown error"));

      await act(async () => {
        render(<VegetationCover />);
      });

      await waitFor(() => {
        expect(mockFetchRap).toHaveBeenCalled();
      });

      expect(screen.getByTestId("coverage-chart")).toBeInTheDocument();
    });

    it("fetches data with specific year parameter", async () => {
      useAppStore.setState({
        choropleth: {
          type: "vegetationCover",
          year: 2015,
          bands: "all",
          range: null,
          loading: false,
          data: null,
          error: null,
        },
      });

      await act(async () => {
        render(<VegetationCover />);
      });

      await waitFor(() => {
        expect(mockFetchRap).toHaveBeenCalledWith(
          expect.objectContaining({
            year: 2015,
          })
        );
      });
    });

    it("fetches data without year parameter when All is selected", async () => {
      await act(async () => {
        render(<VegetationCover />);
      });

      await waitFor(() => {
        expect(mockFetchRap).toHaveBeenCalledWith(
          expect.objectContaining({
            year: undefined,
          })
        );
      });
    });

    it("returns null data when no watershedID and no hillslope", async () => {
      mockUseMatch.mockReturnValue(null as unknown as ReturnType<typeof mockUseMatch>);

      await act(async () => {
        render(<VegetationCover />);
      });

      await waitFor(() => {
        expect(mockFetchRap).not.toHaveBeenCalled();
      });
    });

    it("does not update state when component unmounts during fetch", async () => {
      let resolvePromise: (value: unknown) => void;
      mockFetchRap.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve;
          })
      );

      const { unmount } = render(<VegetationCover />);

      unmount();

      await act(async () => {
        resolvePromise!([{ year: 1986, shrub: 10, tree: 20, coverage: 30 }]);
      });
    });

    it("does not update state when component unmounts during failed fetch", async () => {
      let rejectPromise: (reason: unknown) => void;
      mockFetchRap.mockImplementation(
        () =>
          new Promise((_resolve, reject) => {
            rejectPromise = reject;
          })
      );

      const { unmount } = render(<VegetationCover />);

      unmount();

      await act(async () => {
        rejectPromise!(new Error("Network error after unmount"));
      });
    });
  });

  describe("chart data processing", () => {
    it("processes single year data correctly", async () => {
      useAppStore.setState({
        choropleth: {
          type: "vegetationCover",
          year: 2020,
          bands: "all",
          range: null,
          loading: false,
          data: null,
          error: null,
        },
      });

      mockFetchRap.mockImplementation(() =>
        Promise.resolve([{ year: 2020, shrub: 30, tree: 40, coverage: 70 }])
      );

      await act(async () => {
        render(<VegetationCover />);
      });

      await waitFor(() => {
        expect(mockFetchRap).toHaveBeenCalled();
      });

      expect(screen.getByTestId("chart-data-length")).toHaveTextContent("1");
    });

    it("processes all years data and fills missing years", async () => {
      mockFetchRap.mockImplementation(() =>
        Promise.resolve([
          { year: 1986, shrub: 10, tree: 20, coverage: 30 },
          { year: 2023, shrub: 50, tree: 60, coverage: 110 },
        ])
      );

      await act(async () => {
        render(<VegetationCover />);
      });

      await waitFor(() => {
        expect(mockFetchRap).toHaveBeenCalled();
      });

      expect(screen.getByTestId("chart-data-length")).toHaveTextContent("38");
    });

    it("handles data with null coverage values", async () => {
      mockFetchRap.mockImplementation(() =>
        Promise.resolve([
          { year: 1986, shrub: null, tree: null, coverage: null },
        ])
      );

      await act(async () => {
        render(<VegetationCover />);
      });

      await waitFor(() => {
        expect(mockFetchRap).toHaveBeenCalled();
      });

      expect(screen.getByTestId("coverage-chart")).toBeInTheDocument();
    });

    it("handles missing row for selected year", async () => {
      useAppStore.setState({
        choropleth: {
          type: "vegetationCover",
          year: 1990,
          bands: "all",
          range: null,
          loading: false,
          data: null,
          error: null,
        },
      });

      mockFetchRap.mockImplementation(() =>
        Promise.resolve([{ year: 1986, shrub: 10, tree: 20, coverage: 30 }])
      );

      await act(async () => {
        render(<VegetationCover />);
      });

      await waitFor(() => {
        expect(mockFetchRap).toHaveBeenCalled();
      });

      expect(screen.getByTestId("chart-data-length")).toHaveTextContent("1");
    });
  });

  describe("line keys for different vegetation options", () => {
    it("uses both shrub and tree keys for All option", async () => {
      await act(async () => {
        render(<VegetationCover />);
      });

      await waitFor(() => {
        expect(mockFetchRap).toHaveBeenCalled();
      });

      expect(screen.getByTestId("line-keys-length")).toHaveTextContent("2");
    });

    it("uses only shrub key for Shrub option", async () => {
      useAppStore.setState({
        choropleth: {
          type: "vegetationCover",
          year: null,
          bands: "shrub",
          range: null,
          loading: false,
          data: null,
          error: null,
        },
      });

      await act(async () => {
        render(<VegetationCover />);
      });

      await waitFor(() => {
        expect(mockFetchRap).toHaveBeenCalled();
      });

      expect(screen.getByTestId("line-keys-length")).toHaveTextContent("1");
    });

    it("uses only tree key for Tree option", async () => {
      useAppStore.setState({
        choropleth: {
          type: "vegetationCover",
          year: null,
          bands: "tree",
          range: null,
          loading: false,
          data: null,
          error: null,
        },
      });

      await act(async () => {
        render(<VegetationCover />);
      });

      await waitFor(() => {
        expect(mockFetchRap).toHaveBeenCalled();
      });

      expect(screen.getByTestId("line-keys-length")).toHaveTextContent("1");
    });
  });
});
