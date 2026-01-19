import { useMap, GeoJSON } from "react-leaflet";
import { Properties } from "../../types/WatershedFeature";
import { useAppStore } from "../../store/store";
import { useEffect, useRef } from "react";
import { Layer, LeafletEvent, PathOptions } from "leaflet";
import { zoomToFeature } from "../../utils/map/MapUtil";
import { selectedStyle, highlightedStyle } from "./constants";

// Renders subcatchment hillslope polygons and binds hover-only tooltips
export default function SubcatchmentLayer({ data, style, choroplethActive, choroplethKey }: {
  data: GeoJSON.FeatureCollection
  choroplethActive: boolean
  choroplethKey: string
  style: (feature: GeoJSON.Feature<GeoJSON.Geometry, Properties> | undefined) => PathOptions
}) {
  const map = useMap();

  const { setSelectedHillslope, clearSelectedHillslope } = useAppStore();

  // Use refs to always access the latest style and choroplethActive values in event handlers
  const styleRef = useRef(style);
  const choroplethActiveRef = useRef(choroplethActive);

  useEffect(() => {
    styleRef.current = style;
    choroplethActiveRef.current = choroplethActive;
  }, [style, choroplethActive]);

  // Track selected feature id and layer using refs so event handlers
  // can read/update the current selection at event time without forcing rerenders.
  const selectedIdRef = useRef<string | null>(null);
  const selectedLayerRef = useRef<{
    layer: LeafletEvent['target'];
    feature: GeoJSON.Feature<GeoJSON.Geometry, Properties> | null;
  } | null>(null);

  // Track all layers for updating styles
  const layersRef = useRef<Map<string, { layer: Layer; feature: GeoJSON.Feature<GeoJSON.Geometry, Properties> }>>(new Map());

  const setSelection = (
    id: string | null,
    layer?: LeafletEvent['target'],
    feature?: GeoJSON.Feature<GeoJSON.Geometry, Properties> | null
  ) => {
    selectedIdRef.current = id;
    if (id && layer) {
      selectedLayerRef.current = { layer, feature: feature ?? null };
    } else {
      selectedLayerRef.current = null;
    }
  };

  // Update all layer styles when choropleth data changes
  useEffect(() => {
    layersRef.current.forEach(({ layer, feature }) => {
      const fid = feature?.id?.toString?.() ?? null;
      if (selectedIdRef.current !== fid) {
        (layer as LeafletEvent['target']).setStyle(styleRef.current(feature));
      }
    });
  }, [choroplethKey]);

  return (
    <GeoJSON
      key={choroplethKey}
      data={data}
      style={style}
      onEachFeature={(feature, layer) => {
        const props = feature.properties ?? {};
        const fid = feature?.id?.toString?.() ?? null;

        if (fid) {
          layersRef.current.set(fid, { layer, feature });
        }

        layer.bindTooltip(
          `<span class="tooltip-bold"><strong>Hillslope ID</strong>
          <br/>TopazID: ${props.topazid ?? 'N/A'}, WeppID: ${props.weppid ?? 'N/A'}
          <br/><strong>Width:</strong>
          ${props.width?.toFixed(2) ?? 'N/A'} m
          <br/><strong>Length:</strong>
          ${props.length?.toFixed(2) ?? 'N/A'} m
          <br/><strong>Area:</strong>
          ${props.hillslope_area ?? 'N/A'} m²
          <br/><strong>Slope:</strong>
          ${props.slope_scalar?.toFixed(2) ?? 'N/A'}
          <br/><strong>Aspect:</strong>
          ${props.aspect?.toFixed(2) ?? 'N/A'}
          <br/><strong>Soil:</strong>
          ${props.simple_texture ?? 'N/A'}</span>`,
          {
            className: 'tooltip',
            offset: [12, -50],
          }
        );
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
                  styleRef.current(selectedLayerRef.current.feature ?? undefined)
                );
              }

              // Set new selection
              e.target.setStyle(selectedStyle);
              setSelection(clickFid, e.target, feature);
              setSelectedHillslope(feature.properties.topazid, feature.properties);
            }

            zoomToFeature(map, layer);
          }
        });
        layer.on({
          mouseover: (e) => {
            const hoverFid = feature?.id?.toString?.() ?? null;

            if (selectedIdRef.current === hoverFid) {
              e.target.setStyle(selectedStyle);
            } else if (choroplethActiveRef.current) {
              const currentStyle = styleRef.current(feature);
              e.target.setStyle({
                ...currentStyle,
                weight: 3,
                color: '#ffffff',
              });
            } else {
              e.target.setStyle(highlightedStyle);
            }

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