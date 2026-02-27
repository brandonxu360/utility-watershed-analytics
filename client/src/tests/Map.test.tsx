import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAppStore } from "../store/store";
import { INITIAL_DESIRED, INITIAL_RUNTIME } from "../layers/rules";
import type { LayerId, DesiredMap } from "../layers/types";
import { toast } from "react-toastify";
import WatershedMap from "../components/map/WatershedMap";

const mockNavigate = vi.fn();
const mockClosePanel = vi.fn();

const { mockUseParams } = vi.hoisted(() => ({
  mockUseParams: vi.fn(),
}));

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal();
  return Object.assign({}, actual, {
    useParams: () => mockUseParams(),
    useNavigate: () => mockNavigate,
  });
});

const mockFetchWatersheds = vi.fn();
const mockFetchSubcatchments = vi.fn();
const mockFetchChannels = vi.fn();
const mockFetchLanduse = vi.fn();

vi.mock("../api/api", () => ({
  fetchWatersheds: () => mockFetchWatersheds(),
  fetchSubcatchments: (id: string) => mockFetchSubcatchments(id),
  fetchChannels: (id: string) => mockFetchChannels(id),
}));

vi.mock("../api/landuseApi", () => ({
  fetchLanduse: (opts: { runId: string }) => mockFetchLanduse(opts),
}));

vi.mock("react-toastify", () => ({
  toast: {
    error: vi.fn(),
  },
}));

const toastErrorMock = vi.mocked(toast.error);

const mockGetChoroplethStyle = vi.fn();
const { mockUseChoropleth } = vi.hoisted(() => ({
  mockUseChoropleth: vi.fn(),
}));

vi.mock("../hooks/useChoropleth", () => ({
  useChoropleth: () => mockUseChoropleth(),
}));

type GeoJsonOnEachFeature = (
  feature: GeoJSON.Feature,
  layer: { on: (handlers: Record<string, (e: unknown) => void>) => void },
) => void;

let lastWatershedGeoJsonProps: {
  data: unknown;
  style: (feature: unknown) => unknown;
  onEachFeature: GeoJsonOnEachFeature;
} | null = null;

let lastChannelGeoJsonProps: {
  data: unknown;
  style: () => unknown;
} | null = null;

vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: ({ url }: { url: string }) => (
    <div data-testid="tile-layer" data-url={url} />
  ),
  GeoJSON: (props: {
    data: unknown;
    style: unknown;
    onEachFeature?: unknown;
  }) => {
    if (!props.onEachFeature) {
      lastChannelGeoJsonProps = {
        data: props.data,
        style: props.style as () => unknown,
      };
      return <div data-testid="channels-geojson" />;
    }
    lastWatershedGeoJsonProps = {
      data: props.data,
      style: props.style as (feature: unknown) => unknown,
      onEachFeature: props.onEachFeature as GeoJsonOnEachFeature,
    };
    return <div data-testid="watersheds-geojson" />;
  },
  ScaleControl: () => <div data-testid="scale-control" />,
  useMap: () => ({}),
}));

vi.mock("../components/map/controls/DataLayers/DataLayers", () => ({
  default: () => <div data-testid="data-layers-control" />,
}));

vi.mock("../components/map/controls/ZoomIn", () => ({
  default: () => <div data-testid="zoom-in-control" />,
}));

vi.mock("../components/map/controls/ZoomOut", () => ({
  default: () => <div data-testid="zoom-out-control" />,
}));

vi.mock("../components/map/controls/Layers", () => ({
  default: ({
    selectedLayerId,
    setSelectedLayerId,
  }: {
    selectedLayerId: string;
    setSelectedLayerId: (id: "Satellite" | "Topographic") => void;
  }) => (
    <div data-testid="layers-control">
      <span data-testid="selected-layer">{selectedLayerId}</span>
      <button
        data-testid="toggle-layer"
        onClick={() =>
          setSelectedLayerId(
            selectedLayerId === "Satellite" ? "Topographic" : "Satellite",
          )
        }
      >
        Toggle
      </button>
    </div>
  ),
}));

vi.mock("../components/map/controls/Legend", () => ({
  default: () => <div data-testid="legend-control" />,
}));

vi.mock("../components/map/controls/Search", () => ({
  default: () => <div data-testid="search-control" />,
}));

vi.mock("../components/map/controls/Settings", () => ({
  default: () => <div data-testid="settings-control" />,
}));

vi.mock("../components/map/controls/LandUseLegend", () => ({
  default: () => <div data-testid="landuse-legend" />,
}));

type SubcatchmentStyleFn = (feature: GeoJSON.Feature | undefined) => unknown;
let lastSubcatchmentStyleFn: SubcatchmentStyleFn | null = null;

vi.mock("../components/map/SubcatchmentLayer", () => ({
  default: ({
    style,
    choroplethActive,
    choroplethKey,
  }: {
    data: unknown;
    style: SubcatchmentStyleFn;
    choroplethActive: boolean;
    choroplethKey: string;
  }) => {
    lastSubcatchmentStyleFn = style;
    return (
      <div
        data-testid="subcatchment-layer"
        data-choropleth-active={choroplethActive}
        data-choropleth-key={choroplethKey}
      />
    );
  },
}));

vi.mock("../utils/map/MapEffectUtil", () => ({
  MapEffect: ({ watershedId }: { watershedId: string | null }) => (
    <div data-testid="map-effect" data-watershed-id={watershedId} />
  ),
}));

const mockWatershedData = {
  features: [
    {
      id: "watershed-1",
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [] },
      properties: { pws_name: "Test Watershed 1" },
    },
    {
      id: "watershed-2",
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [] },
      properties: { pws_name: "Test Watershed 2" },
    },
  ],
};

const mockSubcatchmentData = {
  features: [
    {
      id: "subcatchment-1",
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [] },
      properties: {
        topazid: 1,
        weppid: 101,
        landuse_color: "#ff0000",
        landuse_desc: "Forest",
      },
    },
    {
      id: "subcatchment-2",
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [] },
      properties: {
        topazid: 2,
        weppid: 102,
        landuse_color: "#00ff00",
        landuse_desc: "Grassland",
      },
    },
  ],
};

const mockChannelData = {
  features: [
    {
      id: "channel-1",
      type: "Feature",
      geometry: { type: "LineString", coordinates: [] },
      properties: {},
    },
  ],
};

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
};

/** Build a DesiredMap with the given layer IDs enabled. */
const desiredWith = (...ids: LayerId[]): DesiredMap => {
  const d = JSON.parse(JSON.stringify(INITIAL_DESIRED)) as DesiredMap;
  for (const id of ids) d[id].enabled = true;
  return d;
};

const resetStore = () => {
  useAppStore.setState({
    layerDesired: JSON.parse(JSON.stringify(INITIAL_DESIRED)),
    layerRuntime: JSON.parse(JSON.stringify(INITIAL_RUNTIME)),
    landuseLegendMap: {},
    isPanelOpen: false,
    panelContent: null,
    choroplethCache: { data: null, range: null, loading: false, error: null },
    closePanel: mockClosePanel,
  });
};

describe("Map Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
    lastWatershedGeoJsonProps = null;
    lastChannelGeoJsonProps = null;
    lastSubcatchmentStyleFn = null;

    // Default mock returns
    mockUseParams.mockReturnValue(null);
    mockFetchWatersheds.mockResolvedValue(mockWatershedData);
    mockFetchSubcatchments.mockResolvedValue(mockSubcatchmentData);
    mockFetchChannels.mockResolvedValue(mockChannelData);
    mockFetchLanduse.mockResolvedValue({
      1: { desc: "Forest", color: "#ff0000" },
      2: { desc: "Grassland", color: "#00ff00" },
    });
    mockUseChoropleth.mockReturnValue({
      isActive: false,
      getChoroplethStyle: mockGetChoroplethStyle,
      isLoading: false,
      choropleth: "none",
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders the map container", async () => {
      renderWithProviders(<WatershedMap />);
      await waitFor(() => {
        expect(screen.getByTestId("map-container")).toBeInTheDocument();
      });
    });

    it("renders all control components", async () => {
      renderWithProviders(<WatershedMap />);
      await waitFor(() => {
        expect(screen.getByTestId("legend-control")).toBeInTheDocument();
        expect(screen.getByTestId("search-control")).toBeInTheDocument();
        expect(screen.getByTestId("layers-control")).toBeInTheDocument();
        expect(screen.getByTestId("zoom-in-control")).toBeInTheDocument();
        expect(screen.getByTestId("zoom-out-control")).toBeInTheDocument();
        expect(screen.getByTestId("landuse-legend")).toBeInTheDocument();
      });
    });

    it("renders scale control", async () => {
      renderWithProviders(<WatershedMap />);
      await waitFor(() => {
        expect(screen.getByTestId("scale-control")).toBeInTheDocument();
      });
    });

    it("renders tile layer with satellite by default", async () => {
      renderWithProviders(<WatershedMap />);
      await waitFor(() => {
        const tileLayer = screen.getByTestId("tile-layer");
        expect(tileLayer).toBeInTheDocument();
        expect(tileLayer.getAttribute("data-url")).toContain("google.com");
      });
    });

    it("renders watersheds GeoJSON when no subcatchment enabled", async () => {
      renderWithProviders(<WatershedMap />);
      await waitFor(() => {
        expect(screen.getByTestId("watersheds-geojson")).toBeInTheDocument();
      });
    });

    it("does not render DataLayersControl when no watershedID", async () => {
      mockUseParams.mockReturnValue(null);
      renderWithProviders(<WatershedMap />);
      await waitFor(() => {
        expect(
          screen.queryByTestId("data-layers-control"),
        ).not.toBeInTheDocument();
      });
    });

    it("renders DataLayersControl when watershedID is present", async () => {
      mockUseParams.mockReturnValue("watershed-1");
      renderWithProviders(<WatershedMap />);
      await waitFor(() => {
        expect(screen.getByTestId("data-layers-control")).toBeInTheDocument();
      });
    });

    it("renders MapEffect with correct watershed ID", async () => {
      mockUseParams.mockReturnValue("watershed-1");
      renderWithProviders(<WatershedMap />);
      await waitFor(() => {
        const mapEffect = screen.getByTestId("map-effect");
        expect(mapEffect.getAttribute("data-watershed-id")).toBe("watershed-1");
      });
    });
  });

  describe("error handling", () => {
    it("displays error message when watersheds fetch fails", async () => {
      const error = new Error("Network error");
      mockFetchWatersheds.mockRejectedValue(error);

      renderWithProviders(<WatershedMap />);

      await waitFor(() => {
        expect(screen.getByText(/Error: Network error/)).toBeInTheDocument();
      });
    });
  });

  describe("loading states", () => {
    it("shows loading overlay when watersheds are loading", async () => {
      mockFetchWatersheds.mockReturnValue(new Promise(() => {}));

      renderWithProviders(<WatershedMap />);

      await waitFor(() => {
        expect(screen.getByTestId("map-loading-overlay")).toBeInTheDocument();
      });
    });

    it("shows loading overlay when choropleth is loading", async () => {
      mockUseChoropleth.mockReturnValue({
        isActive: false,
        isLoading: true,
        choropleth: "none",
        getChoroplethStyle: mockGetChoroplethStyle,
      });

      renderWithProviders(<WatershedMap />);

      await waitFor(() => {
        expect(screen.getByTestId("map-loading-overlay")).toBeInTheDocument();
      });
    });
  });

  describe("watershed interactions", () => {
    it("applies selected style to matching watershed", async () => {
      mockUseParams.mockReturnValue("watershed-1");
      renderWithProviders(<WatershedMap />);

      await waitFor(() => {
        expect(lastWatershedGeoJsonProps).toBeTruthy();
      });

      const feature = { id: "watershed-1" };
      const style = lastWatershedGeoJsonProps!.style(feature);
      expect(style).toMatchObject({ fillOpacity: 0.5 });
    });

    it("applies default style to non-matching watershed", async () => {
      mockUseParams.mockReturnValue("watershed-1");
      renderWithProviders(<WatershedMap />);

      await waitFor(() => {
        expect(lastWatershedGeoJsonProps).toBeTruthy();
      });

      const feature = { id: "watershed-2" };
      const style = lastWatershedGeoJsonProps!.style(feature);
      expect(style).toMatchObject({ fillOpacity: 0.25 });
    });

    it("navigates to watershed on click", async () => {
      renderWithProviders(<WatershedMap />);

      await waitFor(() => {
        expect(lastWatershedGeoJsonProps).toBeTruthy();
      });

      const mockLayer = {
        on: vi.fn(),
      };

      const feature = { id: "test-watershed-click" };

      lastWatershedGeoJsonProps!.onEachFeature(
        feature as GeoJSON.Feature,
        mockLayer,
      );

      expect(mockLayer.on).toHaveBeenCalledWith(
        expect.objectContaining({ click: expect.any(Function) }),
      );

      // Simulate click
      const clickHandler = mockLayer.on.mock.calls[0][0].click;
      clickHandler({ sourceTarget: { feature } });

      expect(mockClosePanel).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith({
        to: "/watershed/test-watershed-click",
      });
    });
  });

  describe("subcatchment layer", () => {
    it("shows subcatchment layer when enabled and data exists", async () => {
      mockUseParams.mockReturnValue("watershed-1");
      useAppStore.setState({ layerDesired: desiredWith("subcatchment") });
      mockFetchSubcatchments.mockResolvedValue(mockSubcatchmentData);

      renderWithProviders(<WatershedMap />);

      await waitFor(() => {
        expect(screen.getByTestId("subcatchment-layer")).toBeInTheDocument();
      });
    });

    it("does not show subcatchment layer when disabled", async () => {
      mockUseParams.mockReturnValue("watershed-1");

      renderWithProviders(<WatershedMap />);

      await waitFor(() => {
        expect(
          screen.queryByTestId("subcatchment-layer"),
        ).not.toBeInTheDocument();
      });
    });

    it("shows watershed layer when subcatchment has no features", async () => {
      mockUseParams.mockReturnValue("watershed-1");
      useAppStore.setState({ layerDesired: desiredWith("subcatchment") });
      mockFetchSubcatchments.mockResolvedValue({ features: [] });

      renderWithProviders(<WatershedMap />);

      await waitFor(() => {
        expect(screen.getByTestId("watersheds-geojson")).toBeInTheDocument();
      });
    });

    it("passes correct choropleth props to SubcatchmentLayer", async () => {
      mockUseParams.mockReturnValue("watershed-1");
      useAppStore.setState({ layerDesired: desiredWith("subcatchment") });
      mockUseChoropleth.mockReturnValue({
        isActive: true,
        getChoroplethStyle: mockGetChoroplethStyle,
        isLoading: false,
        choropleth: "vegetationCover",
      });
      mockFetchSubcatchments.mockResolvedValue(mockSubcatchmentData);

      renderWithProviders(<WatershedMap />);

      await waitFor(() => {
        const layer = screen.getByTestId("subcatchment-layer");
        expect(layer.getAttribute("data-choropleth-active")).toBe("true");
      });
    });
  });

  describe("channels layer", () => {
    it("shows channels when enabled and data exists", async () => {
      mockUseParams.mockReturnValue("watershed-1");
      useAppStore.setState({ layerDesired: desiredWith("channels") });
      mockFetchChannels.mockResolvedValue(mockChannelData);

      renderWithProviders(<WatershedMap />);

      await waitFor(() => {
        expect(screen.getByTestId("channels-geojson")).toBeInTheDocument();
      });
    });

    it("does not show channels when disabled", async () => {
      mockUseParams.mockReturnValue("watershed-1");

      renderWithProviders(<WatershedMap />);

      await waitFor(() => {
        expect(
          screen.queryByTestId("channels-geojson"),
        ).not.toBeInTheDocument();
      });
    });

    it("applies correct style to channels", async () => {
      mockUseParams.mockReturnValue("watershed-1");
      useAppStore.setState({ layerDesired: desiredWith("channels") });
      mockFetchChannels.mockResolvedValue(mockChannelData);

      renderWithProviders(<WatershedMap />);

      await waitFor(() => {
        expect(lastChannelGeoJsonProps).toBeTruthy();
      });

      const style = lastChannelGeoJsonProps!.style();
      expect(style).toMatchObject({
        color: "#000080",
        fillOpacity: 1,
        weight: 2,
      });
    });
  });

  describe("auto-disable effects", () => {
    it("disables subcatchment and landuse when no subcatchment data", async () => {
      mockUseParams.mockReturnValue("watershed-1");
      useAppStore.setState({
        layerDesired: desiredWith("subcatchment", "landuse"),
      });
      mockFetchSubcatchments.mockResolvedValue({ features: [] });

      renderWithProviders(<WatershedMap />);

      await waitFor(() => {
        // The evaluator blocks subcatchment (missing data), which also blocks landuse
        // useLayerToasts fires toast for the blocked transitions
        expect(toastErrorMock).toHaveBeenCalled();
        const calls = toastErrorMock.mock.calls.map((c) => c[0] as string);
        expect(calls.some((m) => m.includes("Subcatchments"))).toBe(true);
      });
    });

    it("disables channels when no channel data", async () => {
      mockUseParams.mockReturnValue("watershed-1");
      useAppStore.setState({ layerDesired: desiredWith("channels") });
      mockFetchChannels.mockResolvedValue({ features: [] });

      renderWithProviders(<WatershedMap />);

      await waitFor(() => {
        expect(toastErrorMock).toHaveBeenCalled();
        const calls = toastErrorMock.mock.calls.map((c) => c[0] as string);
        expect(calls.some((m) => m.includes("WEPP Channels"))).toBe(true);
      });
    });

    it("shows toast when landuse is enabled but no subcatchment data", async () => {
      mockUseParams.mockReturnValue("watershed-1");
      useAppStore.setState({
        layerDesired: desiredWith("subcatchment", "landuse"),
      });
      mockFetchSubcatchments.mockResolvedValue({ features: [] });

      renderWithProviders(<WatershedMap />);

      await waitFor(() => {
        expect(toastErrorMock).toHaveBeenCalled();
        const calls = toastErrorMock.mock.calls.map((c) => c[0] as string);
        expect(calls.some((m) => m.includes("Subcatchments"))).toBe(true);
      });
    });
  });

  describe("landuse legend", () => {
    it("sets landuse legend map when landuse is enabled", async () => {
      const mockSetLanduseLegendMap = vi.fn();

      mockUseParams.mockReturnValue("watershed-1");
      useAppStore.setState({
        layerDesired: desiredWith("subcatchment", "landuse"),
        setLanduseLegendMap: mockSetLanduseLegendMap,
      });
      mockFetchSubcatchments.mockResolvedValue(mockSubcatchmentData);

      renderWithProviders(<WatershedMap />);

      await waitFor(() => {
        expect(mockSetLanduseLegendMap).toHaveBeenCalledWith({
          "#ff0000": "Forest",
          "#00ff00": "Grassland",
        });
      });
    });

    it("prefers undisturbed landuse parquet values when available", async () => {
      const mockSetLanduseLegendMap = vi.fn();

      mockUseParams.mockReturnValue("watershed-1");
      useAppStore.setState({
        layerDesired: desiredWith("subcatchment", "landuse"),
        setLanduseLegendMap: mockSetLanduseLegendMap,
      });

      mockFetchSubcatchments.mockResolvedValue({
        features: [
          {
            id: "sub-1",
            type: "Feature",
            geometry: { type: "Polygon", coordinates: [] },
            properties: { topazid: 1, weppid: 101 },
          },
        ],
      });

      mockFetchLanduse.mockResolvedValue({
        1: { desc: "Pasture/Hay", color: "#dbd83d" },
      });

      renderWithProviders(<WatershedMap />);

      await waitFor(() => {
        expect(mockFetchLanduse).toHaveBeenCalledWith({
          runId: "watershed-1",
        });
        expect(mockSetLanduseLegendMap).toHaveBeenCalledWith({
          "#dbd83d": "Pasture/Hay",
        });
      });
    });

    it("clears landuse legend map when landuse is disabled", async () => {
      const mockSetLanduseLegendMap = vi.fn();

      mockUseParams.mockReturnValue("watershed-1");
      useAppStore.setState({
        layerDesired: desiredWith("subcatchment"),
        setLanduseLegendMap: mockSetLanduseLegendMap,
      });
      mockFetchSubcatchments.mockResolvedValue(mockSubcatchmentData);

      renderWithProviders(<WatershedMap />);

      await waitFor(() => {
        expect(mockSetLanduseLegendMap).toHaveBeenCalledWith({});
      });
    });

    it("handles landuse entries without color/desc", async () => {
      const mockSetLanduseLegendMap = vi.fn();

      mockUseParams.mockReturnValue("watershed-1");
      useAppStore.setState({
        layerDesired: desiredWith("subcatchment", "landuse"),
        setLanduseLegendMap: mockSetLanduseLegendMap,
      });
      mockFetchSubcatchments.mockResolvedValue(mockSubcatchmentData);
      mockFetchLanduse.mockResolvedValue({
        1: { desc: "", color: "" },
        2: { desc: "", color: "" },
      });

      renderWithProviders(<WatershedMap />);

      await waitFor(() => {
        expect(mockSetLanduseLegendMap).toHaveBeenCalledWith({});
      });
    });

    it("shows toast and blocks landuse when undisturbed scenario returns no rows", async () => {
      const mockSetLanduseLegendMap = vi.fn();

      mockUseParams.mockReturnValue("watershed-1");
      useAppStore.setState({
        layerDesired: desiredWith("subcatchment", "landuse"),
        setLanduseLegendMap: mockSetLanduseLegendMap,
      });

      mockFetchLanduse.mockResolvedValue({});
      mockFetchSubcatchments.mockResolvedValue(mockSubcatchmentData);

      renderWithProviders(<WatershedMap />);

      await waitFor(() => {
        expect(toastErrorMock).toHaveBeenCalled();
        expect(mockSetLanduseLegendMap).toHaveBeenCalledWith({});
      });
    });

    it("clears landuse legend when returning to home without watershed", async () => {
      const mockSetLanduseLegendMap = vi.fn();

      mockUseParams.mockReturnValue(undefined);
      useAppStore.setState({
        layerDesired: desiredWith("landuse"),
        setLanduseLegendMap: mockSetLanduseLegendMap,
      });

      renderWithProviders(<WatershedMap />);

      await waitFor(() => {
        expect(mockSetLanduseLegendMap).toHaveBeenCalledWith({});
      });
    });
  });

  describe("subcatchment styling", () => {
    it("returns choropleth style when active and weppid exists", async () => {
      const choroplethStyle = { fillColor: "#123456", fillOpacity: 0.8 };
      mockGetChoroplethStyle.mockReturnValue(choroplethStyle);
      mockUseChoropleth.mockReturnValue({
        isActive: true,
        getChoroplethStyle: mockGetChoroplethStyle,
        isLoading: false,
        choropleth: "vegetationCover",
      });

      mockUseParams.mockReturnValue("watershed-1");
      useAppStore.setState({ layerDesired: desiredWith("subcatchment") });
      mockFetchSubcatchments.mockResolvedValue(mockSubcatchmentData);

      renderWithProviders(<WatershedMap />);

      await waitFor(() => {
        expect(lastSubcatchmentStyleFn).toBeTruthy();
      });

      const feature = {
        type: "Feature" as const,
        properties: { weppid: 101 },
        geometry: { type: "Point" as const, coordinates: [0, 0] },
      };
      const result = lastSubcatchmentStyleFn!(feature);
      expect(result).toEqual(choroplethStyle);
      expect(mockGetChoroplethStyle).toHaveBeenCalledWith(101);
    });

    it("returns default style when choropleth returns null", async () => {
      mockGetChoroplethStyle.mockReturnValue(null);
      mockUseChoropleth.mockReturnValue({
        isActive: true,
        isLoading: false,
        choropleth: "vegetationCover",
        getChoroplethStyle: mockGetChoroplethStyle,
      });

      mockUseParams.mockReturnValue("watershed-1");
      useAppStore.setState({ layerDesired: desiredWith("subcatchment") });
      mockFetchSubcatchments.mockResolvedValue(mockSubcatchmentData);

      renderWithProviders(<WatershedMap />);

      await waitFor(() => {
        expect(lastSubcatchmentStyleFn).toBeTruthy();
      });

      const feature = {
        type: "Feature" as const,
        properties: { weppid: 999 },
        geometry: { type: "Point" as const, coordinates: [0, 0] },
      };
      const result = lastSubcatchmentStyleFn!(feature);
      expect(result).toMatchObject({
        color: "#ffff00",
      });
    });

    it("returns landuse style when landuse is enabled and feature has color", async () => {
      mockUseChoropleth.mockReturnValue({
        isActive: false,
        getChoroplethStyle: mockGetChoroplethStyle,
        isLoading: false,
        choropleth: "none",
      });

      mockUseParams.mockReturnValue("watershed-1");
      useAppStore.setState({ layerDesired: desiredWith("subcatchment", "landuse") });
      mockFetchSubcatchments.mockResolvedValue(mockSubcatchmentData);

      renderWithProviders(<WatershedMap />);

      const feature = {
        type: "Feature" as const,
        properties: { topazid: 1, weppid: 101 },
        geometry: { type: "Point" as const, coordinates: [0, 0] },
      };

      // Wait for style function to include landuse data
      await waitFor(() => {
        expect(lastSubcatchmentStyleFn).toBeTruthy();
        const result = lastSubcatchmentStyleFn!(feature);
        expect(result).toMatchObject({
          color: "#2c2c2c",
          weight: 0.75,
          fillColor: "#ff0000",
          fillOpacity: 1,
        });
      });
    });

    it("returns default style when feature has no landuse_color", async () => {
      mockUseChoropleth.mockReturnValue({
        isActive: false,
        getChoroplethStyle: mockGetChoroplethStyle,
        isLoading: false,
        choropleth: "none",
      });

      mockUseParams.mockReturnValue("watershed-1");
      useAppStore.setState({ layerDesired: desiredWith("subcatchment", "landuse") });
      mockFetchSubcatchments.mockResolvedValue(mockSubcatchmentData);

      renderWithProviders(<WatershedMap />);

      await waitFor(() => {
        expect(lastSubcatchmentStyleFn).toBeTruthy();
      });

      const feature = {
        type: "Feature" as const,
        properties: {},
        geometry: { type: "Point" as const, coordinates: [0, 0] },
      };
      const result = lastSubcatchmentStyleFn!(feature);
      expect(result).toMatchObject({
        color: "#ffff00",
      });
    });

    it("returns default style when feature is undefined", async () => {
      mockUseChoropleth.mockReturnValue({
        isActive: false,
        getChoroplethStyle: mockGetChoroplethStyle,
        isLoading: false,
        choropleth: "none",
      });

      mockUseParams.mockReturnValue("watershed-1");
      useAppStore.setState({ layerDesired: desiredWith("subcatchment") });
      mockFetchSubcatchments.mockResolvedValue(mockSubcatchmentData);

      renderWithProviders(<WatershedMap />);

      await waitFor(() => {
        expect(lastSubcatchmentStyleFn).toBeTruthy();
      });

      const result = lastSubcatchmentStyleFn!(undefined);
      expect(result).toMatchObject({
        color: "#ffff00",
      });
    });

    it("skips choropleth style when feature has no weppid", async () => {
      mockGetChoroplethStyle.mockReturnValue({ fillColor: "#123456" });
      mockUseChoropleth.mockReturnValue({
        isActive: true,
        getChoroplethStyle: mockGetChoroplethStyle,
        isLoading: false,
        choropleth: "vegetationCover",
      });

      mockUseParams.mockReturnValue("watershed-1");
      useAppStore.setState({ layerDesired: desiredWith("subcatchment") });
      mockFetchSubcatchments.mockResolvedValue(mockSubcatchmentData);

      renderWithProviders(<WatershedMap />);

      await waitFor(() => {
        expect(lastSubcatchmentStyleFn).toBeTruthy();
      });

      const feature = {
        type: "Feature" as const,
        properties: {},
        geometry: { type: "Point" as const, coordinates: [0, 0] },
      };
      const result = lastSubcatchmentStyleFn!(feature);
      expect(mockGetChoroplethStyle).not.toHaveBeenCalled();
      expect(result).toMatchObject({
        color: "#ffff00",
      });
    });
  });

  describe("layer switching", () => {
    it("renders with Satellite layer by default", async () => {
      renderWithProviders(<WatershedMap />);

      await waitFor(() => {
        expect(screen.getByTestId("selected-layer").textContent).toBe(
          "Satellite",
        );
      });
    });

    it("can switch to Topographic layer", async () => {
      renderWithProviders(<WatershedMap />);

      await waitFor(() => {
        expect(screen.getByTestId("toggle-layer")).toBeInTheDocument();
      });

      act(() => {
        screen.getByTestId("toggle-layer").click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("selected-layer").textContent).toBe(
          "Topographic",
        );
      });
    });
  });

  describe("choropleth key generation", () => {
    it("generates correct choropleth key", async () => {
      mockUseParams.mockReturnValue("watershed-1");
      const ld = desiredWith("subcatchment", "choropleth");
      ld.choropleth.params = { metric: "vegetationCover", year: 2020, bands: "tree" };
      useAppStore.setState({ layerDesired: ld });
      mockUseChoropleth.mockReturnValue({
        isActive: true,
        getChoroplethStyle: mockGetChoroplethStyle,
        isLoading: false,
        choropleth: "vegetationCover",
      });
      mockFetchSubcatchments.mockResolvedValue(mockSubcatchmentData);

      renderWithProviders(<WatershedMap />);

      await waitFor(() => {
        const layer = screen.getByTestId("subcatchment-layer");
        expect(layer.getAttribute("data-choropleth-key")).toContain(
          "vegetationCover",
        );
        expect(layer.getAttribute("data-choropleth-key")).toContain("2020");
        expect(layer.getAttribute("data-choropleth-key")).toContain("tree");
      });
    });

    it("uses 'all' for null year in choropleth key", async () => {
      mockUseParams.mockReturnValue("watershed-1");
      const ld = desiredWith("subcatchment", "choropleth");
      ld.choropleth.params = { metric: "vegetationCover", year: null, bands: "all" };
      useAppStore.setState({ layerDesired: ld });
      mockUseChoropleth.mockReturnValue({
        isActive: true,
        getChoroplethStyle: mockGetChoroplethStyle,
        isLoading: false,
        choropleth: "vegetationCover",
      });
      mockFetchSubcatchments.mockResolvedValue(mockSubcatchmentData);

      renderWithProviders(<WatershedMap />);

      await waitFor(() => {
        const layer = screen.getByTestId("subcatchment-layer");
        expect(layer.getAttribute("data-choropleth-key")).toContain("all");
      });
    });
  });

  describe("edge cases", () => {
    it("handles undefined feature in watershed style", async () => {
      renderWithProviders(<WatershedMap />);

      await waitFor(() => {
        expect(lastWatershedGeoJsonProps).toBeTruthy();
      });

      const style = lastWatershedGeoJsonProps!.style(undefined);
      expect(style).toMatchObject({ fillOpacity: 0.25 }); // defaultStyle
    });

    it("handles missing watershedID in match params", async () => {
      mockUseParams.mockReturnValue(undefined);
      renderWithProviders(<WatershedMap />);

      await waitFor(() => {
        expect(screen.getByTestId("watersheds-geojson")).toBeInTheDocument();
        expect(
          screen.queryByTestId("data-layers-control"),
        ).not.toBeInTheDocument();
      });
    });

    it("does not fetch subcatchments when watershedID is null", async () => {
      mockUseParams.mockReturnValue(null);
      useAppStore.setState({ layerDesired: desiredWith("subcatchment") });

      renderWithProviders(<WatershedMap />);

      await waitFor(() => {
        expect(mockFetchSubcatchments).not.toHaveBeenCalled();
      });
    });

    it("does not fetch channels when watershedID is null", async () => {
      mockUseParams.mockReturnValue(null);
      useAppStore.setState({ layerDesired: desiredWith("channels") });

      renderWithProviders(<WatershedMap />);

      await waitFor(() => {
        expect(mockFetchChannels).not.toHaveBeenCalled();
      });
    });

    it("does not run auto-disable effect when subLoading is true", async () => {
      mockUseParams.mockReturnValue("watershed-1");
      useAppStore.setState({ layerDesired: desiredWith("subcatchment") });
      mockFetchSubcatchments.mockReturnValue(new Promise(() => {}));

      renderWithProviders(<WatershedMap />);

      // While loading, data availability should remain undefined
      const runtime = useAppStore.getState().layerRuntime;
      expect(runtime.dataAvailability.subcatchment).toBeUndefined();
    });

    it("does not run channel auto-disable effect when channelLoading is true", async () => {
      mockUseParams.mockReturnValue("watershed-1");
      useAppStore.setState({ layerDesired: desiredWith("channels") });
      mockFetchChannels.mockReturnValue(new Promise(() => {}));

      renderWithProviders(<WatershedMap />);

      const runtime = useAppStore.getState().layerRuntime;
      expect(runtime.dataAvailability.channels).toBeUndefined();
    });
  });
});
