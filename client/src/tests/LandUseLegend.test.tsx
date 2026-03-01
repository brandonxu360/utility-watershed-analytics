import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import LandUseLegend from "../components/map/controls/LandUseLegend";
import { INITIAL_DESIRED, INITIAL_RUNTIME } from "../layers/rules";
import { evaluate, isDesiredButBlocked } from "../layers/evaluate";
import type { DesiredMap, LayerRuntime, LayerId } from "../layers/types";

let mockDesired: DesiredMap = JSON.parse(JSON.stringify(INITIAL_DESIRED));
let mockRuntime: LayerRuntime = JSON.parse(JSON.stringify(INITIAL_RUNTIME));
let mockLanduseLegendMap: Record<string, string> = {};

vi.mock("../contexts/WatershedContext", () => ({
  useWatershed: () => {
    const eff = evaluate(mockDesired, mockRuntime);
    return {
      landuseLegendMap: mockLanduseLegendMap,
      effective: eff,
      isEffective: (id: LayerId) => eff[id].enabled,
      isBlocked: (id: LayerId) => isDesiredButBlocked(id, mockDesired, eff),
    };
  },
}));

vi.mock("../hooks/useEffectiveLayers", () => ({
  useEffectiveLayers: () => {
    const eff = evaluate(mockDesired, mockRuntime);
    return {
      effective: eff,
      isEffective: (id: LayerId) => eff[id].enabled,
      isBlocked: (id: LayerId) => isDesiredButBlocked(id, mockDesired, eff),
    };
  },
}));

describe("Land Use Legend Component Tests", () => {
  beforeEach(() => {
    mockDesired = JSON.parse(JSON.stringify(INITIAL_DESIRED));
    mockRuntime = JSON.parse(JSON.stringify(INITIAL_RUNTIME));
    mockLanduseLegendMap = {};
  });

  it("renders nothing when landuse is not effectively enabled", () => {
    render(<LandUseLegend />);
    expect(
      screen.queryByRole("region", { name: /land use legend/i }),
    ).not.toBeInTheDocument();
  });

  it("renders nothing when landuse is effective but legend map is empty", () => {
    mockDesired = {
      ...INITIAL_DESIRED,
      subcatchment: { ...INITIAL_DESIRED.subcatchment, enabled: true },
      landuse: { ...INITIAL_DESIRED.landuse, enabled: true },
    };
    mockRuntime = {
      ...INITIAL_RUNTIME,
      dataAvailability: { subcatchment: true, landuse: true },
    };
    mockLanduseLegendMap = {};
    render(<LandUseLegend />);

    expect(
      screen.queryByRole("region", { name: /land use legend/i }),
    ).not.toBeInTheDocument();
  });

  it("renders legend items when landuse is effective and legend map has entries", () => {
    mockDesired = {
      ...INITIAL_DESIRED,
      subcatchment: { ...INITIAL_DESIRED.subcatchment, enabled: true },
      landuse: { ...INITIAL_DESIRED.landuse, enabled: true },
    };
    mockRuntime = {
      ...INITIAL_RUNTIME,
      dataAvailability: { subcatchment: true, landuse: true },
    };
    mockLanduseLegendMap = {
      "#ff0000": "Forest",
      "#00ff00": "Grass",
    };

    const { container } = render(<LandUseLegend />);

    expect(screen.getByText("Forest")).toBeInTheDocument();
    expect(screen.getByText("Grass")).toBeInTheDocument();

    const items = container.querySelectorAll("[data-testid='landuse-item']");
    expect(items).toHaveLength(2);
  });
});
