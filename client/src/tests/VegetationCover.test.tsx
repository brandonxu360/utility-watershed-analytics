import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import { useBottomPanelStore } from "../store/BottomPanelStore";
import { VegetationCover } from "../components/bottom-panels/VegetationCover";
import { Properties } from "../types/WatershedFeature";

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal();
  // Use Object.assign to avoid TS spread-on-module issues in the test environment
  return Object.assign({}, actual, { useMatch: () => ({ params: { webcloudRunId: 'or,wa-108' } }) });
});

const { mockFetchRap } = vi.hoisted(() => ({
  mockFetchRap: vi.fn().mockImplementation(() =>
    Promise.resolve([{ year: 1986, shrub: 1, tree: 2, coverage: 3 }])
  ),
}));

vi.mock("../api/rapApi", () => ({
  default: mockFetchRap,
  fetchRap: mockFetchRap,
}));

const mockClose = vi.fn();

beforeEach(() => {
  mockClose.mockClear();
  mockFetchRap.mockClear();
  useBottomPanelStore.setState({
    closePanel: mockClose,
    selectedHillslopeId: null,
    selectedHillslopeProps: null,
  });
});

afterEach(async () => {
  // Allow any pending state updates to flush
  await act(async () => {
    useBottomPanelStore.setState({ selectedHillslopeId: null, selectedHillslopeProps: null });
  });
});

describe("VegetationCover", () => {
  it("renders controls and chart with default values", async () => {
    await act(async () => {
      render(<VegetationCover />);
    });

    // labels/selects should be present
    expect(screen.getByLabelText("Vegetation Cover:")).toBeInTheDocument();
    expect(screen.getByLabelText("Select Year:")).toBeInTheDocument();

    // Wait for the async data fetch to complete and chart to render
    await act(async () => {
      await waitFor(() => {
        expect(mockFetchRap).toHaveBeenCalled();
      });
    });

    const chart = screen.getByTestId("coverage-chart");
    expect(chart).toBeInTheDocument();
    expect(chart).toHaveTextContent("All Coverage (All)");
  });

  it("calls closePanel when close button is clicked", async () => {
    let container: HTMLElement;
    await act(async () => {
      const result = render(<VegetationCover />);
      container = result.container;
    });

    // Wait for the async data fetch to complete
    await act(async () => {
      await waitFor(() => {
        expect(mockFetchRap).toHaveBeenCalled();
      });
    });

    const closeEl = container!.querySelector(".vegCloseButton");
    expect(closeEl).toBeTruthy();

    await act(async () => {
      if (closeEl) {
        fireEvent.click(closeEl);
      }
    });

    expect(mockClose).toHaveBeenCalled();
  });

  it("shows selected hillslope in chart title and reacts to option changes", async () => {
    await act(async () => {
      useBottomPanelStore.setState({
        selectedHillslopeId: 42,
        selectedHillslopeProps: { cancov: 20, inrcov: 10, dom: 5, width_m: 12 } as Properties,
      });
    });

    await act(async () => {
      render(<VegetationCover />);
    });

    // Wait for the async data fetch to complete
    await act(async () => {
      await waitFor(() => {
        expect(mockFetchRap).toHaveBeenCalled();
      });
    });

    const chart = screen.getByTestId("coverage-chart");
    expect(chart).toHaveTextContent("All Coverage - Hillslope 42 (All)");

    await act(async () => {
      const selectButton = screen.getByTestId('select-veg-cover-title');
      fireEvent.click(selectButton);
    });

    await act(async () => {
      const treeOption = screen.getByRole('option', { name: 'Tree' });
      fireEvent.click(treeOption);
    });

    await waitFor(() => {
      expect(chart).toHaveTextContent("Tree Coverage - Hillslope 42 (All)");
    });
  });
});
