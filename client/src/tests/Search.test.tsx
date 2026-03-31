import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { toast } from "react-toastify";
import Search from "../components/map/controls/Search";
import type { WatershedProperties } from "../types/WatershedProperties";

const mockSetView = vi.fn();
const mockNavigate = vi.fn();
const mockUseRunId = vi.fn<() => string | null>(() => null);

vi.mock("react-leaflet", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-leaflet")>();
  return Object.assign({}, actual, {
    useMap: () => ({
      setView: mockSetView,
    }),
  });
});

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("../hooks/useRunId", () => ({
  useRunId: () => mockUseRunId(),
}));

vi.mock("react-toastify", () => ({
  toast: {
    error: vi.fn(),
  },
}));

const toastErrorMock = vi.mocked(toast.error);

const makeWatershedProps = (
  overrides: Partial<WatershedProperties>,
): WatershedProperties => ({
  pws_id: "",
  srcname: "",
  pws_name: "",
  county_nam: "",
  state: null,
  huc10_id: "",
  huc10_name: "",
  wws_code: "",
  srctype: "",
  shape_leng: 0,
  shape_area: 0,
  owner_type: null,
  pop_group: null,
  treat_type: null,
  conn_group: null,
  huc10_pws_names: null,
  huc10_owner_types: null,
  huc10_pop_groups: null,
  huc10_treat_types: null,
  huc10_utility_count: null,
  ...overrides,
});

const testWatersheds: GeoJSON.FeatureCollection<
  GeoJSON.Geometry,
  WatershedProperties
> = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "gate-creek-001",
      properties: makeWatershedProps({
        pws_name: "South Fork Basin",
        srcname: "Gate Creek",
        huc10_id: "170703010101",
      }),
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-121.8, 44.15],
            [-121.7, 44.15],
            [-121.7, 44.23],
            [-121.8, 44.23],
            [-121.8, 44.15],
          ],
        ],
      },
    },
    {
      type: "Feature",
      id: "clear-creek-001",
      properties: makeWatershedProps({
        pws_name: "Clear Creek",
        srcname: "Clear Creek",
        huc10_id: "170703010102",
      }),
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-121.67, 44.08],
            [-121.58, 44.08],
            [-121.58, 44.16],
            [-121.67, 44.16],
            [-121.67, 44.08],
          ],
        ],
      },
    },
    {
      type: "Feature",
      id: "clear-lake-002",
      properties: makeWatershedProps({
        pws_name: "Clear Lake",
        srcname: "Clear Lake Tributary",
        huc10_id: "170703010103",
      }),
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-121.56, 43.98],
            [-121.48, 43.98],
            [-121.48, 44.06],
            [-121.56, 44.06],
            [-121.56, 43.98],
          ],
        ],
      },
    },
    {
      type: "Feature",
      id: "pine-river-003",
      properties: makeWatershedProps({
        pws_name: "Pine River",
        srcname: "Pine River",
        huc10_id: "170703010104",
      }),
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-121.44, 43.94],
            [-121.36, 43.94],
            [-121.36, 43.98],
            [-121.44, 43.98],
            [-121.44, 43.94],
          ],
        ],
      },
    },
    {
      type: "Feature",
      id: "deer-creek-2",
      properties: makeWatershedProps({
        pws_name: "Deer Creek 2",
        srcname: "North Fork",
        huc10_id: "170703010105",
      }),
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-121.5, 44.0],
            [-121.42, 44.0],
            [-121.42, 44.05],
            [-121.5, 44.05],
            [-121.5, 44.0],
          ],
        ],
      },
    },
  ],
};

describe("Search Component Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRunId.mockReturnValue(null);
  });

  describe("rendering", () => {
    it("renders without crashing", () => {
      render(<Search watersheds={testWatersheds} />);
    });

    it("does not show the search modal by default", () => {
      render(<Search watersheds={testWatersheds} />);
      expect(screen.queryByLabelText("Search bar")).not.toBeInTheDocument();
    });
  });

  describe("interactions", () => {
    it("opens and closes the modal when clicking the search button", () => {
      render(<Search watersheds={testWatersheds} />);

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
      render(<Search watersheds={testWatersheds} />);

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

    it("navigates home before leaving search context on coordinate search from watershed route", () => {
      mockUseRunId.mockReturnValue("gate-creek-001");
      render(<Search watersheds={testWatersheds} />);

      fireEvent.click(screen.getByRole("button", { name: /search location/i }));
      fireEvent.change(screen.getByLabelText("Search bar"), {
        target: { value: "0, 0" },
      });
      fireEvent.click(screen.getByRole("button", { name: /go button/i }));

      expect(mockSetView).toHaveBeenCalledTimes(1);
      expect(mockSetView).toHaveBeenCalledWith([0, 0], 13);
      expect(mockNavigate).toHaveBeenCalledWith({ to: "/" });
    });

    it("shows toast error and does not call setView on invalid coordinate input", () => {
      render(<Search watersheds={testWatersheds} />);

      fireEvent.click(screen.getByRole("button", { name: /search location/i }));
      fireEvent.change(screen.getByLabelText("Search bar"), {
        target: { value: "45," },
      });
      fireEvent.click(screen.getByRole("button", { name: /go button/i }));

      expect(toastErrorMock).toHaveBeenCalledTimes(1);
      expect(toastErrorMock).toHaveBeenCalledWith(
        'Invalid coordinates. Use "latitude, longitude" or "latitude longitude".',
      );
      expect(mockSetView).not.toHaveBeenCalled();

      // Modal should stay open on invalid input
      expect(screen.getByLabelText("Search bar")).toBeInTheDocument();
    });

    it("shows toast error and does not call setView on out-of-range coordinates", () => {
      render(<Search watersheds={testWatersheds} />);

      fireEvent.click(screen.getByRole("button", { name: /search location/i }));
      fireEvent.change(screen.getByLabelText("Search bar"), {
        target: { value: "1000, 1000" },
      });
      fireEvent.click(screen.getByRole("button", { name: /go button/i }));

      expect(toastErrorMock).toHaveBeenCalledTimes(1);
      expect(toastErrorMock).toHaveBeenCalledWith(
        "Invalid coordinate range. Latitude must be between -90 and 90, longitude between -180 and 180.",
      );
      expect(mockSetView).not.toHaveBeenCalled();
      expect(screen.getByLabelText("Search bar")).toBeInTheDocument();
    });

    it("shows a single explicit option for unique watershed matches", () => {
      render(<Search watersheds={testWatersheds} />);

      fireEvent.click(screen.getByRole("button", { name: /search location/i }));
      fireEvent.change(screen.getByLabelText("Search bar"), {
        target: { value: "south fork basin" },
      });
      fireEvent.click(screen.getByRole("button", { name: /go button/i }));

      const options = screen.getAllByRole("option");
      expect(options).toHaveLength(1);
      expect(options[0]).toHaveTextContent("South Fork Basin");
      expect(options[0]).toHaveTextContent("170703010101 • Gate Creek");
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(mockSetView).not.toHaveBeenCalled();
      expect(screen.getByLabelText("Search bar")).toBeInTheDocument();
    });

    it("shows suggestions for multiple watershed matches", () => {
      render(<Search watersheds={testWatersheds} />);

      fireEvent.click(screen.getByRole("button", { name: /search location/i }));
      fireEvent.change(screen.getByLabelText("Search bar"), {
        target: { value: "clear" },
      });
      fireEvent.click(screen.getByRole("button", { name: /go button/i }));

      const options = screen.getAllByRole("option");
      expect(options.length).toBeGreaterThan(1);
      expect(options[0]).toHaveTextContent("Clear Creek");
      expect(options[1]).toHaveTextContent("Clear Lake");
      expect(mockSetView).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("shows no-match toast when watershed query has no hits", () => {
      render(<Search watersheds={testWatersheds} />);

      fireEvent.click(screen.getByRole("button", { name: /search location/i }));
      fireEvent.change(screen.getByLabelText("Search bar"), {
        target: { value: "unknown watershed" },
      });
      fireEvent.click(screen.getByRole("button", { name: /go button/i }));

      expect(toastErrorMock).toHaveBeenCalledTimes(1);
      expect(toastErrorMock).toHaveBeenCalledWith(
        "No watershed match found. Try coordinates or another name.",
      );
      expect(mockSetView).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("does not treat name-with-number watershed queries as invalid coordinates", () => {
      render(<Search watersheds={testWatersheds} />);

      fireEvent.click(screen.getByRole("button", { name: /search location/i }));
      fireEvent.change(screen.getByLabelText("Search bar"), {
        target: { value: "deer creek 2" },
      });
      fireEvent.click(screen.getByRole("button", { name: /go button/i }));

      expect(toastErrorMock).not.toHaveBeenCalled();
      const options = screen.getAllByRole("option");
      expect(options).toHaveLength(1);
      expect(options[0]).toHaveTextContent("Deer Creek 2");
    });

    it("shows loading/unavailable toast when watershed data is missing", () => {
      const emptyCollection: GeoJSON.FeatureCollection<
        GeoJSON.Geometry,
        WatershedProperties
      > = { type: "FeatureCollection", features: [] };

      render(<Search watersheds={emptyCollection} />);

      fireEvent.click(screen.getByRole("button", { name: /search location/i }));
      fireEvent.change(screen.getByLabelText("Search bar"), {
        target: { value: "clear creek" },
      });
      fireEvent.click(screen.getByRole("button", { name: /go button/i }));

      expect(toastErrorMock).toHaveBeenCalledTimes(1);
      expect(toastErrorMock).toHaveBeenCalledWith(
        "Watershed data is still loading or unavailable. Try coordinates.",
      );
    });

    it("includes matched attribute/value for sourceName matches", () => {
      render(<Search watersheds={testWatersheds} />);

      fireEvent.click(screen.getByRole("button", { name: /search location/i }));
      fireEvent.change(screen.getByLabelText("Search bar"), {
        target: { value: "tributary" },
      });
      fireEvent.click(screen.getByRole("button", { name: /go button/i }));

      const options = screen.getAllByRole("option");
      expect(options[0]).toHaveTextContent("sourceName:");
      expect(options[0]).toHaveTextContent("Clear Lake Tributary");
      expect(document.querySelectorAll("mark").length).toBeGreaterThan(0);
    });
  });
});
