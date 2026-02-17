import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, act } from "@testing-library/react";
import { useAppStore } from "../store/store";
import { highlightedStyle, selectedStyle } from "../components/map/constants";
import type { PathOptions } from "leaflet";
import type { SubcatchmentProperties } from "../types/SubcatchmentProperties";
import SubcatchmentLayer from "../components/map/SubcatchmentLayer";

type Feature = GeoJSON.Feature<GeoJSON.Geometry, SubcatchmentProperties>;

const geometry: GeoJSON.Point = { type: "Point", coordinates: [0, 0] };

const mockMap = {} as unknown;
const mockZoomToFeature = vi.fn();

vi.mock("../utils/map/MapUtil", () => ({
  zoomToFeature: (...args: unknown[]) => mockZoomToFeature(...args),
}));

type GeoJsonProps = {
  data: GeoJSON.FeatureCollection<GeoJSON.Geometry, SubcatchmentProperties>;
  style: (feature: Feature | undefined) => PathOptions;
  onEachFeature: (feature: Feature, layer: MockLayer) => void;
};

let lastGeoJsonProps: GeoJsonProps | null = null;

vi.mock("react-leaflet", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-leaflet")>();
  return Object.assign({}, actual, {
    useMap: () => mockMap,
    GeoJSON: (props: unknown) => {
      lastGeoJsonProps = props as GeoJsonProps;
      return <div data-testid="geojson" />;
    },
  });
});

function createFeature(
  id: string,
  overrides?: Partial<SubcatchmentProperties>,
): Feature {
  return {
    type: "Feature",
    id,
    geometry,
    properties: {
      topazid: 101,
      weppid: 202,
      width: 10,
      length: 20,
      hillslope_area: 10000,
      slope_scalar: 0.25,
      aspect: 1.23,
      simple_texture: "Loam",
      ...(overrides ?? {}),
    } as SubcatchmentProperties,
  };
}

type HandlerName = "click" | "mouseover" | "mouseout";
type LeafletEventLike = { target: MockLayer };
type HandlerMap = Partial<Record<HandlerName, (e: LeafletEventLike) => void>>;

type MockLayer = {
  bindTooltip: ReturnType<typeof vi.fn>;
  openTooltip: ReturnType<typeof vi.fn>;
  closeTooltip: ReturnType<typeof vi.fn>;
  setStyle: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
  __handlers: HandlerMap;
};

function createLayer(): MockLayer {
  const handlers: HandlerMap = {};

  const layer: MockLayer = {
    bindTooltip: vi.fn(),
    openTooltip: vi.fn(),
    closeTooltip: vi.fn(),
    setStyle: vi.fn(),
    on: vi.fn((obj: HandlerMap) => {
      Object.assign(handlers, obj);
      return layer;
    }),
    __handlers: handlers,
  };

  return layer;
}

describe("SubcatchmentLayer", () => {
  const setSelectedHillslope = vi.fn();
  const clearSelectedHillslope = vi.fn();

  const styleFn = vi.fn((feature: Feature | undefined): PathOptions => {
    const id = feature?.id?.toString?.() ?? "none";
    return {
      color: `#${id}`,
      weight: 1,
      fillColor: "#123456",
      fillOpacity: 0.7,
    };
  });

  const data = {
    type: "FeatureCollection",
    features: [createFeature("1")],
  } satisfies GeoJSON.FeatureCollection<
    GeoJSON.Geometry,
    SubcatchmentProperties
  >;

  beforeEach(() => {
    vi.clearAllMocks();
    lastGeoJsonProps = null;

    useAppStore.setState({
      setSelectedHillslope,
      clearSelectedHillslope,
    });
  });

  it("binds a tooltip with formatted hillslope details", () => {
    render(
      <SubcatchmentLayer
        data={data}
        style={styleFn}
        choroplethActive={false}
        choroplethKey="k1"
      />,
    );

    expect(lastGeoJsonProps).toBeTruthy();
    const feature = createFeature("1");
    const layer = createLayer();

    lastGeoJsonProps!.onEachFeature(feature, layer);

    expect(layer.bindTooltip).toHaveBeenCalledTimes(1);
    const [html, opts] = layer.bindTooltip.mock.calls[0];
    expect(String(html)).toContain("TopazID: 101");
    expect(String(html)).toContain("WeppID: 202");
    expect(String(html)).toContain("10.00");
    expect(String(html)).toContain("20.00");
    expect(String(html)).toContain("1.23");
    expect(String(html)).toContain("10000 m²");
    expect(opts).toMatchObject({ className: "tooltip" });
  });

  it("selects a feature on click and calls setSelectedHillslope + zoomToFeature", () => {
    render(
      <SubcatchmentLayer
        data={data}
        style={styleFn}
        choroplethActive={false}
        choroplethKey="k1"
      />,
    );

    const feature = createFeature("1");
    const layer = createLayer();
    lastGeoJsonProps!.onEachFeature(feature, layer);

    layer.__handlers.click?.({ target: layer });

    expect(layer.setStyle).toHaveBeenCalledWith(selectedStyle);
    expect(setSelectedHillslope).toHaveBeenCalledWith(101, feature.properties);
    expect(mockZoomToFeature).toHaveBeenCalledWith(mockMap, layer);
  });

  it("deselects the same feature on second click and calls clearSelectedHillslope", () => {
    render(
      <SubcatchmentLayer
        data={data}
        style={styleFn}
        choroplethActive={false}
        choroplethKey="k1"
      />,
    );

    const feature = createFeature("1");
    const layer = createLayer();
    lastGeoJsonProps!.onEachFeature(feature, layer);

    layer.__handlers.click?.({ target: layer });
    layer.setStyle.mockClear();

    layer.__handlers.click?.({ target: layer });

    expect(clearSelectedHillslope).toHaveBeenCalledTimes(1);
    expect(layer.setStyle).toHaveBeenCalledWith(styleFn(feature));
  });

  it("switches selection between features and restores previous style", () => {
    render(
      <SubcatchmentLayer
        data={
          {
            type: "FeatureCollection",
            features: [
              createFeature("1"),
              createFeature("2", { topazid: 202 }),
            ],
          } satisfies GeoJSON.FeatureCollection<
            GeoJSON.Geometry,
            SubcatchmentProperties
          >
        }
        style={styleFn}
        choroplethActive={false}
        choroplethKey="k1"
      />,
    );

    const feature1 = createFeature("1");
    const feature2 = createFeature("2", { topazid: 202 });

    const layer1 = createLayer();
    const layer2 = createLayer();

    lastGeoJsonProps!.onEachFeature(feature1, layer1);
    lastGeoJsonProps!.onEachFeature(feature2, layer2);

    layer1.__handlers.click?.({ target: layer1 });
    expect(layer1.setStyle).toHaveBeenCalledWith(selectedStyle);

    layer1.setStyle.mockClear();
    layer2.setStyle.mockClear();

    layer2.__handlers.click?.({ target: layer2 });

    expect(layer1.setStyle).toHaveBeenCalledWith(styleFn(feature1));
    expect(layer2.setStyle).toHaveBeenCalledWith(selectedStyle);
    expect(setSelectedHillslope).toHaveBeenLastCalledWith(
      202,
      feature2.properties,
    );
  });

  it("mouseover uses highlightedStyle when choropleth is inactive and not selected", () => {
    render(
      <SubcatchmentLayer
        data={data}
        style={styleFn}
        choroplethActive={false}
        choroplethKey="k1"
      />,
    );

    const feature = createFeature("1");
    const layer = createLayer();
    lastGeoJsonProps!.onEachFeature(feature, layer);

    layer.__handlers.mouseover?.({ target: layer });

    expect(layer.setStyle).toHaveBeenCalledWith(highlightedStyle);
    expect(layer.openTooltip).toHaveBeenCalledTimes(1);
  });

  it("mouseover uses choropleth style highlight when choropleth is active and not selected", () => {
    render(
      <SubcatchmentLayer
        data={data}
        style={styleFn}
        choroplethActive={true}
        choroplethKey="k1"
      />,
    );

    const feature = createFeature("1");
    const layer = createLayer();
    lastGeoJsonProps!.onEachFeature(feature, layer);

    layer.__handlers.mouseover?.({ target: layer });

    expect(layer.setStyle).toHaveBeenCalledWith({
      ...styleFn(feature),
      weight: 3,
      color: "#ffffff",
    });
    expect(layer.openTooltip).toHaveBeenCalledTimes(1);
  });

  it("mouseover keeps selectedStyle for the selected feature", () => {
    render(
      <SubcatchmentLayer
        data={data}
        style={styleFn}
        choroplethActive={true}
        choroplethKey="k1"
      />,
    );

    const feature = createFeature("1");
    const layer = createLayer();
    lastGeoJsonProps!.onEachFeature(feature, layer);

    layer.__handlers.click?.({ target: layer });
    layer.setStyle.mockClear();

    layer.__handlers.mouseover?.({ target: layer });
    expect(layer.setStyle).toHaveBeenCalledWith(selectedStyle);
  });

  it("mouseout resets style for non-selected feature", () => {
    render(
      <SubcatchmentLayer
        data={data}
        style={styleFn}
        choroplethActive={false}
        choroplethKey="k1"
      />,
    );

    const feature = createFeature("1");
    const layer = createLayer();
    lastGeoJsonProps!.onEachFeature(feature, layer);

    layer.__handlers.mouseout?.({ target: layer });

    expect(layer.setStyle).toHaveBeenCalledWith(styleFn(feature));
    expect(layer.closeTooltip).toHaveBeenCalledTimes(1);
  });

  it("mouseout does not reset style for selected feature", () => {
    render(
      <SubcatchmentLayer
        data={data}
        style={styleFn}
        choroplethActive={false}
        choroplethKey="k1"
      />,
    );

    const feature = createFeature("1");
    const layer = createLayer();
    lastGeoJsonProps!.onEachFeature(feature, layer);

    layer.__handlers.click?.({ target: layer });
    layer.setStyle.mockClear();

    layer.__handlers.mouseout?.({ target: layer });

    expect(layer.setStyle).not.toHaveBeenCalled();
    expect(layer.closeTooltip).toHaveBeenCalledTimes(1);
  });

  it("updates non-selected layer styles when choroplethKey changes", async () => {
    const feature = createFeature("1");
    const layer = createLayer();

    const r = render(
      <SubcatchmentLayer
        data={data}
        style={styleFn}
        choroplethActive={false}
        choroplethKey="k1"
      />,
    );

    lastGeoJsonProps!.onEachFeature(feature, layer);
    layer.setStyle.mockClear();

    await act(async () => {
      r.rerender(
        <SubcatchmentLayer
          data={data}
          style={styleFn}
          choroplethActive={false}
          choroplethKey="k2"
        />,
      );
    });

    expect(layer.setStyle).toHaveBeenCalledWith(styleFn(feature));
  });

  it("does not update the selected layer style when choroplethKey changes", async () => {
    const feature = createFeature("1");
    const layer = createLayer();

    const r = render(
      <SubcatchmentLayer
        data={data}
        style={styleFn}
        choroplethActive={false}
        choroplethKey="k1"
      />,
    );

    lastGeoJsonProps!.onEachFeature(feature, layer);
    layer.__handlers.click?.({ target: layer });
    layer.setStyle.mockClear();

    await act(async () => {
      r.rerender(
        <SubcatchmentLayer
          data={data}
          style={styleFn}
          choroplethActive={false}
          choroplethKey="k2"
        />,
      );
    });

    expect(layer.setStyle).not.toHaveBeenCalled();
  });

  it("renders N/A tooltip fields when feature.properties is missing", () => {
    render(
      <SubcatchmentLayer
        data={data}
        style={styleFn}
        choroplethActive={false}
        choroplethKey="k1"
      />,
    );

    const featureMissingProps = {
      type: "Feature",
      id: "1",
      geometry,
      properties: undefined,
    } as unknown as Feature;

    const layer = createLayer();
    lastGeoJsonProps!.onEachFeature(featureMissingProps, layer);

    const [html] = layer.bindTooltip.mock.calls[0];
    expect(String(html)).toContain("TopazID: N/A");
    expect(String(html)).toContain("WeppID: N/A");
    expect(String(html)).toContain("Width:");
    expect(String(html)).toContain("N/A m");
    expect(String(html)).toContain("Area:");
    expect(String(html)).toContain("N/A m²");
  });

  it("calls setSelectedHillslope with undefined topazid when topazid is missing", () => {
    render(
      <SubcatchmentLayer
        data={data}
        style={styleFn}
        choroplethActive={false}
        choroplethKey="k1"
      />,
    );

    const featureMissingTopazid = {
      type: "Feature",
      id: "1",
      geometry,
      properties: { weppid: 202 },
    } as unknown as Feature;

    const layer = createLayer();
    lastGeoJsonProps!.onEachFeature(featureMissingTopazid, layer);

    layer.__handlers.click?.({ target: layer });

    expect(setSelectedHillslope).toHaveBeenCalledWith(undefined, {
      weppid: 202,
    });
    expect(mockZoomToFeature).toHaveBeenCalledWith(mockMap, layer);
  });

  it("handles missing feature.id (click fid becomes null)", () => {
    render(
      <SubcatchmentLayer
        data={data}
        style={styleFn}
        choroplethActive={false}
        choroplethKey="k1"
      />,
    );

    const featureNoId = {
      type: "Feature",
      geometry,
      properties: createFeature("1").properties,
    } as unknown as Feature;

    const layer = createLayer();
    lastGeoJsonProps!.onEachFeature(featureNoId, layer);

    layer.__handlers.click?.({ target: layer });

    expect(clearSelectedHillslope).toHaveBeenCalledTimes(1);
    expect(layer.setStyle).toHaveBeenCalledWith(styleFn(featureNoId));
  });

  it("covers hoverFid/outFid null when feature.id is missing", () => {
    render(
      <SubcatchmentLayer
        data={data}
        style={styleFn}
        choroplethActive={false}
        choroplethKey="k1"
      />,
    );

    const featureNoId = {
      type: "Feature",
      geometry,
      properties: createFeature("1").properties,
    } as unknown as Feature;

    const layer = createLayer();
    lastGeoJsonProps!.onEachFeature(featureNoId, layer);

    layer.__handlers.mouseover?.({ target: layer });
    // hoverFid is null and selectedIdRef starts as null => treated as "selected" in current logic
    expect(layer.setStyle).toHaveBeenCalledWith(selectedStyle);

    layer.setStyle.mockClear();
    layer.closeTooltip.mockClear();
    layer.__handlers.mouseout?.({ target: layer });
    expect(layer.setStyle).not.toHaveBeenCalled();
    expect(layer.closeTooltip).toHaveBeenCalledTimes(1);
  });

  it("covers previous-selection restore when switching between features", () => {
    render(
      <SubcatchmentLayer
        data={
          {
            type: "FeatureCollection",
            features: [
              createFeature("1"),
              createFeature("2", { topazid: 202 }),
            ],
          } satisfies GeoJSON.FeatureCollection<
            GeoJSON.Geometry,
            SubcatchmentProperties
          >
        }
        style={styleFn}
        choroplethActive={false}
        choroplethKey="k1"
      />,
    );

    const feature1 = createFeature("1");
    const feature2 = createFeature("2", { topazid: 202 });

    const layer1 = createLayer();
    const layer2 = createLayer();

    lastGeoJsonProps!.onEachFeature(feature1, layer1);
    lastGeoJsonProps!.onEachFeature(feature2, layer2);

    // First selection
    layer1.__handlers.click?.({ target: layer1 });

    // Second selection triggers restore of previous selection style
    layer1.setStyle.mockClear();
    layer2.setStyle.mockClear();
    styleFn.mockClear();

    layer2.__handlers.click?.({ target: layer2 });

    expect(styleFn).toHaveBeenCalledWith(feature1);
    expect(layer1.setStyle).toHaveBeenCalledWith(styleFn(feature1));
  });

  it("event handlers use latest choroplethActive/style after rerender", async () => {
    const styleFn2 = vi.fn(
      (feature: Feature | undefined): PathOptions => ({
        color: `#ALT-${feature?.id?.toString?.() ?? "none"}`,
        weight: 2,
        fillColor: "#654321",
        fillOpacity: 0.5,
      }),
    );

    const feature = createFeature("1");
    const layer = createLayer();

    const r = render(
      <SubcatchmentLayer
        data={data}
        style={styleFn}
        choroplethActive={false}
        choroplethKey="k1"
      />,
    );

    lastGeoJsonProps!.onEachFeature(feature, layer);
    layer.setStyle.mockClear();

    await act(async () => {
      r.rerender(
        <SubcatchmentLayer
          data={data}
          style={styleFn2}
          choroplethActive={true}
          choroplethKey="k1"
        />,
      );
    });

    layer.__handlers.mouseover?.({ target: layer });
    expect(layer.setStyle).toHaveBeenCalledWith({
      ...styleFn2(feature),
      weight: 3,
      color: "#ffffff",
    });
  });
});
