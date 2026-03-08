import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { VegetationCover } from "../components/bottom-panels/VegetationCover";
import { INITIAL_DESIRED } from "../layers/rules";
import type { LayerId, DesiredMap } from "../layers/types";

const { mockUseParams } = vi.hoisted(() => ({
  mockUseParams: vi.fn(),
}));

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal();
  return Object.assign({}, actual, {
    useParams: () => mockUseParams(),
  });
});

const { mockFetchRap } = vi.hoisted(() => ({
  mockFetchRap: vi.fn().mockImplementation(() =>
    Promise.resolve([
      { year: 1986, shrub: 10, tree: 20, coverage: 30 },
      { year: 1987, shrub: 15, tree: 25, coverage: 40 },
      { year: 2020, shrub: 30, tree: 40, coverage: 70 },
    ]),
  ),
}));

vi.mock("../api/rapApi", () => ({
  default: mockFetchRap,
  fetchRap: mockFetchRap,
}));

vi.mock("../components/CoverageLineChart", () => ({
  CoverageLineChart: ({
    data,
    title,
    lineKeys,
  }: {
    data: unknown[];
    title: string;
    lineKeys: unknown[];
  }) => (
    <div data-testid="coverage-chart">
      {title}
      <span data-testid="chart-data-length">{data.length}</span>
      <span data-testid="line-keys-length">{lineKeys.length}</span>
    </div>
  ),
}));

vi.mock("react-icons/fa6", () => ({
  FaXmark: ({
    className,
    onClick,
  }: {
    className?: string;
    onClick?: () => void;
  }) => (
    <span data-testid="close-icon" className={className} onClick={onClick}>
      X
    </span>
  ),
  FaChevronDown: () => <span data-testid="chevron-down">▼</span>,
}));

/** Build a DesiredMap with the given layer IDs enabled. */
const desiredWith = (...ids: LayerId[]): DesiredMap => {
  const d = JSON.parse(JSON.stringify(INITIAL_DESIRED)) as DesiredMap;
  for (const id of ids) d[id].enabled = true;
  return d;
};

const mockClearSelectedHillslope = vi.fn();
const mockDispatchLayerAction = vi.fn();

let mockDesired: DesiredMap = desiredWith("choropleth");
let mockSelectedHillslopeId: number | null = null;

vi.mock("../contexts/WatershedContext", () => ({
  useWatershed: () => ({
    layerDesired: mockDesired,
    dispatchLayerAction: mockDispatchLayerAction,
    selectedHillslopeId: mockSelectedHillslopeId,
    clearSelectedHillslope: mockClearSelectedHillslope,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockFetchRap.mockImplementation(() =>
    Promise.resolve([
      { year: 1986, shrub: 10, tree: 20, coverage: 30 },
      { year: 1987, shrub: 15, tree: 25, coverage: 40 },
      { year: 2020, shrub: 30, tree: 40, coverage: 70 },
    ]),
  );
  mockUseParams.mockReturnValue("batch;;test-batch;;test-run");
  mockDesired = desiredWith("choropleth");
  mockSelectedHillslopeId = null;
});

afterEach(async () => {
  mockSelectedHillslopeId = null;
});

describe("VegetationCover", () => {
  describe("rendering", () => {
    it("renders controls and chart with default values", async () => {
      await act(async () => {
        render(<VegetationCover />);
      });

      expect(screen.getByText("Vegetation Cover:")).toBeInTheDocument();
      expect(screen.getByText("Select Year:")).toBeInTheDocument();

      await waitFor(() => {
        expect(mockFetchRap).toHaveBeenCalled();
      });

      const chart = screen.getByTestId("coverage-chart");
      expect(chart).toBeInTheDocument();
      expect(chart).toHaveTextContent("All Coverage (All)");
    });

    it("renders with initial choropleth year from store", async () => {
      const d = desiredWith("choropleth");
      d.choropleth.params.year = 2020;
      mockDesired = d;

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
      const d = desiredWith("choropleth");
      d.choropleth.params.bands = "shrub";
      mockDesired = d;

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
      const d = desiredWith("choropleth");
      d.choropleth.params.bands = "tree";
      mockDesired = d;

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
          }),
      );

      await act(async () => {
        render(<VegetationCover />);
      });

      expect(screen.getByText("Loading vegetation data…")).toBeInTheDocument();

      await act(async () => {
        resolvePromise!([{ year: 1986, shrub: 10, tree: 20, coverage: 30 }]);
      });

      await waitFor(() => {
        expect(
          screen.queryByText("Loading vegetation data…"),
        ).not.toBeInTheDocument();
      });
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

      const closeButton = screen.getByTestId("veg-close-button");
      expect(closeButton).toBeTruthy();

      await act(async () => {
        fireEvent.click(closeButton);
      });

      expect(mockClearSelectedHillslope).toHaveBeenCalled();
      expect(mockDispatchLayerAction).toHaveBeenCalledWith({
        type: "TOGGLE",
        id: "choropleth",
        on: false,
      });
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

      expect(screen.getByTestId("coverage-chart")).toHaveTextContent(
        "All Coverage",
      );

      await act(async () => {
        fireEvent.mouseDown(document.getElementById("veg-cover-title")!);
      });

      await act(async () => {
        fireEvent.click(screen.getByRole("option", { name: "Shrub" }));
      });

      expect(mockDispatchLayerAction).toHaveBeenCalledWith({
        type: "SET_PARAM",
        id: "choropleth",
        key: "bands",
        value: "shrub",
      });
    });

    it("changes to Tree option and updates store", async () => {
      await act(async () => {
        render(<VegetationCover />);
      });

      await waitFor(() => {
        expect(mockFetchRap).toHaveBeenCalled();
      });

      await act(async () => {
        fireEvent.mouseDown(document.getElementById("veg-cover-title")!);
      });

      await act(async () => {
        fireEvent.click(screen.getByRole("option", { name: "Tree" }));
      });

      expect(mockDispatchLayerAction).toHaveBeenCalledWith({
        type: "SET_PARAM",
        id: "choropleth",
        key: "bands",
        value: "tree",
      });
    });

    it("changes back to All option and updates store", async () => {
      const d = desiredWith("choropleth");
      d.choropleth.params.bands = "tree";
      mockDesired = d;

      await act(async () => {
        render(<VegetationCover />);
      });

      await waitFor(() => {
        expect(mockFetchRap).toHaveBeenCalled();
      });

      expect(screen.getByTestId("coverage-chart")).toHaveTextContent(
        "Tree Coverage",
      );

      await act(async () => {
        fireEvent.mouseDown(document.getElementById("veg-cover-title")!);
      });

      await act(async () => {
        fireEvent.click(screen.getByRole("option", { name: "All" }));
      });

      expect(mockDispatchLayerAction).toHaveBeenCalledWith({
        type: "SET_PARAM",
        id: "choropleth",
        key: "bands",
        value: "all",
      });
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
        fireEvent.mouseDown(document.getElementById("veg-year")!);
      });

      await act(async () => {
        fireEvent.click(screen.getByRole("option", { name: "2020" }));
      });

      expect(mockDispatchLayerAction).toHaveBeenCalledWith({
        type: "SET_PARAM",
        id: "choropleth",
        key: "year",
        value: 2020,
      });
    });

    it("changes back to All years and updates store with null", async () => {
      const d = desiredWith("choropleth");
      d.choropleth.params.year = 2020;
      mockDesired = d;

      await act(async () => {
        render(<VegetationCover />);
      });

      await waitFor(() => {
        expect(mockFetchRap).toHaveBeenCalled();
      });

      expect(screen.getByTestId("coverage-chart")).toHaveTextContent("(2020)");

      await act(async () => {
        fireEvent.mouseDown(document.getElementById("veg-year")!);
      });

      await act(async () => {
        fireEvent.click(screen.getByRole("option", { name: "All" }));
      });

      expect(mockDispatchLayerAction).toHaveBeenCalledWith({
        type: "SET_PARAM",
        id: "choropleth",
        key: "year",
        value: null,
      });
    });
  });

  describe("hillslope selection", () => {
    it("shows selected hillslope in chart title", async () => {
      mockSelectedHillslopeId = 42;

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
      mockSelectedHillslopeId = 123;

      await act(async () => {
        render(<VegetationCover />);
      });

      await waitFor(() => {
        expect(mockFetchRap).toHaveBeenCalledWith(
          expect.objectContaining({
            mode: "hillslope",
            topazId: 123,
          }),
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
          }),
        );
      });
    });

    it("fetches hillslope data with specific year", async () => {
      const d = desiredWith("choropleth");
      d.choropleth.params.year = 2010;
      mockDesired = d;
      mockSelectedHillslopeId = 99;

      await act(async () => {
        render(<VegetationCover />);
      });

      await waitFor(() => {
        expect(mockFetchRap).toHaveBeenCalledWith(
          expect.objectContaining({
            mode: "hillslope",
            topazId: 99,
            year: 2010,
          }),
        );
      });
    });

    it("fetches watershed data with specific year", async () => {
      const d = desiredWith("choropleth");
      d.choropleth.params.year = 2005;
      mockDesired = d;

      await act(async () => {
        render(<VegetationCover />);
      });

      await waitFor(() => {
        expect(mockFetchRap).toHaveBeenCalledWith(
          expect.objectContaining({
            mode: "watershed",
            year: 2005,
          }),
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
      mockFetchRap.mockImplementation(() =>
        Promise.reject(new Error("Network error")),
      );

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
      const d = desiredWith("choropleth");
      d.choropleth.params.year = 2015;
      mockDesired = d;

      await act(async () => {
        render(<VegetationCover />);
      });

      await waitFor(() => {
        expect(mockFetchRap).toHaveBeenCalledWith(
          expect.objectContaining({
            year: 2015,
          }),
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
          }),
        );
      });
    });

    it("returns null data when no watershedID and no hillslope", async () => {
      mockUseParams.mockReturnValue(undefined);

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
          }),
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
          }),
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
      const d = desiredWith("choropleth");
      d.choropleth.params.year = 2020;
      mockDesired = d;

      mockFetchRap.mockImplementation(() =>
        Promise.resolve([{ year: 2020, shrub: 30, tree: 40, coverage: 70 }]),
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
        ]),
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
        ]),
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
      const d = desiredWith("choropleth");
      d.choropleth.params.year = 1990;
      mockDesired = d;

      mockFetchRap.mockImplementation(() =>
        Promise.resolve([{ year: 1986, shrub: 10, tree: 20, coverage: 30 }]),
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
      const d = desiredWith("choropleth");
      d.choropleth.params.bands = "shrub";
      mockDesired = d;

      await act(async () => {
        render(<VegetationCover />);
      });

      await waitFor(() => {
        expect(mockFetchRap).toHaveBeenCalled();
      });

      expect(screen.getByTestId("line-keys-length")).toHaveTextContent("1");
    });

    it("uses only tree key for Tree option", async () => {
      const d = desiredWith("choropleth");
      d.choropleth.params.bands = "tree";
      mockDesired = d;

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
