import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import parseGeoraster from "georaster";
import GeoRasterLayer from "georaster-layer-for-leaflet";
import Paper from "@mui/material/Paper";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select, { type SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Backdrop from "@mui/material/Backdrop";
import { tss } from "../utils/tss";
import { useIsSmallScreen } from "../hooks/useIsSmallScreen";
import SmallScreenNotice from "../components/SmallScreenNotice";
import geotiffStats from "../assets/gate_creek_input_files/geotiff_stats.json";
import "leaflet/dist/leaflet.css";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type StatsEntry = (typeof geotiffStats)[keyof typeof geotiffStats];

const geotiffOptions = Object.entries(geotiffStats)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([filename, info]) => ({
    value: filename, // full filename with .tif
    label: info.name,
  }));

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q2 = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q2;
    r = hue2rgb(p, q2, h + 1 / 3);
    g = hue2rgb(p, q2, h);
    b = hue2rgb(p, q2, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/** Rainbow: t=0 → blue (hue 240°), t=1 → red (hue 0°) */
function rainbowColor(t: number): [number, number, number] {
  t = Math.max(0, Math.min(1, t));
  const hue = ((1 - t) * 240) / 360;
  return hslToRgb(hue, 1.0, 0.5);
}

const CATEGORICAL_COLORS: [number, number, number][] = [
  [31, 119, 180],
  [255, 127, 14],
  [44, 160, 44],
  [214, 39, 40],
  [148, 103, 189],
  [140, 86, 75],
  [227, 119, 194],
  [127, 127, 127],
  [188, 189, 34],
  [23, 190, 207],
];

function buildCategoricalMap(
  uniqueValues: number[],
): Record<number, [number, number, number]> {
  const colorMap: Record<number, [number, number, number]> = {};
  uniqueValues.forEach((val, i) => {
    colorMap[val] = CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length];
  });
  return colorMap;
}

function formatNum(n: number): string {
  if (Math.abs(n) >= 1e6) return n.toExponential(2);
  if (Number.isInteger(n) || Math.abs(n) >= 100)
    return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
  return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

interface ContinuousLegend {
  type: "continuous";
  title: string;
  minVal: number;
  maxVal: number;
  isCanopyCover: boolean;
  isReversed: boolean;
}

interface CategoricalLegend {
  type: "categorical";
  title: string;
  items: { value: number | string; color: [number, number, number] }[];
}

interface StreamLegend {
  type: "stream";
  title: string;
}

type LegendInfo = ContinuousLegend | CategoricalLegend | StreamLegend | null;

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const useStyles = tss.create(({ theme }) => ({
  root: {
    display: "flex",
    flex: 1,
    height: "calc(100vh - 64px)",
    overflow: "hidden",
  },
  sidePanel: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    width: "30%",
    minWidth: 280,
    minHeight: 0,
    background: theme.palette.primary.dark,
    color: theme.palette.primary.contrastText,
  },
  sidePanelContent: {
    flex: 1,
    minHeight: 0,
    padding: `${theme.spacing(1)} ${theme.spacing(4)} 0`,
    boxSizing: "border-box",
    overflowY: "auto",
  },
  mapWrapper: {
    flex: 1,
    minHeight: 0,
    position: "relative",
    overflow: "hidden",
  },
  map: {
    width: "100%",
    height: "100%",
  },
}));

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SpatialInputsEg() {
  const { classes } = useStyles();
  const isSmallScreen = useIsSmallScreen();
  const [selectedLayer, setSelectedLayer] = useState("");
  const [loading, setLoading] = useState(false);
  const [legendInfo, setLegendInfo] = useState<LegendInfo>(null);

  // Refs for vanilla Leaflet map management
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const currentLayerRef = useRef<L.GridLayer | null>(null);
  const basinPolygonRef = useRef<L.GeoJSON | null>(null);
  const loadRequestIdRef = useRef(0);
  const legendCanvasRef = useRef<HTMLCanvasElement>(null);

  // --- Init map (once) ---
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      doubleClickZoom: false,
      scrollWheelZoom: true,
    }).setView([44.19, -122.48], 12);

    L.tileLayer(
      "https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
      {
        attribution: "&copy; Google",
        maxZoom: 20,
        subdomains: ["mt0", "mt1", "mt2", "mt3"],
      },
    ).addTo(map);

    L.control.scale({ metric: true, imperial: true }).addTo(map);

    // Load basin boundary via fetch (proven pattern)
    fetch("/src/assets/gate_creek_input_files/gate_creek.geojson")
      .then((r) => r.json())
      .then((geojson) => {
        const poly = L.geoJSON(geojson, {
          style: { color: "white", weight: 2, fill: false },
        }).addTo(map);
        map.fitBounds(poly.getBounds());
        basinPolygonRef.current = poly;
      })
      .catch((err) => console.error("Error loading basin GeoJSON:", err));

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // --- Layer change ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const removeCurrentLayer = () => {
      if (currentLayerRef.current) {
        map.removeLayer(currentLayerRef.current);
      }
      currentLayerRef.current = null;
    };

    const thisRequestId = ++loadRequestIdRef.current;

    removeCurrentLayer();

    if (!selectedLayer) {
      setLegendInfo(null);
      setLoading(false);
      return;
    }

    const stats: StatsEntry =
      geotiffStats[selectedLayer as keyof typeof geotiffStats];
    if (!stats || stats.min === null) return;

    const minVal =
      stats.group_min !== null ? stats.group_min : (stats.min as number);
    const maxVal =
      stats.group_max !== null ? stats.group_max : (stats.max as number);
    const range = maxVal - minVal;

    const isCategorical =
      stats.type === "categorical" && stats.unique_values != null;
    const catColorMap = isCategorical
      ? buildCategoricalMap(stats.unique_values!)
      : null;
    const isCanopyCover = stats.group === "canopy_cover";

    setLoading(true);

    (async () => {
      try {
        const response = await fetch(
          `/geotiffs/${selectedLayer}`,
        );
        const arrayBuffer = await response.arrayBuffer();
        const georaster = await parseGeoraster(arrayBuffer);

        if (thisRequestId !== loadRequestIdRef.current) return;

        const layer = new GeoRasterLayer({
          georaster,
          opacity: 0.7,
          resolution: 256,
          pixelValuesToColorFn: (values: number[]) => {
            const v = values[0];
            if (
              v === georaster.noDataValue ||
              v === null ||
              v === undefined ||
              isNaN(v)
            ) {
              return null;
            }

            if (selectedLayer === "tol_1000wbt_stream.tif") {
              return v === 1 ? "rgb(0,255,255)" : null;
            }

            if (
              (selectedLayer === "wbt_d8_slope.tif" ||
                selectedLayer === "wbt_slope.tif") &&
              v > 60
            )
              return null;

            let r: number, g: number, b: number;
            if (isCategorical && catColorMap) {
              const c = catColorMap[v];
              if (!c) return null;
              [r, g, b] = c;
            } else if (isCanopyCover) {
              if (v > 1.0) return null;
              const t = Math.max(0, Math.min(1, v));
              [r, g, b] = rainbowColor(1 - t);
            } else if (
              selectedLayer === "wbt_d8_slope.tif" ||
              selectedLayer === "wbt_slope.tif"
            ) {
              const t = v / 60;
              [r, g, b] = rainbowColor(t);
            } else {
              const t = range === 0 ? 0.5 : (v - minVal) / range;
              [r, g, b] = rainbowColor(t);
            }
            return `rgb(${r},${g},${b})`;
          },
        });

        if (thisRequestId !== loadRequestIdRef.current) return;

        layer.addTo(map);
        if (basinPolygonRef.current) basinPolygonRef.current.bringToFront();
        currentLayerRef.current = layer;

        // Build legend info
        if (selectedLayer === "tol_1000wbt_stream.tif") {
          setLegendInfo({ type: "stream", title: stats.name });
        } else if (isCategorical && catColorMap) {
          setLegendInfo({
            type: "categorical",
            title: stats.name,
            items: stats.unique_values!.map((val) => ({
              value: val,
              color: catColorMap[val],
            })),
          });
        } else {
          const isD8Slope =
            selectedLayer === "wbt_d8_slope.tif" ||
            selectedLayer === "wbt_slope.tif";
          setLegendInfo({
            type: "continuous",
            title: stats.name,
            minVal: isCanopyCover ? 0 : minVal,
            maxVal: isCanopyCover ? 1 : isD8Slope ? 60 : maxVal,
            isCanopyCover,
            isReversed: isCanopyCover,
          });
        }
      } catch (err: unknown) {
        if (thisRequestId !== loadRequestIdRef.current) return;
        console.error("Error loading GeoTIFF:", err);
      } finally {
        if (thisRequestId === loadRequestIdRef.current) {
          setLoading(false);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLayer]);

  // --- Draw legend canvas for continuous legend ---
  useEffect(() => {
    if (!legendInfo || legendInfo.type !== "continuous") return;
    const canvas = legendCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const h = canvas.height;
    for (let y = 0; y < h; y++) {
      const t = 1 - y / (h - 1);
      const [r, g, b] = rainbowColor(legendInfo.isReversed ? 1 - t : t);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(0, y, canvas.width, 1);
    }
  }, [legendInfo]);

  const handleChange = (event: SelectChangeEvent) => {
    setSelectedLayer(event.target.value);
  };

  if (isSmallScreen) {
    return <SmallScreenNotice />;
  }

  return (
    <div className={classes.root}>
      <Paper elevation={3} className={classes.sidePanel} square>
        <div className={classes.sidePanelContent}>
          <h1 style={{ fontWeight: "bold", fontSize: "1.5rem", marginTop: "1rem" }}>Gate Creek Watershed</h1>
          <h2>Spatial Inputs for RHESSys Model</h2>
          <FormControl fullWidth size="small" sx={{ mt: 2 }}>
            <InputLabel id="geotiff-select-label">Select a layer</InputLabel>
            <Select
              labelId="geotiff-select-label"
              id="geotiff-select"
              value={selectedLayer}
              label="Select a layer"
              onChange={handleChange}
            >
              {geotiffOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
      </Paper>
      <div className={classes.mapWrapper}>
        <Box ref={mapContainerRef} className={classes.map}>
          {/* Vanilla Leaflet map renders here */}
        </Box>
        {/* Legend panel */}
        {legendInfo && (
          <Paper
            elevation={4}
            sx={{
              position: "absolute",
              bottom: 30,
              right: 10,
              zIndex: 1000,
              p: "12px 16px",
              borderRadius: 2,
            }}
          >
            <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 1 }}>
              {legendInfo.title}
            </Typography>

            {legendInfo.type === "stream" && (
              <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                <Box
                  sx={{
                    width: 20,
                    height: 16,
                    border: "1px solid #999",
                    borderRadius: "2px",
                    mr: 1,
                    flexShrink: 0,
                    bgcolor: "rgb(0,255,255)",
                  }}
                />
                <Typography sx={{ fontSize: 12 }}>1</Typography>
              </Box>
            )}

            {legendInfo.type === "categorical" &&
              legendInfo.items.map((item) => (
                <Box
                  key={item.value}
                  sx={{ display: "flex", alignItems: "center", mb: 0.5 }}
                >
                  <Box
                    sx={{
                      width: 20,
                      height: 16,
                      border: "1px solid #999",
                      borderRadius: "2px",
                      mr: 1,
                      flexShrink: 0,
                      bgcolor: `rgb(${item.color[0]},${item.color[1]},${item.color[2]})`,
                    }}
                  />
                  <Typography sx={{ fontSize: 12 }}>{item.value}</Typography>
                </Box>
              ))}

            {legendInfo.type === "continuous" && (
              <Box sx={{ display: "flex", alignItems: "stretch" }}>
                <canvas
                  ref={legendCanvasRef}
                  width={30}
                  height={180}
                  style={{
                    border: "1px solid #999",
                    borderRadius: 2,
                    display: "inline-block",
                    verticalAlign: "top",
                  }}
                />
                <Box
                  sx={{
                    display: "inline-block",
                    verticalAlign: "top",
                    ml: 1,
                    height: 180,
                    position: "relative",
                    fontSize: 12,
                  }}
                >
                  <Typography
                    component="span"
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      fontSize: 12,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {legendInfo.isCanopyCover
                      ? "100%"
                      : formatNum(legendInfo.maxVal)}
                  </Typography>
                  <Typography
                    component="span"
                    sx={{
                      position: "absolute",
                      top: "50%",
                      left: 0,
                      transform: "translateY(-50%)",
                      fontSize: 12,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {legendInfo.isCanopyCover
                      ? "50%"
                      : formatNum((legendInfo.minVal + legendInfo.maxVal) / 2)}
                  </Typography>
                  <Typography
                    component="span"
                    sx={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      fontSize: 12,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {legendInfo.isCanopyCover
                      ? "0%"
                      : formatNum(legendInfo.minVal)}
                  </Typography>
                </Box>
              </Box>
            )}
          </Paper>
        )}

        <Backdrop
          open={loading}
          sx={{
            position: "absolute",
            zIndex: 2000,
            bgcolor: "rgba(0,0,0,0.4)",
          }}
        >
          <CircularProgress sx={{ color: "white" }} />
        </Backdrop>
      </div>
    </div>
  );
}
