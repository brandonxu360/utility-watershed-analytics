import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import LayersControl from "../components/map/controls/Layers";

type LayerId = "Satellite" | "Topographic";

type LayersControlProps = {
    selectedLayerId: LayerId;
    setSelectedLayerId: (id: LayerId) => void;
};

const renderLayers = (opts?: LayersControlProps) => {
    const selectedLayerId: LayerId = opts?.selectedLayerId ?? "Satellite";
    const setSelectedLayerId = opts?.setSelectedLayerId ?? vi.fn();

    render(
        <LayersControl
            selectedLayerId={selectedLayerId}
            setSelectedLayerId={setSelectedLayerId}
        />
    );

    return { selectedLayerId, setSelectedLayerId };
};

describe("Layers Component Tests", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    describe("rendering", () => {
        it("renders without crashing", () => {
            renderLayers();
        });

        it("renders a button with 'Open layers' when closed", () => {
            renderLayers();
            const button = screen.getByRole("button", { name: /open layers/i });
            expect(button).toBeInTheDocument();
            expect(button).toHaveAttribute("title", "Open layers");
        });

        it("does not render the modal when closed", () => {
            renderLayers();
            expect(screen.queryByText("Map Layer")).not.toBeInTheDocument();
        });
    });

    describe("interactions", () => {
        it("opens the modal when clicking the button", () => {
            renderLayers();

            fireEvent.click(screen.getByRole("button", { name: /open layers/i }));

            expect(screen.getByText("Map Layer")).toBeInTheDocument();
            const closeButton = screen.getByRole("button", { name: /close layers/i });
            expect(closeButton).toHaveAttribute("title", "Close layers");
        });

        it("closes the modal when clicking the button again", () => {
            renderLayers();

            const openButton = screen.getByRole("button", { name: /open layers/i });
            fireEvent.click(openButton);
            expect(screen.getByText("Map Layer")).toBeInTheDocument();

            const closeButton = screen.getByRole("button", { name: /close layers/i });
            fireEvent.click(closeButton);
            expect(screen.queryByText("Map Layer")).not.toBeInTheDocument();
        });

        it("shows the correct radio checked state for the selected layer", () => {
            const setSelectedLayerId = vi.fn();
            renderLayers({ selectedLayerId: "Satellite", setSelectedLayerId });
            fireEvent.click(screen.getByRole("button", { name: /open layers/i }));

            const satellite = screen.getByLabelText("Satellite") as HTMLInputElement;
            const topo = screen.getByLabelText("Topographic") as HTMLInputElement;
            expect(satellite.checked).toBe(true);
            expect(topo.checked).toBe(false);
        });

        it("calls setSelectedLayerId when a different layer is selected", () => {
            const setSelectedLayerId = vi.fn();
            renderLayers({ selectedLayerId: "Satellite", setSelectedLayerId });
            fireEvent.click(screen.getByRole("button", { name: /open layers/i }));

            fireEvent.click(screen.getByLabelText("Topographic"));
            expect(setSelectedLayerId).toHaveBeenCalledWith("Topographic");
        });

        it("does not call setSelectedLayerId when re-selecting the already-selected layer", () => {
            const setSelectedLayerId = vi.fn();
            renderLayers({ selectedLayerId: "Satellite", setSelectedLayerId });
            fireEvent.click(screen.getByRole("button", { name: /open layers/i }));

            fireEvent.click(screen.getByLabelText("Satellite"));
            expect(setSelectedLayerId).not.toHaveBeenCalled();
        });
    });
});