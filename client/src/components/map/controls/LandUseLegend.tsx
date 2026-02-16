import { tss } from "../../../utils/tss";
import { Paper, Typography } from "@mui/material";
import { useAppStore } from "../../../store/store";

const useStyles = tss.create(({ theme }) => ({
  landuseLegendWrapper: {
    position: "absolute",
    left: 10,
    top: 60,
    zIndex: 1200,
    maxWidth: 360,
  },
  landuseLegend: {
    background: theme.palette.surface.overlay,
    color: theme.palette.primary.contrastText,
    padding: theme.spacing(1.5),
    borderRadius: 6,
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
  },
  landuseLegendHeader: {
    display: "flex",
    alignItems: "center",
    fontWeight: "bold",
    gap: theme.spacing(0.5),
    marginBottom: theme.spacing(1),
  },
  landuseClose: {
    cursor: "pointer",
    color: theme.palette.primary.contrastText,
    padding: theme.spacing(0.5),
  },
  landuseLegendContent: {
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(1),
    overflow: "auto",
    maxHeight: "50vh",
  },
  landuseItem: {
    display: "flex",
    alignItems: "center",
    paddingRight: theme.spacing(2),
    gap: theme.spacing(1.5),
  },
  landuseSwatch: {
    width: 24,
    height: 24,
    border: `1px solid ${theme.palette.muted.main}`,
    borderRadius: 4,
    flex: "0 0 24px",
  },
  landuseDesc: {
    fontSize: theme.typography.subtitle1.fontSize,
    color: theme.palette.primary.contrastText,
  },
  landuseEmpty: {
    fontSize: theme.typography.subtitle2.fontSize,
    opacity: 0.85,
    color: theme.palette.primary.contrastText,
  },
  heading: {
    color: theme.palette.primary.contrastText,
    fontWeight: "bold",
    fontSize: theme.typography.body2.fontSize,
  },
}));

export default function LandUseLegend() {
  const { classes } = useStyles();

  const { landuseLegendVisible, landuseLegendMap } = useAppStore();

  if (!landuseLegendVisible) return null;

  return (
    <div
      className={classes.landuseLegendWrapper}
      role="region"
      aria-label="Land use legend"
    >
      <Paper className={classes.landuseLegend}>
        <div className={classes.landuseLegendHeader}>
          <Typography variant="h6" className={classes.heading}>
            Land Use Legend
          </Typography>
        </div>

        <div className={classes.landuseLegendContent}>
          {Object.entries(landuseLegendMap).length === 0 && (
            <Typography className={classes.landuseEmpty}>
              No legend data available.
            </Typography>
          )}

          {Object.entries(landuseLegendMap).map(([color, desc]) => (
            <div
              key={color}
              className={classes.landuseItem}
              data-testid="landuse-item"
            >
              <div
                className={classes.landuseSwatch}
                style={{ background: color }}
              />
              <Typography className={classes.landuseDesc}>{desc}</Typography>
            </div>
          ))}
        </div>
      </Paper>
    </div>
  );
}
