import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react"
import { VegetationCover } from "../components/bottom-panels/VegetationCover";
import { Properties } from "../types/WatershedFeature";
import { useAppStore } from "../store/store";

const mockClose = vi.fn();

beforeEach(() => {
  mockClose.mockClear();
  useAppStore.setState({
    closePanel: mockClose,
    selectedHillslopeId: null,
    selectedHillslopeProps: null,
  });
});

afterEach(() => {
  useAppStore.setState({ selectedHillslopeId: null, selectedHillslopeProps: null });
});

describe("VegetationCover", () => {
  it("renders controls and chart with default values", () => {
    render(<VegetationCover />);

    // labels/selects should be present
    expect(screen.getByLabelText("Vegetation Cover:")).toBeInTheDocument();
    expect(screen.getByLabelText("Select Year:")).toBeInTheDocument();

    // the mocked chart should render and show the default title (All Coverage (2024))
    const chart = screen.getByTestId("coverage-chart");
    expect(chart).toBeInTheDocument();
    expect(chart).toHaveTextContent("All Coverage (2024)");
  });

  it("calls closePanel when close button is clicked", () => {
    const { container } = render(<VegetationCover />);

    const closeEl = container.querySelector(".vegCloseButton");
    expect(closeEl).toBeTruthy();

    if (closeEl) {
      fireEvent.click(closeEl);
    }

    expect(mockClose).toHaveBeenCalled();
  });

  it("shows selected hillslope in chart title and reacts to option changes", () => {
    useAppStore.setState({
      selectedHillslopeId: '42',
      selectedHillslopeProps: { cancov: 20, inrcov: 10, dom: 5, width_m: 12 } as Properties,
    });

    render(<VegetationCover />);

    const chart = screen.getByTestId("coverage-chart");
    expect(chart).toHaveTextContent("All Coverage - Hillslope 42 (2024)");

    const selectButton = screen.getByTestId('select-veg-cover-title');
    fireEvent.click(selectButton);
    const treeOption = screen.getByRole('option', { name: 'Tree' });
    fireEvent.click(treeOption);

    expect(chart).toHaveTextContent("Tree Coverage - Hillslope 42 (2024)");
  });
});
