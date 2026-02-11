import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChoroplethScale } from "../components/ChoroplethScale";

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

describe("ChoroplethScale", () => {
    const defaultProps = {
        colormap: "viridis",
        range: { min: 0, max: 100 },
        unit: "mm",
    };

    describe("rendering", () => {
        it("renders without crashing", () => {
            render(<ChoroplethScale {...defaultProps} />);
            expect(screen.getByText("mm")).toBeInTheDocument();
        });

        it("renders the unit label", () => {
            render(<ChoroplethScale {...defaultProps} unit="kg/m²" />);
            expect(screen.getByText("kg/m²")).toBeInTheDocument();
        });

        it("renders min, mid, and max labels", () => {
            render(<ChoroplethScale {...defaultProps} range={{ min: 0, max: 100 }} />);
            expect(screen.getByText("0.000")).toBeInTheDocument();
            expect(screen.getByText("50.00")).toBeInTheDocument();
            expect(screen.getByText("100.0")).toBeInTheDocument();
        });

        it("applies custom styles when provided", () => {
            const customStyle = { backgroundColor: "red", padding: "10px" };
            render(
                <ChoroplethScale {...defaultProps} style={customStyle} />
            );
            const legendDiv = screen.getByTestId("choropleth-legend");
            expect(legendDiv).toHaveStyle("background-color: rgb(255, 0, 0)");
            expect(legendDiv).toHaveStyle("padding: 10px");
        });

        it("renders gradient div with correct classes", () => {
            render(<ChoroplethScale {...defaultProps} />);
            const gradientDiv = screen.getByTestId("choropleth-gradient");
            expect(gradientDiv).toBeInTheDocument();
            expect(gradientDiv).toHaveStyle("height: 20px");
            expect(gradientDiv).toHaveStyle("border-radius: 4px");
        });
    });

    describe("formatValue function", () => {
        it("formats values >= 1000 with 0 decimal places", () => {
            render(<ChoroplethScale {...defaultProps} range={{ min: 1000, max: 5000 }} />);
            expect(screen.getByText("1000")).toBeInTheDocument();
            expect(screen.getByText("3000")).toBeInTheDocument();
            expect(screen.getByText("5000")).toBeInTheDocument();
        });

        it("formats values >= 100 with 1 decimal place", () => {
            render(<ChoroplethScale {...defaultProps} range={{ min: 100, max: 500 }} />);
            expect(screen.getByText("100.0")).toBeInTheDocument();
            expect(screen.getByText("300.0")).toBeInTheDocument();
            expect(screen.getByText("500.0")).toBeInTheDocument();
        });

        it("formats values >= 10 with 2 decimal places", () => {
            render(<ChoroplethScale {...defaultProps} range={{ min: 10, max: 50 }} />);
            expect(screen.getByText("10.00")).toBeInTheDocument();
            expect(screen.getByText("30.00")).toBeInTheDocument();
            expect(screen.getByText("50.00")).toBeInTheDocument();
        });

        it("formats values < 10 with 3 decimal places", () => {
            render(<ChoroplethScale {...defaultProps} range={{ min: 0, max: 5 }} />);
            expect(screen.getByText("0.000")).toBeInTheDocument();
            expect(screen.getByText("2.500")).toBeInTheDocument();
            expect(screen.getByText("5.000")).toBeInTheDocument();
        });

        it("handles negative values correctly", () => {
            render(<ChoroplethScale {...defaultProps} range={{ min: -100, max: 100 }} />);
            expect(screen.getByText("-100.0")).toBeInTheDocument();
            expect(screen.getByText("0.000")).toBeInTheDocument();
            expect(screen.getByText("100.0")).toBeInTheDocument();
        });

        it("handles large negative values", () => {
            render(<ChoroplethScale {...defaultProps} range={{ min: -5000, max: -1000 }} />);
            expect(screen.getByText("-5000")).toBeInTheDocument();
            expect(screen.getByText("-3000")).toBeInTheDocument();
            expect(screen.getByText("-1000")).toBeInTheDocument();
        });
    });

    describe("different colormap options", () => {
        it("renders with jet colormap", () => {
            render(<ChoroplethScale {...defaultProps} colormap="jet" />);
            expect(screen.getByText("mm")).toBeInTheDocument();
        });

        it("renders with plasma colormap", () => {
            render(<ChoroplethScale {...defaultProps} colormap="plasma" />);
            expect(screen.getByText("mm")).toBeInTheDocument();
        });
    });

    describe("edge cases", () => {
        it("handles zero range (min === max)", () => {
            render(<ChoroplethScale {...defaultProps} range={{ min: 50, max: 50 }} />);
            // All three labels should show the same value
            const labels = screen.getAllByText("50.00");
            expect(labels).toHaveLength(3);
        });

        it("handles very small decimal values", () => {
            render(<ChoroplethScale {...defaultProps} range={{ min: 0.001, max: 0.009 }} />);
            expect(screen.getByText("0.001")).toBeInTheDocument();
            expect(screen.getByText("0.005")).toBeInTheDocument();
            expect(screen.getByText("0.009")).toBeInTheDocument();
        });

        it("handles very large values", () => {
            render(<ChoroplethScale {...defaultProps} range={{ min: 10000, max: 50000 }} />);
            expect(screen.getByText("10000")).toBeInTheDocument();
            expect(screen.getByText("30000")).toBeInTheDocument();
            expect(screen.getByText("50000")).toBeInTheDocument();
        });

        it("handles empty unit string", () => {
            render(<ChoroplethScale {...defaultProps} unit="" />);
            // Unit div should still render but be empty
            const unitDiv = screen.getByTestId("choropleth-unit");
            expect(unitDiv).toBeInTheDocument();
        });
    });

    describe("gradient generation", () => {
        it("renders gradient with background style", () => {
            render(<ChoroplethScale {...defaultProps} />);
            const gradientDiv = screen.getByTestId("choropleth-gradient");
            const style = window.getComputedStyle(gradientDiv);
            expect(style.background).toContain("linear-gradient");
        });
    });

    describe("label styling", () => {
        it("renders labels container with flex layout", () => {
            render(<ChoroplethScale {...defaultProps} />);
            const labelsDiv = screen.getByTestId("choropleth-labels");
            expect(labelsDiv).toBeInTheDocument();
            expect(labelsDiv).toHaveStyle("display: flex");
            expect(labelsDiv).toHaveStyle("justify-content: space-between");
        });

        it("renders unit with correct styling", () => {
            render(<ChoroplethScale {...defaultProps} />);
            const unitElement = screen.getByText("mm");
            expect(unitElement).toHaveStyle("text-align: center");
            expect(unitElement).toHaveStyle("font-size: 0.75rem");
        });
    });
});
