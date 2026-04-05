import { CircularProgress } from "@mui/material";
import { tss } from "../../utils/tss";

const useStyles = tss.create(({ theme }) => ({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.palette.surface.overlay,
    color: theme.palette.text.primary,
    zIndex: 1000,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: theme.spacing(2),
  },
}));

interface MapLoadingOverlayProps {
  isLoading: boolean;
}

export default function MapLoadingOverlay({ isLoading }: MapLoadingOverlayProps) {
  const { classes } = useStyles();

  if (!isLoading) return null;

  return (
    <div className={classes.overlay} data-testid="map-loading-overlay">
      <CircularProgress size={50} color="inherit" />
    </div>
  );
}
