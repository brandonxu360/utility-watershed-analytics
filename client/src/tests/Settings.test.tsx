import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import Settings from "../components/map/controls/Settings/Settings";

describe("Settings Component Tests", () => {
    describe("rendering", () => {
        it("renders without crashing", () => {
            render(<Settings />);
        });

        it("displays alert when clicked", () => {
            const { getByRole } = render(<Settings />);
            const button = getByRole("button", { name: /Open settings/i });

            // Mock window.alert
            const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => { });

            button.click();

            expect(alertMock).toHaveBeenCalledWith('Settings clicked!');

            alertMock.mockRestore();
        });
    });
});