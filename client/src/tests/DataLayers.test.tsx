import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { INITIAL_DESIRED, INITIAL_RUNTIME } from "../layers/rules";

const mockDispatchLayerAction = vi.fn();
const mockClearSelectedHillslope = vi.fn();

vi.mock("../contexts/WatershedContext", () => ({
  useWatershed: () => ({
    layerDesired: INITIAL_DESIRED,
    layerRuntime: INITIAL_RUNTIME,
    dispatchLayerAction: mockDispatchLayerAction,
    clearSelectedHillslope: mockClearSelectedHillslope,
  }),
}));

vi.mock("../components/map/controls/DataLayers/DataLayersTabContent", () => ({
  default: ({
    activeTab,
    handleToggle,
  }: {
    activeTab: string;
    handleToggle: (id: string, checked: boolean) => void;
  }) => (
    <div role="tabpanel" aria-label="Data layers tab content">
      <span>{activeTab}</span>
      <label>
        Subcatchments
        <input
          aria-label="subcatchment"
          type="checkbox"
          id="subcatchment"
          onChange={(e) => handleToggle(e.target.id, e.target.checked)}
        />
      </label>
      <label>
        Channels
        <input
          aria-label="channels"
          type="checkbox"
          id="channels"
          onChange={(e) => handleToggle(e.target.id, e.target.checked)}
        />
      </label>
      <label>
        Land Use
        <input
          aria-label="landuse"
          type="checkbox"
          id="landuse"
          onChange={(e) => handleToggle(e.target.id, e.target.checked)}
        />
      </label>
    </div>
  ),
}));

import DataLayersControl from "../components/map/controls/DataLayers/DataLayers";

describe("DataLayersControl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with panel open by default", () => {
    render(<DataLayersControl />);
    // Panel is open by default
    expect(screen.getByRole("tabpanel")).toBeInTheDocument();
    expect(screen.getByRole("tabpanel")).toHaveTextContent("WEPP");
  });

  it("closes when clicking the header", () => {
    render(<DataLayersControl />);
    // Panel starts open
    expect(screen.getByRole("tabpanel")).toBeInTheDocument();

    // Click header to close
    fireEvent.click(screen.getAllByText(/WEPP/i)[0]);
    expect(screen.queryByRole("tabpanel")).not.toBeInTheDocument();
  });

  it("switches active tab when clicking a nav tab", () => {
    const { container } = render(<DataLayersControl />);

    const watershedTab = container.querySelector(
      '[data-layer-tab="Watershed Data"]',
    );
    expect(watershedTab).toBeTruthy();

    if (watershedTab) {
      fireEvent.click(watershedTab);
    }

    const tabpanel = screen.getByRole("tabpanel");
    expect(tabpanel).toHaveTextContent("Watershed Data");
  });

  it("handles subcatchment toggle", () => {
    render(<DataLayersControl />);
    // Panel is open by default, no need to click header

    const sub = screen.getByLabelText("subcatchment") as HTMLInputElement;

    // Check
    fireEvent.click(sub);
    expect(mockDispatchLayerAction).toHaveBeenCalledWith({
      type: "TOGGLE",
      id: "subcatchment",
      on: true,
    });
    expect(mockClearSelectedHillslope).not.toHaveBeenCalled();

    // Uncheck
    fireEvent.click(sub);
    expect(mockDispatchLayerAction).toHaveBeenCalledWith({
      type: "TOGGLE",
      id: "subcatchment",
      on: false,
    });
    // Panel closes automatically: subcatchment off → choropleth blocked → isEffective false
    expect(mockClearSelectedHillslope).toHaveBeenCalledTimes(1);
  });

  it("handles channels toggle", () => {
    render(<DataLayersControl />);
    // Panel is open by default

    const channelsBox = screen.getByLabelText("channels") as HTMLInputElement;

    fireEvent.click(channelsBox);
    expect(mockDispatchLayerAction).toHaveBeenCalledWith({
      type: "TOGGLE",
      id: "channels",
      on: true,
    });

    fireEvent.click(channelsBox);
    expect(mockDispatchLayerAction).toHaveBeenCalledWith({
      type: "TOGGLE",
      id: "channels",
      on: false,
    });
  });

  it("handles landuse toggle via rule engine", () => {
    render(<DataLayersControl />);
    // Panel is open by default

    const landuseBox = screen.getByLabelText("landuse") as HTMLInputElement;

    // Enable — rule engine auto-enables subcatchment
    fireEvent.click(landuseBox);
    expect(mockDispatchLayerAction).toHaveBeenCalledWith({
      type: "TOGGLE",
      id: "landuse",
      on: true,
    });
  });
});
