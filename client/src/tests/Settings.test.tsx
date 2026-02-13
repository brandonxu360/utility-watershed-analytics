import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { toast } from "react-toastify";
import Settings from "../components/map/controls/Settings";

vi.mock("react-toastify", () => ({
    toast: {
        error: vi.fn(),
    },
}));

const toastErrorMock = vi.mocked(toast.error);

describe("Settings Component Tests", () => {
    describe("rendering", () => {
        it("renders without crashing", () => {
            render(<Settings />);
        });

        it("displays toast error when clicked", () => {
            const { getByRole } = render(<Settings />);
            const button = getByRole("button", { name: /Open settings/i });

            button.click();

            expect(toastErrorMock).toHaveBeenCalledWith('Feature not implemented yet');
        });
    });
});