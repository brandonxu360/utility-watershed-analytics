import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAppStore } from "../store/store";
import type { ChangeEvent } from "react";

vi.mock("../components/map/controls/DataLayers/DataLayersTabContent", () => ({
  default: ({
    activeTab,
    handleChange,
  }: {
    activeTab: string;
    handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  }) => (
    <div role="tabpanel" aria-label="Data layers tab content">
      <span>{activeTab}</span>
      <label>
        Subcatchments
        <input
          aria-label="subcatchment"
          type="checkbox"
          id="subcatchment"
          onChange={handleChange}
        />
      </label>
      <label>
        Channels
        <input
          aria-label="channels"
          type="checkbox"
          id="channels"
          onChange={handleChange}
        />
      </label>
      <label>
        Land Use
        <input
          aria-label="landuse"
          type="checkbox"
          id="landuse"
          onChange={handleChange}
        />
      </label>
      <label>
        Vegetation Cover
        <input
          aria-label="vegetationCover"
          type="checkbox"
          id="vegetationCover"
          onChange={handleChange}
        />
      </label>
    </div>
  ),
}));

import DataLayersControl from "../components/map/controls/DataLayers/DataLayers";

describe("DataLayersControl", () => {
  const setSubcatchment = vi.fn();
  const setChannels = vi.fn();
  const setActiveDataLayer = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({
      activeDataLayer: "none",
      subcatchment: false,
      channels: false,
      setSubcatchment,
      setChannels,
      setActiveDataLayer,
    });
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
    expect(setSubcatchment).toHaveBeenCalledWith(true);

    // Uncheck
    fireEvent.click(sub);
    expect(setSubcatchment).toHaveBeenCalledWith(false);
  });

  it("handles channels toggle", () => {
    render(<DataLayersControl />);
    // Panel is open by default

    const channelsBox = screen.getByLabelText("channels") as HTMLInputElement;

    fireEvent.click(channelsBox);
    expect(setChannels).toHaveBeenCalledWith(true);

    fireEvent.click(channelsBox);
    expect(setChannels).toHaveBeenCalledWith(false);
  });

  it("handles landuse toggle", () => {
    render(<DataLayersControl />);
    // Panel is open by default

    const landuseBox = screen.getByLabelText("landuse") as HTMLInputElement;

    // Enable
    fireEvent.click(landuseBox);
    expect(setActiveDataLayer).toHaveBeenCalledWith("landuse");

    // Disable
    fireEvent.click(landuseBox);
    expect(setActiveDataLayer).toHaveBeenCalledWith("none");
  });

  it("handles vegetation toggle", () => {
    render(<DataLayersControl />);
    // Panel is open by default

    const vegBox = screen.getByLabelText("vegetationCover") as HTMLInputElement;

    // Enable
    fireEvent.click(vegBox);
    expect(setActiveDataLayer).toHaveBeenCalledWith("vegetationCover");

    // Disable
    fireEvent.click(vegBox);
    expect(setActiveDataLayer).toHaveBeenCalledWith("none");
  });
});
