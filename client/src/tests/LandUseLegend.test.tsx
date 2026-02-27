import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { useAppStore } from "../store/store";
import LandUseLegend from "../components/map/controls/LandUseLegend";
import { INITIAL_DESIRED, INITIAL_RUNTIME } from "../layers/rules";

describe("Land Use Legend Component Tests", () => {
  beforeEach(() => {
    useAppStore.setState({
      layerDesired: INITIAL_DESIRED,
      layerRuntime: INITIAL_RUNTIME,
      landuseLegendMap: {},
    });
  });

  it("renders nothing when landuse is not effectively enabled", () => {
    render(<LandUseLegend />);
    expect(
      screen.queryByRole("region", { name: /land use legend/i }),
    ).not.toBeInTheDocument();
  });

  it("renders nothing when landuse is effective but legend map is empty", () => {
    // Enable subcatchment + landuse in desired state and mark subcatchment data as available
    useAppStore.setState({
      layerDesired: {
        ...INITIAL_DESIRED,
        subcatchment: { ...INITIAL_DESIRED.subcatchment, enabled: true },
        landuse: { ...INITIAL_DESIRED.landuse, enabled: true },
      },
      layerRuntime: {
        ...INITIAL_RUNTIME,
        dataAvailability: { subcatchment: true, landuse: true },
      },
      landuseLegendMap: {},
    });
    render(<LandUseLegend />);

    expect(
      screen.queryByRole("region", { name: /land use legend/i }),
    ).not.toBeInTheDocument();
  });

  it("renders legend items when landuse is effective and legend map has entries", () => {
    useAppStore.setState({
      layerDesired: {
        ...INITIAL_DESIRED,
        subcatchment: { ...INITIAL_DESIRED.subcatchment, enabled: true },
        landuse: { ...INITIAL_DESIRED.landuse, enabled: true },
      },
      layerRuntime: {
        ...INITIAL_RUNTIME,
        dataAvailability: { subcatchment: true, landuse: true },
      },
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
