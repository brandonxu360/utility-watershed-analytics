import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LegendControl from "../components/map/controls/Legend/Legend";

const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => { });

describe("Legend Component Tests", () => {
    describe("rendering", () => {
        it("renders without crashing", () => {
            render(<LegendControl />);
        });

        it("renders the open legend container", () => {
            const { getByTestId } = render(<LegendControl />);
            const legendButton = getByTestId("legend-toggle-button");
            fireEvent.click(legendButton);
            expect(getByTestId("legend-container")).toBeInTheDocument();
        });
    });

    describe("interactions", () => {
        it("shows alert when show icons are clicked", () => {
            const { getByTestId } = render(<LegendControl />);
            const legendButton = getByTestId("legend-toggle-button");
            fireEvent.click(legendButton);

            const tier1Icons = [
                getByTestId("tier1-show-icon"),
                getByTestId("tier2-show-icon"),
            ];

            tier1Icons.forEach((icon) => {
                fireEvent.click(icon);
                expect(alertMock).toHaveBeenCalledWith(expect.stringContaining('Show only icon clicked'));
            });
        });

        it("shows alert when hide icons are clicked", () => {
            const { getByTestId } = render(<LegendControl />);
            const legendButton = getByTestId("legend-toggle-button");
            fireEvent.click(legendButton);

            const tier2Icons = [
                getByTestId("tier1-hide-icon"),
                getByTestId("tier2-hide-icon"),
            ];

            tier2Icons.forEach((icon) => {
                fireEvent.click(icon);
                expect(alertMock).toHaveBeenCalledWith(expect.stringContaining('Hide icon clicked'));
            });
        });
    });
});