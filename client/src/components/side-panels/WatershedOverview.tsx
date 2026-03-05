import { useMemo } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchWatersheds } from "../../api/api";
import { WatershedProperties } from "../../types/WatershedProperties";
import { tss } from "../../utils/tss";
import { useSidePanelAccordionStyles } from "./styles";
import { toast } from "react-toastify";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Link from "@mui/material/Link";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DataLayers from "./DataLayers";

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
    fontSize: theme.typography.h3.fontSize,
  },
  paragraph: {
    marginBottom: theme.spacing(2),
    fontSize: theme.typography.body1.fontSize,
  },
  actionLink: {
    fontSize: theme.typography.body2.fontSize,
    color: theme.palette.accent.main,
    textAlign: "left",
    cursor: "pointer",
    display: "block",
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
  const { classes: accordionClasses } = useSidePanelAccordionStyles();
  const navigate = useNavigate();

  const runId =
    useParams({
      from: "/watershed/$webcloudRunId",
      select: (params) => params?.webcloudRunId,
      shouldThrow: false,
    }) ?? null;

  const {
    data: watersheds,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["watersheds"],
    queryFn: fetchWatersheds,
  });

  const watershed = useMemo(() => {
    if (!watersheds?.features || !runId) return null;
    return watersheds.features.find(
      (feature: GeoJSON.Feature<GeoJSON.Geometry, WatershedProperties>) =>
        feature.id && feature.id.toString() === runId,
    );
  }, [watersheds?.features, runId]);

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
          <strong>County:</strong> {watershed?.properties?.county_nam ?? "N/A"}
        </Typography>
        <Typography variant="body1" className={classes.paragraph}>
          <strong>Area:</strong>{" "}
          {watershed?.properties?.shape_area
            ? `${watershed?.properties?.shape_area.toFixed(2)}`
            : "N/A"}
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
            <strong>Impact Assessment</strong>
          </Typography>
        </div>
        <div className={accordionClasses.accordionGroup} key={runId}>
          {/* Short Term Impact */}
          <Accordion className={accordionClasses.accordion} disableGutters>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="short-term-content"
              id="short-term-header"
              className={accordionClasses.accordionSummary}
            >
              <Typography
                component="span"
                variant="body2"
                className={accordionClasses.accordionSummaryLabel}
              >
                Short Term Impact
              </Typography>
            </AccordionSummary>
            <AccordionDetails className={accordionClasses.accordionDetails}>
              <Link
                href={`https://wepp.cloud/weppcloud/runs/${runId}/disturbed9002_wbt/gl-dashboard`}
                target="_blank"
                rel="noopener noreferrer"
                className={classes.actionLink}
                underline="hover"
                aria-label="View Detailed WEPP Model Results"
              >
                View Detailed WEPP Model Results
              </Link>
            </AccordionDetails>
          </Accordion>

          {/* Long Term Impact */}
          <Accordion className={accordionClasses.accordion} disableGutters>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="long-term-content"
              id="long-term-header"
              className={accordionClasses.accordionSummary}
            >
              <Typography
                component="span"
                variant="body2"
                className={accordionClasses.accordionSummaryLabel}
              >
                Long Term Impact
              </Typography>
            </AccordionSummary>
            <AccordionDetails className={accordionClasses.accordionDetails}>
              <Typography variant="body2" color="textSecondary">
                No features available yet.
              </Typography>
            </AccordionDetails>
          </Accordion>
        </div>
      </div>

      {/* Data Layers Content */}
      <DataLayers />
    </div>
  );
}
