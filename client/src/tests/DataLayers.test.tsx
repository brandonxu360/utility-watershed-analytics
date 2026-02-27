import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAppStore } from "../store/store";
import { INITIAL_DESIRED, INITIAL_RUNTIME } from "../layers/rules";

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
  const mockDispatchLayerAction = vi.fn();
  const clearSelectedHillslope = vi.fn();
  const closePanel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({
      layerDesired: INITIAL_DESIRED,
      layerRuntime: INITIAL_RUNTIME,
      dispatchLayerAction: mockDispatchLayerAction,
      clearSelectedHillslope,
      closePanel,
    });
  });

  it("renders and is closed by default", () => {
    render(<DataLayersControl />);
    expect(screen.getByText(/Data Layers/i)).toBeInTheDocument();
    expect(screen.queryByRole("tabpanel")).not.toBeInTheDocument();
  });

  it("opens when clicking the header and shows default active tab", () => {
    render(<DataLayersControl />);
    fireEvent.click(screen.getByText(/Data Layers/i));

    const tabpanel = screen.getByRole("tabpanel");
    expect(tabpanel).toBeInTheDocument();
    expect(tabpanel).toHaveTextContent("WEPP Hillslopes");
  });

  it("switches active tab when clicking a nav tab", () => {
    const { container } = render(<DataLayersControl />);
    fireEvent.click(screen.getByText(/Data Layers/i));

    const surfaceTab = container.querySelector(
      '[data-layer-tab="Surface Data"]',
    );
    expect(surfaceTab).toBeTruthy();

    if (surfaceTab) {
      fireEvent.click(surfaceTab);
    }

    const tabpanel = screen.getByRole("tabpanel");
    expect(tabpanel).toHaveTextContent("Surface Data");
  });

  it("handles subcatchment toggle and performs cleanup on uncheck", () => {
    render(<DataLayersControl />);
    fireEvent.click(screen.getByText(/Data Layers/i));

    const sub = screen.getByLabelText("subcatchment") as HTMLInputElement;

    // Check
    fireEvent.click(sub);
    expect(mockDispatchLayerAction).toHaveBeenCalledWith({
      type: "TOGGLE",
      id: "subcatchment",
      on: true,
    });
    expect(closePanel).not.toHaveBeenCalled();
    expect(clearSelectedHillslope).not.toHaveBeenCalled();

    // Uncheck
    fireEvent.click(sub);
    expect(mockDispatchLayerAction).toHaveBeenCalledWith({
      type: "TOGGLE",
      id: "subcatchment",
      on: false,
    });
    expect(closePanel).toHaveBeenCalledTimes(1);
    expect(clearSelectedHillslope).toHaveBeenCalledTimes(1);
  });

  it("handles channels toggle", () => {
    render(<DataLayersControl />);
    fireEvent.click(screen.getByText(/Data Layers/i));

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
    fireEvent.click(screen.getByText(/Data Layers/i));

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
