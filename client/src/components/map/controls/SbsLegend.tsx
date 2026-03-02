import { useQuery } from "@tanstack/react-query";
import { Paper, Switch, Typography } from "@mui/material";
import { tss } from "../../../utils/tss";
import { useWatershed } from "../../../contexts/WatershedContext";
import { fetchSbsColormap } from "../../../api/sbsApi";
import type { SbsColorMode } from "../../../api/types";

const useStyles = tss.create(({ theme }) => ({
  wrapper: {
    position: "absolute",
    left: 10,
    top: 60,
    zIndex: 1200,
    maxWidth: 240,
  },
  panel: {
    background: theme.palette.surface.overlay,
    color: theme.palette.primary.contrastText,
    padding: theme.spacing(1.5),
    borderRadius: 6,
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing(1),
  },
  heading: {
    color: theme.palette.primary.contrastText,
    fontWeight: "bold",
    fontSize: theme.typography.body2.fontSize,
  },
  toggle: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(0.5),
  },
  toggleLabel: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.palette.primary.contrastText,
    whiteSpace: "nowrap",
  },
  entries: {
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(0.75),
  },
  entry: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1.5),
  },
  swatch: {
    width: 20,
    height: 20,
    border: `1px solid ${theme.palette.muted.main}`,
    borderRadius: 3,
    flex: "0 0 20px",
  },
  label: {
    fontSize: theme.typography.subtitle1.fontSize,
    color: theme.palette.primary.contrastText,
  },
}));

/**
 * SbsLegend — floating map legend for the SBS (Soil Burn Severity) raster overlay.
 *
 * Fetches colormap metadata from the backend so the legend always matches the
 * rendered tiles (both use the same server-side colour definitions).
 *
 * Includes a toggle for switching between the legacy palette and the
 * Okabe-Ito colorblind-safe palette. Toggling updates the global
 * `sbsColorMode` in the store, which propagates to the {@link SbsLayer}
 * tile URL and re-renders the tiles consistently.
 */
export default function SbsLegend() {
  const { classes } = useStyles();
  const { layerDesired, dispatchLayerAction } = useWatershed();
  const sbsColorMode =
    (layerDesired.sbs.params.mode as SbsColorMode) ?? "legacy";

  const { data, isLoading, isError } = useQuery({
    queryKey: ["sbs-colormap", sbsColorMode],
    queryFn: () => fetchSbsColormap(sbsColorMode),
  });

  return (
    <div
      className={classes.wrapper}
      role="region"
      aria-label="Soil Burn Severity legend"
    >
      <Paper className={classes.panel}>
        <div className={classes.header}>
          <Typography variant="h6" className={classes.heading}>
            Soil Burn Severity
          </Typography>
          <div className={classes.toggle}>
            <Typography className={classes.toggleLabel}>Colorblind</Typography>
            <Switch
              size="small"
              checked={sbsColorMode === "shift"}
              onChange={(_, checked) =>
                dispatchLayerAction({
                  type: "SET_PARAM",
                  id: "sbs",
                  key: "mode",
                  value: checked ? "shift" : "legacy",
                })
              }
              inputProps={{
                "aria-label": "Colorblind-friendly palette toggle",
              }}
            />
          </div>
        </div>

        <div className={classes.entries}>
          {isLoading && (
            <Typography className={classes.label}>Loading…</Typography>
          )}
          {isError && (
            <Typography className={classes.label}>
              Could not load legend.
            </Typography>
          )}
          {data?.entries.map((entry) => (
            <div
              key={entry.class_value}
              className={classes.entry}
              data-testid="sbs-legend-entry"
            >
              <div
                className={classes.swatch}
                style={{ background: entry.hex }}
                aria-hidden="true"
              />
              <Typography className={classes.label}>{entry.label}</Typography>
            </div>
          ))}
        </div>
      </Paper>
    </div>
  );
}
