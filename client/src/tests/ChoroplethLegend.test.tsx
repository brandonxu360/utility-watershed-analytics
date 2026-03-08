import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ChoroplethLegend from "../components/map/controls/ChoroplethLegend";

vi.mock("../utils/colormap", () => ({
    createColormap: vi.fn(() => [
        "#440154",
        "#482878",
        "#3e4989",
        "#31688e",
        "#26828e",
        "#1f9e89",
        "#35b779",
        "#6ece58",
        "#b5de2b",
        "#fde725",
    ]),
}));

describe("ChoroplethLegend", () => {
    describe("colormap mode", () => {
        const defaultProps = {
            title: "Vegetation Cover",
            data: {
                mode: "colormap" as const,
                colormap: "viridis",
                range: { min: 0, max: 100 },
                unit: "% cover",
            },
        };

        it("renders title", () => {
            render(<ChoroplethLegend {...defaultProps} />);
            expect(screen.getByText("Vegetation Cover")).toBeInTheDocument();
        });

        it("renders min, mid, and max labels", () => {
            render(<ChoroplethLegend {...defaultProps} />);
            expect(screen.getByText("0")).toBeInTheDocument();
            expect(screen.getByText("50")).toBeInTheDocument();
            expect(screen.getByText("100")).toBeInTheDocument();
        });

        it("renders the unit label", () => {
            render(<ChoroplethLegend {...defaultProps} />);
            expect(screen.getByText("% cover")).toBeInTheDocument();
        });

        it("renders gradient bar", () => {
            render(<ChoroplethLegend {...defaultProps} />);
            const gradient = screen.getByTestId("choropleth-gradient");
            expect(gradient).toBeInTheDocument();
        });

        it("renders the legend wrapper with correct aria label", () => {
            render(<ChoroplethLegend {...defaultProps} />);
            expect(
                screen.getByRole("region", { name: /choropleth legend/i }),
            ).toBeInTheDocument();
        });

        it("renders with different colormap", () => {
            render(
                <ChoroplethLegend
                    title="Sediment Yield"
                    data={{
                        mode: "colormap",
                        colormap: "jet2",
                        range: { min: 0, max: 500 },
                        unit: "kg",
                    }}
                />,
            );
            expect(screen.getByText("Sediment Yield")).toBeInTheDocument();
            expect(screen.getByText("500")).toBeInTheDocument();
        });

        it("auto-scales kg to tonnes for large values", () => {
            render(
                <ChoroplethLegend
                    title="Sediment Yield"
                    data={{
                        mode: "colormap",
                        colormap: "viridis",
                        range: { min: 0, max: 500000 },
                        unit: "kg",
                    }}
                />,
            );
            expect(screen.getByText("500")).toBeInTheDocument();
            expect(screen.getByText("t")).toBeInTheDocument();
        });
    });

    describe("categorical mode", () => {
        it("renders categorical swatches", () => {
            render(
                <ChoroplethLegend
                    title="Land Type"
                    data={{
                        mode: "categorical",
                        entries: [
                            { value: "Forest", hex: "#228B22" },
                            { value: "Water", hex: "#0000FF" },
                            { value: "Urban", hex: "#808080" },
                        ],
                    }}
                />,
            );
            expect(screen.getByText("Land Type")).toBeInTheDocument();
            expect(screen.getByText("Forest")).toBeInTheDocument();
            expect(screen.getByText("Water")).toBeInTheDocument();
            expect(screen.getByText("Urban")).toBeInTheDocument();
        });

        it("renders numeric categorical values", () => {
            render(
                <ChoroplethLegend
                    title="Categories"
                    data={{
                        mode: "categorical",
                        entries: [
                            { value: 1, hex: "#FF0000" },
                            { value: 2, hex: "#00FF00" },
                        ],
                    }}
                />,
            );
            expect(screen.getByText("1")).toBeInTheDocument();
            expect(screen.getByText("2")).toBeInTheDocument();
        });
    });

    describe("stops mode", () => {
        it("renders gradient from explicit stops", () => {
            render(
                <ChoroplethLegend
                    title="Elevation"
                    data={{
                        mode: "stops",
                        stops: [
                            { value: 0, hex: "#0000FF" },
                            { value: 50, hex: "#00FF00" },
                            { value: 100, hex: "#FF0000" },
                        ],
                    }}
                />,
            );
            expect(screen.getByText("Elevation")).toBeInTheDocument();
            expect(screen.getByText("0")).toBeInTheDocument();
            expect(screen.getByText("50")).toBeInTheDocument();
            expect(screen.getByText("100")).toBeInTheDocument();
            expect(screen.getByTestId("choropleth-gradient")).toBeInTheDocument();
        });

        it("does not render gradient with fewer than 2 stops", () => {
            render(
                <ChoroplethLegend
                    title="Single"
                    data={{
                        mode: "stops",
                        stops: [{ value: 0, hex: "#0000FF" }],
                    }}
                />,
            );
            expect(screen.getByText("Single")).toBeInTheDocument();
            expect(
                screen.queryByTestId("choropleth-gradient"),
            ).not.toBeInTheDocument();
        });
    });
});
