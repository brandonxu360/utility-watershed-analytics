import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAppStore } from "../store/store";
import { initialChoroplethState } from "../store/slices/choroplethSlice";
import DataLayersTabContent from "../components/map/controls/DataLayers/DataLayersTabContent";
import type { ReactElement, ReactNode } from "react";

const mockUseChoropleth = vi.fn();

vi.mock("../hooks/useChoropleth", () => ({
  useChoropleth: () => mockUseChoropleth(),
}));

vi.mock("../components/bottom-panels/VegetationCover", () => ({
  VegetationCover: () => <div data-testid="vegetation-cover" />,
}));

describe("DataLayersTabContent", () => {
  const handleChange =
    vi.fn<(e: React.ChangeEvent<HTMLInputElement>) => void>();
  const setSubcatchment = vi.fn();
  const setLanduseLegendVisible = vi.fn();
  const setChoroplethType = vi.fn();
  const openPanel = vi.fn<(node: ReactNode) => void>();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseChoropleth.mockReturnValue({ isActive: false });

    useAppStore.setState({
      subcatchment: false,
      channels: false,
      landuse: false,
      choropleth: { ...initialChoroplethState, type: "none" },
      setSubcatchment,
      setLanduseLegendVisible,
      setChoroplethType,
      openPanel,
    });
  });

  it("renders Hill Slopes tab with subcatchment + channels checkboxes", () => {
    const { container } = render(
      <DataLayersTabContent
        activeTab="Hill Slopes"
        handleChange={handleChange}
      />,
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

  it("disables the subcatchment checkbox when landuse && subcatchment", () => {
    useAppStore.setState({ landuse: true, subcatchment: true });

    const { container } = render(
      <DataLayersTabContent
        activeTab="Hill Slopes"
        handleChange={handleChange}
      />,
    );

    const subcatchmentBox = container.querySelector(
      "input#subcatchment",
    ) as HTMLInputElement;
    expect(subcatchmentBox).toBeTruthy();
    expect(subcatchmentBox.disabled).toBe(true);
  });

  it("wires handleChange for Hill Slopes checkboxes", () => {
    const { container } = render(
      <DataLayersTabContent
        activeTab="Hill Slopes"
        handleChange={handleChange}
      />,
    );

    fireEvent.click(container.querySelector("input#subcatchment")!);
    fireEvent.click(container.querySelector("input#channels")!);

    expect(handleChange).toHaveBeenCalledTimes(2);
  });

  it("renders Surface Data tab with landuse checkbox and choropleth buttons", () => {
    const { container } = render(
      <DataLayersTabContent
        activeTab="Surface Data"
        handleChange={handleChange}
      />,
    );

    expect(screen.getByText("Land Use")).toBeInTheDocument();
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
        handleChange={handleChange}
      />,
    );
    expect(screen.queryByTitle("Land Use Legend")).not.toBeInTheDocument();
  });

  it("shows the land use legend help icon when landuse is true and clicking it opens legend", () => {
    useAppStore.setState({ landuse: true });
    render(
      <DataLayersTabContent
        activeTab="Surface Data"
        handleChange={handleChange}
      />,
    );

    fireEvent.click(screen.getByTitle("Land Use Legend"));
    expect(setLanduseLegendVisible).toHaveBeenCalledWith(true);
  });

  it("bolds the active choropleth type when choropleth is active", () => {
    mockUseChoropleth.mockReturnValue({ isActive: true });
    useAppStore.setState({
      choropleth: { ...initialChoroplethState, type: "evapotranspiration" },
    });

    render(
      <DataLayersTabContent
        activeTab="Surface Data"
        handleChange={handleChange}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Evapotranspiration" }),
    ).toHaveStyle("font-weight: bold");
  });

  it("renders Coverage tab and clicking Vegetation Cover opens the vegetation panel and sets choropleth type", () => {
    render(
      <DataLayersTabContent activeTab="Coverage" handleChange={handleChange} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Vegetation Cover" }));

    expect(setSubcatchment).toHaveBeenCalledWith(true);
    expect(setChoroplethType).toHaveBeenCalledWith("vegetationCover");
    expect(openPanel).toHaveBeenCalledTimes(1);

    const element = openPanel.mock.calls[0]?.[0] as ReactElement;
    expect(element.type).toBeTruthy();
  });

  it("renders Soil Burn tab and wires handleChange for checkboxes", () => {
    const { container } = render(
      <DataLayersTabContent
        activeTab="Soil Burn"
        handleChange={handleChange}
      />,
    );

    expect(screen.getByText("Fire Severity")).toBeInTheDocument();
    expect(screen.getByText("Soil Burn Severity")).toBeInTheDocument();
    expect(screen.getByText("Predict")).toBeInTheDocument();

    fireEvent.click(container.querySelector("input#fireSeverity")!);
    fireEvent.click(container.querySelector("input#soilBurnSeverity")!);

    expect(handleChange).toHaveBeenCalledTimes(2);
  });
});
