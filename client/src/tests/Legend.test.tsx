import { fireEvent, render, screen } from "@testing-library/react";
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
            render(<LegendControl />);
            const legendButton = screen.getByRole("button", { name: /open legend/i });
            fireEvent.click(legendButton);
            expect(screen.getByText("Tier 1 watersheds")).toBeInTheDocument();
            expect(screen.getByText("Tier 2 watersheds")).toBeInTheDocument();
        });
    });

    describe("interactions", () => {
        it("shows toast error when show icons are clicked", () => {
            render(<LegendControl />);
            const legendButton = screen.getByRole("button", { name: /open legend/i });
            fireEvent.click(legendButton);

            const showIcons = screen.getAllByRole("button", { name: /show tier/i });

            showIcons.forEach((icon) => {
                fireEvent.click(icon);
                expect(toastErrorMock).toHaveBeenCalledWith('Feature not implemented yet');
            });
        });

        it("shows toast error when hide icons are clicked", () => {
            render(<LegendControl />);
            const legendButton = screen.getByRole("button", { name: /open legend/i });
            fireEvent.click(legendButton);

            const hideIcons = screen.getAllByRole("button", { name: /hide tier/i });

            hideIcons.forEach((icon) => {
                fireEvent.click(icon);
                expect(toastErrorMock).toHaveBeenCalledWith('Feature not implemented yet');
            });
        });
    });
});