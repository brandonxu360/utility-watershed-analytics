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
        <div data-testid="tab-content">
            <div data-testid="active-tab">{activeTab}</div>
            <label>
                Subcatchments
                <input aria-label="subcatchment" type="checkbox" id="subcatchment" onChange={handleChange} />
            </label>
            <label>
                Channels
                <input aria-label="channels" type="checkbox" id="channels" onChange={handleChange} />
            </label>
            <label>
                Land Use
                <input aria-label="landuse" type="checkbox" id="landuse" onChange={handleChange} />
            </label>
        </div>
    ),
}));

import DataLayersControl from "../components/map/controls/DataLayers/DataLayers";

describe("DataLayersControl", () => {
    const setSubcatchment = vi.fn();
    const setChannels = vi.fn();
    const setLanduse = vi.fn();
    const clearSelectedHillslope = vi.fn();
    const closePanel = vi.fn();
    const resetOverlays = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        useAppStore.setState({
            subcatchment: false,
            channels: false,
            landuse: false,
            setSubcatchment,
            setChannels,
            setLanduse,
            clearSelectedHillslope,
            closePanel,
            resetOverlays,
        });
    });

    it("renders and is closed by default", () => {
        render(<DataLayersControl />);
        expect(screen.getByText(/Data Layers/i)).toBeInTheDocument();
        expect(screen.queryByTestId("tab-content")).not.toBeInTheDocument();
    });

    it("opens when clicking the header and shows default active tab", () => {
        render(<DataLayersControl />);
        fireEvent.click(screen.getByText(/Data Layers/i));

        expect(screen.getByTestId("tab-content")).toBeInTheDocument();
        expect(screen.getByTestId("active-tab")).toHaveTextContent("Hill Slopes");
    });

    it("switches active tab when clicking a nav tab", () => {
        const { container } = render(<DataLayersControl />);
        fireEvent.click(screen.getByText(/Data Layers/i));

        const surfaceTab = container.querySelector('[data-layer-tab="Surface Data"]');
        expect(surfaceTab).toBeTruthy();

        if (surfaceTab) {
            fireEvent.click(surfaceTab);
        }

        expect(screen.getByTestId("active-tab")).toHaveTextContent("Surface Data");
    });

    it("handles subcatchment toggle and performs cleanup on uncheck", () => {
        render(<DataLayersControl />);
        fireEvent.click(screen.getByText(/Data Layers/i));

        const sub = screen.getByLabelText("subcatchment") as HTMLInputElement;

        // Check
        fireEvent.click(sub);
        expect(setSubcatchment).toHaveBeenCalledWith(true);
        expect(closePanel).not.toHaveBeenCalled();
        expect(clearSelectedHillslope).not.toHaveBeenCalled();
        expect(setLanduse).not.toHaveBeenCalled();

        // Uncheck
        fireEvent.click(sub);
        expect(setSubcatchment).toHaveBeenCalledWith(false);
        expect(closePanel).toHaveBeenCalledTimes(1);
        expect(setLanduse).toHaveBeenCalledWith(false);
        expect(clearSelectedHillslope).toHaveBeenCalledTimes(1);
    });

    it("handles channels toggle", () => {
        render(<DataLayersControl />);
        fireEvent.click(screen.getByText(/Data Layers/i));

        const channelsBox = screen.getByLabelText("channels") as HTMLInputElement;

        fireEvent.click(channelsBox);
        expect(setChannels).toHaveBeenCalledWith(true);

        fireEvent.click(channelsBox);
        expect(setChannels).toHaveBeenCalledWith(false);
    });

    it("handles landuse toggle and calls resetOverlays when turned off", () => {
        render(<DataLayersControl />);
        fireEvent.click(screen.getByText(/Data Layers/i));

        const landuseBox = screen.getByLabelText("landuse") as HTMLInputElement;

        // Enable
        fireEvent.click(landuseBox);
        expect(setSubcatchment).toHaveBeenCalledWith(true);
        expect(setLanduse).toHaveBeenCalledWith(true);
        expect(resetOverlays).not.toHaveBeenCalled();

        // Disable
        fireEvent.click(landuseBox);
        expect(setSubcatchment).toHaveBeenCalledWith(false);
        expect(setLanduse).toHaveBeenCalledWith(false);
        expect(resetOverlays).toHaveBeenCalledTimes(1);
    });
});
