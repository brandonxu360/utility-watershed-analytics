import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { INITIAL_DESIRED } from "../layers/rules";
import DataLayersTabContent from "../components/map/controls/DataLayers/DataLayersTabContent";
import type { DesiredMap } from "../layers/types";

const mockDispatchLayerAction = vi.fn();
const mockEnableLayerWithParams = vi.fn();

let mockDesired: DesiredMap = JSON.parse(JSON.stringify(INITIAL_DESIRED));

vi.mock("../contexts/WatershedContext", () => ({
  useWatershed: () => ({
    layerDesired: mockDesired,
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

  it("renders WEPP Hillslopes tab with subcatchment + channels checkboxes", () => {
    const { container } = render(
      <DataLayersTabContent
        activeTab="WEPP Hillslopes"
        handleToggle={handleToggle}
      />,
    );

    expect(screen.getByText("Subcatchments")).toBeInTheDocument();
    expect(screen.getByText("WEPP Channels")).toBeInTheDocument();

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
      <DataLayersTabContent
        activeTab="WEPP Hillslopes"
        handleToggle={handleToggle}
      />,
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
      <DataLayersTabContent
        activeTab="WEPP Hillslopes"
        handleToggle={handleToggle}
      />,
    );

    const subcatchmentBox = container.querySelector(
      "input#subcatchment",
    ) as HTMLInputElement;
    expect(subcatchmentBox).toBeTruthy();
    expect(subcatchmentBox.disabled).toBe(true);
  });

  it("wires handleToggle for WEPP Hillslopes checkboxes", () => {
    const { container } = render(
      <DataLayersTabContent
        activeTab="WEPP Hillslopes"
        handleToggle={handleToggle}
      />,
    );

    fireEvent.click(container.querySelector("input#subcatchment")!);
    fireEvent.click(container.querySelector("input#channels")!);

    expect(handleToggle).toHaveBeenCalledTimes(2);
  });

  it("renders Surface Data tab with landuse checkbox and choropleth buttons", () => {
    const { container } = render(
      <DataLayersTabContent
        activeTab="Surface Data"
        handleToggle={handleToggle}
      />,
    );

    expect(screen.getByText("Land Use (2025)")).toBeInTheDocument();
    expect(
      container.querySelector("input#landuse[type='checkbox']"),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Evapotranspiration" }),
    ).toBeInTheDocument();
  });

  it("does not show the land use legend help icon when landuse is false", () => {
    render(
      <DataLayersTabContent
        activeTab="Surface Data"
        handleToggle={handleToggle}
      />,
    );
    expect(screen.queryByTitle("Land Use Legend")).not.toBeInTheDocument();
  });

  it("bolds the active choropleth type when choropleth is active", () => {
    mockDesired = {
      ...INITIAL_DESIRED,
      choropleth: {
        ...INITIAL_DESIRED.choropleth,
        enabled: true,
        params: { metric: "evapotranspiration", year: null, bands: "all" },
      },
    };

    render(
      <DataLayersTabContent
        activeTab="Surface Data"
        handleToggle={handleToggle}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Evapotranspiration" }),
    ).toHaveStyle("font-weight: bold");
  });

  it("renders Coverage tab and clicking Vegetation Cover calls enableLayerWithParams", () => {
    render(
      <DataLayersTabContent activeTab="Coverage" handleToggle={handleToggle} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Vegetation Cover" }));

    expect(mockEnableLayerWithParams).toHaveBeenCalledWith("choropleth", {
      metric: "vegetationCover",
    });
  });

  it("renders Soil Burn tab and wires handleToggle for checkboxes", () => {
    const { container } = render(
      <DataLayersTabContent
        activeTab="Soil Burn"
        handleToggle={handleToggle}
      />,
    );

    expect(screen.getByText("Fire Severity")).toBeInTheDocument();
    expect(screen.getByText("Soil Burn Severity")).toBeInTheDocument();
    expect(screen.getByText("Predict")).toBeInTheDocument();

    fireEvent.click(container.querySelector("input#fireSeverity")!);
    fireEvent.click(container.querySelector("input#sbs")!);

    expect(handleToggle).toHaveBeenCalledTimes(2);
  });
});
