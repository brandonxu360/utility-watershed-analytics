import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { INITIAL_DESIRED } from "../layers/rules";
import { evaluate } from "../layers/evaluate";
import type { LayerRuntime, DesiredMap } from "../layers/types";
import DataLayers from "../components/side-panels/DataLayers";

const mockDispatchLayerAction = vi.fn();
const mockEnableLayerWithParams = vi.fn();
const mockClearSelectedHillslope = vi.fn();

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
    clearSelectedHillslope: mockClearSelectedHillslope,
  }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    cancelQueries: vi.fn(),
  }),
}));

vi.mock("@tanstack/react-router", () => ({
  useParams: () => ({ webcloudRunId: "test-run" }),
}));

vi.mock("../hooks/useRhessysSpatialInputs", () => ({
  useRhessysSpatialInputs: () => ({
    files: [],
    isLoading: false,
    hasData: false,
  }),
}));

describe("DataLayers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDesired = JSON.parse(JSON.stringify(INITIAL_DESIRED));
  });

  it("renders the Watershed Models & Data heading", () => {
    render(<DataLayers />);
    expect(screen.getByText("Watershed Models & Data")).toBeInTheDocument();
  });

  it("renders all three accordion headers", () => {
    render(<DataLayers />);
    expect(screen.getByText("WEPP")).toBeInTheDocument();
    expect(screen.getByText("RHESSys")).toBeInTheDocument();
    expect(screen.getByText("Watershed Data")).toBeInTheDocument();
  });

  it("shows WEPP layer options when WEPP accordion is expanded", () => {
    render(<DataLayers />);
    fireEvent.click(screen.getByText("WEPP"));

    expect(screen.getByText("Subcatchments")).toBeInTheDocument();
    expect(screen.getByText("Channels")).toBeInTheDocument();
  });

  it("shows Watershed Data options when expanded", () => {
    render(<DataLayers />);
    fireEvent.click(screen.getByText("Watershed Data"));

    expect(screen.getByText("Land Use (2025)")).toBeInTheDocument();
    expect(screen.getByText("Vegetation Cover")).toBeInTheDocument();
    expect(screen.getByText("Soil Burn Severity")).toBeInTheDocument();
  });

  it("dispatches TOGGLE for subcatchment checkbox", () => {
    render(<DataLayers />);
    fireEvent.click(screen.getByText("WEPP"));

    const subcatchmentBox = document.querySelector(
      "input#subcatchment",
    ) as HTMLInputElement;
    expect(subcatchmentBox).toBeTruthy();

    fireEvent.click(subcatchmentBox);
    expect(mockDispatchLayerAction).toHaveBeenCalledWith({
      type: "TOGGLE",
      id: "subcatchment",
      on: true,
    });
  });

  it("dispatches TOGGLE for channels checkbox", () => {
    render(<DataLayers />);
    fireEvent.click(screen.getByText("WEPP"));

    const channelsBox = document.querySelector(
      "input#channels",
    ) as HTMLInputElement;
    expect(channelsBox).toBeTruthy();

    fireEvent.click(channelsBox);
    expect(mockDispatchLayerAction).toHaveBeenCalledWith({
      type: "TOGGLE",
      id: "channels",
      on: true,
    });
  });

  it("dispatches TOGGLE for landuse checkbox", () => {
    render(<DataLayers />);
    fireEvent.click(screen.getByText("Watershed Data"));

    const landuseBox = document.querySelector(
      "input#landuse",
    ) as HTMLInputElement;
    expect(landuseBox).toBeTruthy();

    fireEvent.click(landuseBox);
    expect(mockDispatchLayerAction).toHaveBeenCalledWith({
      type: "TOGGLE",
      id: "landuse",
      on: true,
    });
  });

  it("enables choropleth via enableLayerWithParams when vegetation cover is checked", () => {
    render(<DataLayers />);
    fireEvent.click(screen.getByText("Watershed Data"));

    const vegBox = document.querySelector(
      "input#vegetationCover",
    ) as HTMLInputElement;
    expect(vegBox).toBeTruthy();

    fireEvent.click(vegBox);
    expect(mockEnableLayerWithParams).toHaveBeenCalledWith("choropleth", {
      metric: "vegetationCover",
    });
  });

  it("disables subcatchment checkbox when a dependent layer is enabled", () => {
    mockDesired = {
      ...INITIAL_DESIRED,
      subcatchment: { ...INITIAL_DESIRED.subcatchment, enabled: true },
      landuse: { ...INITIAL_DESIRED.landuse, enabled: true },
    };

    render(<DataLayers />);
    fireEvent.click(screen.getByText("WEPP"));

    const subcatchmentBox = document.querySelector(
      "input#subcatchment",
    ) as HTMLInputElement;
    expect(subcatchmentBox).toBeTruthy();
    expect(subcatchmentBox.disabled).toBe(true);
  });
});
