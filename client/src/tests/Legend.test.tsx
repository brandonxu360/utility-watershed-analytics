import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { toast } from "react-toastify";
import LegendControl from "../components/map/controls/Legend/Legend";

vi.mock("react-toastify", () => ({
    toast: {
        error: vi.fn(),
    },
}));

const toastErrorMock = vi.mocked(toast.error);

describe("Legend Component Tests", () => {
    beforeEach(() => {
        toastErrorMock.mockClear();
    });

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
        it("shows toast error when show icons are clicked", () => {
            const { getByTestId } = render(<LegendControl />);
            const legendButton = getByTestId("legend-toggle-button");
            fireEvent.click(legendButton);

            const tier1Icons = [
                getByTestId("tier1-show-icon"),
                getByTestId("tier2-show-icon"),
            ];

            tier1Icons.forEach((icon) => {
                fireEvent.click(icon);
                expect(toastErrorMock).toHaveBeenCalledWith('Feature not implemented yet');
            });
        });

        it("shows toast error when hide icons are clicked", () => {
            const { getByTestId } = render(<LegendControl />);
            const legendButton = getByTestId("legend-toggle-button");
            fireEvent.click(legendButton);

            const tier2Icons = [
                getByTestId("tier1-hide-icon"),
                getByTestId("tier2-hide-icon"),
            ];

            tier2Icons.forEach((icon) => {
                fireEvent.click(icon);
                expect(toastErrorMock).toHaveBeenCalledWith('Feature not implemented yet');
            });
        });
    });
});