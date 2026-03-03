import { useMap, GeoJSON } from "react-leaflet";
import { SubcatchmentProperties } from "../../types/SubcatchmentProperties";
import { useWatershed } from "../../contexts/WatershedContext";
import { useEffect, useRef } from "react";
import { Layer, LeafletEvent, PathOptions } from "leaflet";
import { zoomToFeature } from "../../utils/map/MapUtil";
import { selectedStyle, highlightedStyle } from "./constants";

// Renders subcatchment hillslope polygons and binds hover-only tooltips
export default function SubcatchmentLayer({
  data,
  style,
  coverageActive,
  coverageKey,
  tooltipContent,
}: {
  data: GeoJSON.FeatureCollection;
  coverageActive: boolean;
  coverageKey: string;
  style: (
    feature:
      | GeoJSON.Feature<GeoJSON.Geometry, SubcatchmentProperties>
      | undefined,
  ) => PathOptions;
  tooltipContent: (props: Partial<SubcatchmentProperties>) => string;
}) {
  const map = useMap();

  const { setSelectedHillslope, clearSelectedHillslope } = useWatershed();

  const styleRef = useRef(style);
  const coverageActiveRef = useRef(coverageActive);
  const tooltipContentRef = useRef(tooltipContent);

  useEffect(() => {
    styleRef.current = style;
    coverageActiveRef.current = coverageActive;
    tooltipContentRef.current = tooltipContent;
  }, [style, coverageActive, tooltipContent]);

  // Track selected feature id and layer using refs so event handlers
  // can read/update the current selection at event time without forcing rerenders.
  const selectedIdRef = useRef<string | null>(null);

  const selectedLayerRef = useRef<{
    layer: LeafletEvent["target"];
    feature: GeoJSON.Feature<GeoJSON.Geometry, SubcatchmentProperties> | null;
  } | null>(null);

  // Track all layers for updating styles
  const layersRef = useRef<
    Map<
      string,
      {
        layer: Layer;
        feature: GeoJSON.Feature<GeoJSON.Geometry, SubcatchmentProperties>;
      }
    >
  >(new Map());

  const setSelection = (
    id: string | null,
    layer?: LeafletEvent["target"],
    feature?: GeoJSON.Feature<GeoJSON.Geometry, SubcatchmentProperties> | null,
  ) => {
    selectedIdRef.current = id;
    if (id && layer) {
      selectedLayerRef.current = { layer, feature: feature ?? null };
    } else {
      selectedLayerRef.current = null;
    }
  };

  useEffect(() => {
    layersRef.current.forEach(({ layer, feature }) => {
      const fid = feature?.id?.toString?.() ?? null;
      if (selectedIdRef.current !== fid) {
        (layer as LeafletEvent["target"]).setStyle(styleRef.current(feature));
      }
    });
  }, [coverageKey]);

  return (
    <GeoJSON
      key={coverageKey}
      data={data}
      style={style}
      onEachFeature={(feature, layer) => {
        const props = feature.properties ?? {};
        const fid = feature?.id?.toString?.() ?? null;

        if (fid) {
          layersRef.current.set(fid, { layer, feature });
        }

        layer.bindTooltip(tooltipContentRef.current(props), {
          className: "tooltip",
          offset: [12, -50],
        });

        layer.on({
          click: (e) => {
            const clickFid = feature?.id?.toString?.() ?? null;

            if (selectedIdRef.current === clickFid) {
              e.target.setStyle(styleRef.current(feature));
              setSelection(null);
              clearSelectedHillslope();
            } else {
              if (selectedLayerRef.current) {
                selectedLayerRef.current.layer.setStyle(
                  styleRef.current(
                    selectedLayerRef.current.feature ?? undefined,
                  ),
                );
              }

              // Set new selection
              e.target.setStyle(selectedStyle);
              setSelection(clickFid, e.target, feature);
              setSelectedHillslope(feature.properties.topazid);
            }

            zoomToFeature(map, layer);
          },
        });
        layer.on({
          mouseover: (e) => {
            const hoverFid = feature?.id?.toString?.() ?? null;

            if (selectedIdRef.current === hoverFid) {
              e.target.setStyle(selectedStyle);
            } else if (coverageActiveRef.current) {
              const currentStyle = styleRef.current(feature);
              e.target.setStyle({
                ...currentStyle,
                weight: 3,
                color: "#ffffff",
              });
            } else {
              e.target.setStyle(highlightedStyle);
            }

            // Refresh tooltip content so data updates are reflected
            layer.setTooltipContent(tooltipContentRef.current(props));
            layer.openTooltip();
          },
        });
        layer.on({
          mouseout: (e) => {
            const outFid = feature?.id?.toString?.() ?? null;

            if (selectedIdRef.current === outFid) {
              layer.closeTooltip();
            } else {
              e.target.setStyle(styleRef.current(feature));
              layer.closeTooltip();
            }
          },
        });
      }}
    />
  );
}
