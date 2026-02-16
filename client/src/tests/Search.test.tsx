import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { toast } from "react-toastify";
import Search from "../components/map/controls/Search";

const mockSetView = vi.fn();

vi.mock("react-leaflet", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-leaflet")>();
  return Object.assign({}, actual, {
    useMap: () => ({ setView: mockSetView }),
  });
});

vi.mock("react-toastify", () => ({
  toast: {
    error: vi.fn(),
  },
}));

const toastErrorMock = vi.mocked(toast.error);

describe("Search Component Tests", () => {
  beforeEach(() => {
    mockSetView.mockClear();
    vi.restoreAllMocks();
  });

  describe("rendering", () => {
    it("renders without crashing", () => {
      render(<Search />);
    });

    it("does not show the search modal by default", () => {
      render(<Search />);
      expect(screen.queryByLabelText("Search bar")).not.toBeInTheDocument();
    });
  });

  describe("interactions", () => {
    it("opens and closes the modal when clicking the search button", () => {
      render(<Search />);

      const toggleButton = screen.getByRole("button", {
        name: /search location/i,
      });
      expect(screen.queryByLabelText("Search bar")).not.toBeInTheDocument();

      fireEvent.click(toggleButton);
      expect(screen.getByLabelText("Search bar")).toBeInTheDocument();

      fireEvent.click(toggleButton);
      expect(screen.queryByLabelText("Search bar")).not.toBeInTheDocument();
    });

    it("calls map.setView with parsed coordinates and closes modal on valid input", () => {
      render(<Search />);

      fireEvent.click(screen.getByRole("button", { name: /search location/i }));
      const input = screen.getByLabelText("Search bar") as HTMLInputElement;

      fireEvent.change(input, { target: { value: "45.5, -120.25" } });
      fireEvent.click(screen.getByRole("button", { name: /go button/i }));

      expect(mockSetView).toHaveBeenCalledTimes(1);
      expect(mockSetView).toHaveBeenCalledWith([45.5, -120.25], 13);

      // Modal should close after successful search
      expect(screen.queryByLabelText("Search bar")).not.toBeInTheDocument();

      // Re-open and ensure input was cleared
      fireEvent.click(screen.getByRole("button", { name: /search location/i }));
      expect(
        (screen.getByLabelText("Search bar") as HTMLInputElement).value,
      ).toBe("");
    });

    it("shows toast error and does not call setView on invalid input", () => {
      render(<Search />);

      fireEvent.click(screen.getByRole("button", { name: /search location/i }));
      fireEvent.change(screen.getByLabelText("Search bar"), {
        target: { value: "not coords" },
      });
      fireEvent.click(screen.getByRole("button", { name: /go button/i }));

      expect(toastErrorMock).toHaveBeenCalledTimes(1);
      expect(toastErrorMock).toHaveBeenCalledWith(
        'Invalid coordinates. Please enter in "latitude, longitude" format.',
      );
      expect(mockSetView).not.toHaveBeenCalled();

      // Modal should stay open on invalid input
      expect(screen.getByLabelText("Search bar")).toBeInTheDocument();
    });
  });
});
