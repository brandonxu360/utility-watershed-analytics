import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { toast } from "react-toastify";
import Legend from "../components/map/controls/Legend";

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
            render(<Legend />);
        });

        it("renders the open legend container", () => {
            render(<Legend />);
            const legendButton = screen.getByRole("button", { name: /open legend/i });
            fireEvent.click(legendButton);
            expect(screen.getByText("Tier 1 watersheds")).toBeInTheDocument();
            expect(screen.getByText("Tier 2 watersheds")).toBeInTheDocument();
        });
    });

    describe("interactions", () => {
        it("shows toast error when show icons are clicked", () => {
            render(<Legend />);
            const legendButton = screen.getByRole("button", { name: /open legend/i });
            fireEvent.click(legendButton);

            const showIcons = screen.getAllByRole("button", { name: /show tier/i });

            showIcons.forEach((icon) => {
                fireEvent.click(icon);
                expect(toastErrorMock).toHaveBeenCalledWith('Feature not implemented yet');
            });
        });
    });
});