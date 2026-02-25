import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAppStore } from "../store/store";
import { initialLayersState } from "../store/slices/layersSlice";
import DataLayersTabContent from "../components/map/controls/DataLayers/DataLayersTabContent";

vi.mock("../components/bottom-panels/VegetationCover", () => ({
  VegetationCover: () => <div data-testid="vegetation-cover" />,
}));

describe("DataLayersTabContent", () => {
  const handleChange =
    vi.fn<(e: React.ChangeEvent<HTMLInputElement>) => void>();
  const setSubcatchment = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    useAppStore.setState({
      ...initialLayersState,
      setSubcatchment,
    });
  });

  it("renders WEPP tab with subcatchment + channels checkboxes", () => {
    const { container } = render(
      <DataLayersTabContent activeTab="WEPP" handleChange={handleChange} />,
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

  it("disables the subcatchment checkbox when activeDataLayer is not none", () => {
    useAppStore.setState({ activeDataLayer: "landuse", subcatchment: true });

    const { container } = render(
      <DataLayersTabContent activeTab="WEPP" handleChange={handleChange} />,
    );

    const subcatchmentBox = container.querySelector(
      "input#subcatchment",
    ) as HTMLInputElement;
    expect(subcatchmentBox).toBeTruthy();
    expect(subcatchmentBox.disabled).toBe(true);
  });

  it("wires handleChange for WEPP checkboxes", () => {
    const { container } = render(
      <DataLayersTabContent activeTab="WEPP" handleChange={handleChange} />,
    );

    fireEvent.click(container.querySelector("input#subcatchment")!);
    fireEvent.click(container.querySelector("input#channels")!);

    expect(handleChange).toHaveBeenCalledTimes(2);
  });

  it("renders Watershed Data tab with landuse and vegetation checkboxes", () => {
    const { container } = render(
      <DataLayersTabContent
        activeTab="Watershed Data"
        handleChange={handleChange}
      />,
    );

    expect(screen.getByText("Land Use (2025)")).toBeInTheDocument();
    expect(
      container.querySelector("input#landuse[type='checkbox']"),
    ).toBeTruthy();
    expect(
      container.querySelector("input#vegetationCover[type='checkbox']"),
    ).toBeTruthy();
  });
});
