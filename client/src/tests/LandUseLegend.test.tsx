import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { useAppStore } from "../store/store";
import LandUseLegend from "../components/map/controls/LandUseLegend";

describe("Land Use Legend Component Tests", () => {
  beforeEach(() => {
    useAppStore.setState({
      landuseLegendVisible: false,
      landuseLegendMap: {},
    });
  });

  it("renders nothing when landuseLegendVisible is false", () => {
    render(<LandUseLegend />);
    expect(
      screen.queryByRole("region", { name: /land use legend/i }),
    ).not.toBeInTheDocument();
  });

  it("renders empty state when visible and legend map is empty", () => {
    useAppStore.setState({ landuseLegendVisible: true, landuseLegendMap: {} });
    render(<LandUseLegend />);

    expect(
      screen.getByRole("region", { name: /land use legend/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Land Use Legend")).toBeInTheDocument();
    expect(screen.getByText("No legend data available.")).toBeInTheDocument();
  });

  it("renders legend items when legend map has entries", () => {
    useAppStore.setState({
      landuseLegendVisible: true,
      landuseLegendMap: {
        "#ff0000": "Forest",
        "#00ff00": "Grass",
      },
    });

    const { container } = render(<LandUseLegend />);

    expect(screen.getByText("Forest")).toBeInTheDocument();
    expect(screen.getByText("Grass")).toBeInTheDocument();

    const items = container.querySelectorAll("[data-testid='landuse-item']");
    expect(items).toHaveLength(2);
  });
});
