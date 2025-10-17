import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react"
import { CoverageBarChartProps } from "../components/coverage-bar-chart/CoverageBarChart";
import { SelectProps } from "../components/select/Select";

const mockClose = vi.fn();

vi.mock("../store/BottomPanelStore", () => {
  return {
    useBottomPanelStore: () => ({ closePanel: mockClose }),
  };
});

vi.mock("../components/coverage-bar-chart/CoverageBarChart", () => {
  return {
    default: (props: CoverageBarChartProps) => (
      <div data-testid="coverage-chart">{props.title}</div>
    ),
  };
});

vi.mock("../components/select/Select", () => {
  return {
    default: ({ value, onChange, options, ariaLabel, id }: SelectProps) => (
      <select
        data-testid={`select-${id}`}
        id={id}
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt: string) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    ),
  };
});

import { VegetationCover } from "../components/bottom-panels/VegetationCover";

beforeEach(() => {
  mockClose.mockClear();
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
});
