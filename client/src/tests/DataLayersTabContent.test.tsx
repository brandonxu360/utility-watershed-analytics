import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { INITIAL_DESIRED } from "../layers/rules";
import { evaluate } from "../layers/evaluate";
import type { LayerRuntime } from "../layers/types";
import DataLayersTabContent from "../components/map/controls/DataLayers/DataLayersTabContent";
import type { DesiredMap } from "../layers/types";

const mockDispatchLayerAction = vi.fn();
const mockEnableLayerWithParams = vi.fn();

const INITIAL_RUNTIME: LayerRuntime = {
  zoom: 7,
  dataAvailability: {},
  loading: {},
};

let mockDesired: DesiredMap = JSON.parse(JSON.stringify(INITIAL_DESIRED));

vi.mock("../contexts/WatershedContext", () => ({
  useWatershed: () => ({
    layerDesired: mockDesired,
    effective: evaluate(mockDesired, INITIAL_RUNTIME),
    dispatchLayerAction: mockDispatchLayerAction,
    enableLayerWithParams: mockEnableLayerWithParams,
  }),
}));

describe("DataLayersTabContent", () => {
  const handleToggle = vi.fn<(id: string, checked: boolean) => void>();

  beforeEach(() => {
    vi.clearAllMocks();
    mockDesired = JSON.parse(JSON.stringify(INITIAL_DESIRED));
  });

  it("renders WEPP tab with subcatchment + channels checkboxes", () => {
    const { container } = render(
      <DataLayersTabContent activeTab="WEPP" handleToggle={handleToggle} />,
    );

    expect(screen.getByText("Subcatchments")).toBeInTheDocument();
    expect(screen.getByText("Channels")).toBeInTheDocument();

    expect(
      container.querySelector("input#subcatchment[type='checkbox']"),
    ).toBeTruthy();
    expect(
      container.querySelector("input#channels[type='checkbox']"),
    ).toBeTruthy();
  });

  it("disables subcatchment checkbox when a dependent layer (landuse) is enabled", () => {
    mockDesired = {
      ...INITIAL_DESIRED,
      subcatchment: { ...INITIAL_DESIRED.subcatchment, enabled: true },
      landuse: { ...INITIAL_DESIRED.landuse, enabled: true },
    };

    const { container } = render(
      <DataLayersTabContent activeTab="WEPP" handleToggle={handleToggle} />,
    );

    const subcatchmentBox = container.querySelector(
      "input#subcatchment",
    ) as HTMLInputElement;
    expect(subcatchmentBox).toBeTruthy();
    expect(subcatchmentBox.disabled).toBe(true);
  });

  it("disables subcatchment checkbox when a dependent layer (choropleth) is enabled", () => {
    mockDesired = {
      ...INITIAL_DESIRED,
      subcatchment: { ...INITIAL_DESIRED.subcatchment, enabled: true },
      choropleth: {
        ...INITIAL_DESIRED.choropleth,
        enabled: true,
        params: { metric: "vegetationCover", year: null, bands: "all" },
      },
    };

    const { container } = render(
      <DataLayersTabContent activeTab="WEPP" handleToggle={handleToggle} />,
    );

    const subcatchmentBox = container.querySelector(
      "input#subcatchment",
    ) as HTMLInputElement;
    expect(subcatchmentBox).toBeTruthy();
    expect(subcatchmentBox.disabled).toBe(true);
  });

  it("wires handleToggle for WEPP checkboxes", () => {
    const { container } = render(
      <DataLayersTabContent activeTab="WEPP" handleToggle={handleToggle} />,
    );

    fireEvent.click(container.querySelector("input#subcatchment")!);
    fireEvent.click(container.querySelector("input#channels")!);

    expect(handleToggle).toHaveBeenCalledTimes(2);
  });

  it("renders Watershed Data tab with landuse checkbox", () => {
    const { container } = render(
      <DataLayersTabContent
        activeTab="Watershed Data"
        handleToggle={handleToggle}
      />,
    );

    expect(screen.getByText("Land Use (2025)")).toBeInTheDocument();
    expect(
      container.querySelector("input#landuse[type='checkbox']"),
    ).toBeTruthy();
  });

  it("does not show the land use legend help icon when landuse is false", () => {
    render(
      <DataLayersTabContent
        activeTab="Watershed Data"
        handleToggle={handleToggle}
      />,
    );
    expect(screen.queryByTitle("Land Use Legend")).not.toBeInTheDocument();
  });

  it("renders Watershed Data tab with vegetation cover and sbs checkboxes", () => {
    const { container } = render(
      <DataLayersTabContent activeTab="Watershed Data" handleToggle={handleToggle} />,
    );

    expect(screen.getByText("Vegetation Cover")).toBeInTheDocument();
    expect(screen.getByText("Soil Burn Severity")).toBeInTheDocument();
    expect(
      container.querySelector("input#vegetationCover[type='checkbox']"),
    ).toBeTruthy();
    expect(container.querySelector("input#sbs[type='checkbox']")).toBeTruthy();
  });

  it("enables choropleth via enableLayerWithParams when vegetation cover is checked", () => {
    const { container } = render(
      <DataLayersTabContent activeTab="Watershed Data" handleToggle={handleToggle} />,
    );

    fireEvent.click(container.querySelector("input#vegetationCover")!);

    expect(mockEnableLayerWithParams).toHaveBeenCalledWith("choropleth", {
      metric: "vegetationCover",
    });
  });
});
