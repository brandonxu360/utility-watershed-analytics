import { useMemo } from "react";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { tss } from "../../../utils/tss";
import type { RhessysSpatialFile } from "../../../api/types";

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
    maxHeight: 300,
    overflowY: "auto",
  },
  heading: {
    color: theme.palette.primary.contrastText,
    fontWeight: "bold",
    fontSize: theme.typography.body2.fontSize,
    marginBottom: theme.spacing(1),
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
  gradientContainer: {
    display: "flex",
    alignItems: "stretch",
  },
  gradientBar: {
    width: 24,
    height: 160,
    borderRadius: 3,
    border: `1px solid ${theme.palette.muted.main}`,
    flexShrink: 0,
  },
  labelsCol: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    marginLeft: theme.spacing(1),
    height: 160,
  },
}));

interface RhessysSpatialLegendProps {
  file: RhessysSpatialFile;
}

function formatNum(n: number): string {
  if (Math.abs(n) >= 1e6) return n.toExponential(2);
  if (Number.isInteger(n) || Math.abs(n) >= 100)
    return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
  return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

export default function RhessysSpatialLegend({
  file,
}: RhessysSpatialLegendProps) {
  const { classes } = useStyles();
  const legend = file.legend;

  const gradientCss = useMemo(() => {
    if (file.type !== "continuous" || !legend || legend.length < 2) return "";
    const stops = legend
      .slice()
      .reverse()
      .map((s) => s.hex)
      .join(", ");
    return `linear-gradient(to bottom, ${stops})`;
  }, [file.type, legend]);

  if (!legend || legend.length === 0) return null;

  return (
    <div
      className={classes.wrapper}
      role="region"
      aria-label="RHESSys spatial input legend"
    >
      <Paper className={classes.panel}>
        <Typography variant="h6" className={classes.heading}>
          {file.name}
        </Typography>

        {(file.type === "categorical" || file.type === "stream") && (
          <div className={classes.entries}>
            {legend.map((entry) => (
              <div key={entry.value} className={classes.entry}>
                <div
                  className={classes.swatch}
                  style={{ backgroundColor: entry.hex }}
                  aria-hidden="true"
                />
                <Typography className={classes.label}>{entry.value}</Typography>
              </div>
            ))}
          </div>
        )}

        {file.type === "continuous" && legend.length >= 2 && (
          <Box className={classes.gradientContainer}>
            <Box
              className={classes.gradientBar}
              sx={{ background: gradientCss }}
            />
            <Box className={classes.labelsCol}>
              <Typography className={classes.label}>
                {formatNum(legend[legend.length - 1].value)}
              </Typography>
              <Typography className={classes.label}>
                {formatNum(
                  (legend[0].value + legend[legend.length - 1].value) / 2,
                )}
              </Typography>
              <Typography className={classes.label}>
                {formatNum(legend[0].value)}
              </Typography>
            </Box>
          </Box>
        )}
      </Paper>
    </div>
  );
}
