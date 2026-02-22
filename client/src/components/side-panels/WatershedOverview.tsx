import { useMemo } from "react";
import { useMatch, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchWatersheds } from "../../api/api";
import { WatershedProperties } from "../../types/WatershedProperties";
import { useAppStore } from "../../store/store";
import { tss } from "../../utils/tss";
import { toast } from "react-toastify";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";

const useStyles = tss.create(({ theme }) => ({
  closeButton: {
    backgroundColor: theme.palette.error.main,
    color: theme.palette.primary.light,
    fontSize: theme.typography.body2.fontSize,
    marginTop: theme.spacing(1.5),
    marginBottom: theme.spacing(1),
    padding: `${theme.spacing(0.5)} ${theme.spacing(1)}`,
  },
  contentBox: {
    marginTop: theme.spacing(2),
  },
  modelsBox: {
    marginTop: theme.spacing(3),
  },
  title: {
    marginBottom: theme.spacing(1.5),
    fontSize: theme.typography.body1.fontSize,
  },
  paragraph: {
    marginBottom: theme.spacing(2),
    fontSize: theme.typography.body1.fontSize,
  },
  accordionGroup: {
    marginTop: theme.spacing(2),
    paddingBottom: theme.spacing(1.5),
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(1.5),
  },
  actionButton: {
    width: "100%",
    color: theme.palette.primary.contrastText,
    borderBottom: `1px solid ${theme.palette.primary.contrastText}`,
    padding: `${theme.spacing(1.5)} ${theme.spacing(2)}`,
    justifyContent: "flex-start",
    fontSize: theme.typography.body2.fontSize,
    "&:hover": {
      borderColor: theme.palette.accent.main,
    },
  },
  skeletonClose: {
    marginTop: theme.spacing(1.5),
    marginBottom: theme.spacing(2),
  },
  skeletonText: {
    marginBottom: theme.spacing(1),
  },
  skeletonParagraph: {
    marginBottom: theme.spacing(1.5),
  },
  skeletonGroup: {
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(1.5),
    marginTop: theme.spacing(4),
  },
}));

/**
 * Renders the "skeleton" version of the watershed panel while loading.
 */
function SkeletonWatershedPanel() {
  const { classes } = useStyles();
  return (
    <div data-testid="skeleton-panel">
      <Skeleton
        variant="rectangular"
        width="20%"
        height="1.75rem"
        className={classes.skeletonClose}
        data-testid="skeleton-close-button"
      />
      <Skeleton
        variant="text"
        width="60%"
        height="1.75rem"
        className={classes.skeletonText}
        data-testid="skeleton-title-text"
      />

      <Skeleton
        variant="text"
        width="90%"
        height="1.75rem"
        className={classes.skeletonParagraph}
      />
      <Skeleton
        variant="text"
        width="60%"
        height="1.75rem"
        className={classes.skeletonParagraph}
      />
      <Skeleton
        variant="text"
        width="60%"
        height="1.75rem"
        className={classes.skeletonParagraph}
      />
      <Skeleton
        variant="text"
        width="60%"
        height="1.75rem"
        className={classes.skeletonParagraph}
      />
      <Skeleton
        variant="text"
        width="60%"
        height="1.75rem"
        className={classes.skeletonParagraph}
      />
      <Skeleton
        variant="text"
        width="90%"
        height="1.75rem"
        className={classes.skeletonParagraph}
      />

      <div className={classes.skeletonGroup}>
        <Skeleton
          variant="rectangular"
          width="100%"
          height="3rem"
          data-testid="skeleton-button"
        />
        <Skeleton
          variant="rectangular"
          width="100%"
          height="3rem"
          data-testid="skeleton-button"
        />
        <Skeleton
          variant="rectangular"
          width="100%"
          height="3rem"
          data-testid="skeleton-button"
        />
        <Skeleton
          variant="rectangular"
          width="100%"
          height="3rem"
          data-testid="skeleton-button"
        />
      </div>
    </div>
  );
}

export default function WatershedOverview() {
  const { classes } = useStyles();
  const navigate = useNavigate();

  const { resetOverlays } = useAppStore();

  const match = useMatch({
    from: '/watershed/$webcloudRunId',
    shouldThrow: false,
  });
  const watershedID = match?.params.webcloudRunId ?? null;

  const {
    data: watersheds,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["watersheds"],
    queryFn: fetchWatersheds,
  });

  const watershed = useMemo(() => {
    if (!watersheds?.features || !watershedID) return null;
    return watersheds.features.find(
      (feature: GeoJSON.Feature<GeoJSON.Geometry, WatershedProperties>) =>
        feature.id && feature.id.toString() === watershedID,
    );
  }, [watersheds?.features, watershedID]);

  if (isLoading) return <SkeletonWatershedPanel />;
  if (error) return <div>Error: {(error as Error).message}</div>;
  if (!watersheds?.features) return <div>No watershed data found.</div>;

  if (!watershed) {
    toast.error("Watershed not found.");
    navigate({ to: "/" });
  }

  return (
    <div>
      <Button
        onClick={() => {
          navigate({ to: "/" });
          resetOverlays();
        }}
        className={classes.closeButton}
        aria-label="Close watershed panel"
        title="Close watershed panel"
        variant="contained"
      >
        BACK
      </Button>
      <div className={classes.contentBox}>
        <Typography variant="h6" className={classes.title}>
          <strong>{watershed?.properties?.pws_name}</strong>
        </Typography>
        <Typography variant="body1" className={classes.paragraph}>
          This is where the description for the watershed will go. For now we
          have placeholder text.
        </Typography>
        <Typography variant="body1" className={classes.paragraph}>
          <strong>County:</strong> {watershed?.properties?.county_nam ?? "N/A"}
        </Typography>
        <Typography variant="body1" className={classes.paragraph}>
          <strong>Area:</strong>{" "}
          {watershed?.properties?.shape_area
            ? `${watershed?.properties?.shape_area.toFixed(2)}`
            : "N/A"}
        </Typography>
        <Typography variant="body1" className={classes.paragraph}>
          <strong>Number of Customers:</strong>{" "}
          {watershed?.properties?.num_customers ?? "N/A"}
        </Typography>
        <Typography variant="body1" className={classes.paragraph}>
          <strong>Source Name:</strong>{" "}
          {watershed?.properties?.srcname ?? "N/A"}
        </Typography>
        <Typography variant="body1" className={classes.paragraph}>
          <strong>Source Type:</strong>{" "}
          {watershed?.properties?.srctype ?? "N/A"}
        </Typography>
      </div>

      <div className={classes.modelsBox}>
        <div>
          <Typography variant="body1">
            <strong>Watershed Models</strong>
          </Typography>
        </div>
        <div className={classes.accordionGroup} key={watershedID}>
          <Button
            className={classes.actionButton}
            aria-label="View Calibrated WEPP Results"
            title="View Calibrated WEPP Results"
            variant="text"
          >
            View Calibrated WEPP Results
          </Button>

          <Button
            className={classes.actionButton}
            aria-label="View Calibrated RHESSys Results"
            title="View Calibrated RHESSys Results"
            variant="text"
          >
            View Calibrated RHESSys Results
          </Button>

          <Button
            className={classes.actionButton}
            aria-label="View Detailed WEPP Model Results"
            title="View Detailed WEPP Model Results"
            variant="text"
            onClick={() =>
              window.open(
                `https://wepp.cloud/weppcloud/runs/${watershedID}/disturbed9002_wbt/gl-dashboard`,
                "_blank",
                "noopener,noreferrer",
              )
            }
          >
            View Detailed WEPP Model Results
          </Button>
        </div>
      </div>
    </div>
  );
}
