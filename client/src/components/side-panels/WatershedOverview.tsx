import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useRunId } from "../../hooks/useRunId";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../api/queryKeys";
import { fetchWatersheds } from "../../api/api";
import { fetchRhessysSpatialInputs } from "../../api/rhessysApi";
import { API_ENDPOINTS } from "../../api/apiEndpoints";
import { WatershedProperties } from "../../types/WatershedProperties";
import { tss } from "../../utils/tss";
import { toast } from "react-toastify";
import Typography from "@mui/material/Typography";
import Skeleton from "@mui/material/Skeleton";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import DownloadIcon from "@mui/icons-material/Download";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import { alpha } from "@mui/material/styles";
import WeppSection from "./sections/WeppSection";
import WatershedDataSection from "./sections/WatershedDataSection";
import RhessysSection from "./sections/RhessysSection";
import RhessysOutputsSection from "./sections/RhessysOutputsSection";
import { useRhessysOutputsData } from "../../hooks/useRhessysOutputsData";

const useStyles = tss.create(({ theme }) => ({
  root: {
    paddingBottom: theme.spacing(4),
  },
  contentBox: {
    marginTop: theme.spacing(2),
  },
  modelsBox: {
    marginTop: theme.spacing(3),
  },
  impactPaper: {
    marginTop: theme.spacing(1.5),
    padding: theme.spacing(1.5),
    backgroundColor: theme.palette.primary.main,
    borderRadius: theme.shape.borderRadius,
  },
  sectionHeading: {
    fontWeight: 600,
    marginBottom: theme.spacing(1),
    fontSize: theme.typography.h6.fontSize,
  },
  sectionSubheading: {
    fontSize: theme.typography.body2.fontSize,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: theme.spacing(1),
    color: alpha(theme.palette.primary.contrastText, 0.9),
  },
  sectionSubgroup: {
    padding: theme.spacing(1.25),
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${alpha(theme.palette.primary.contrastText, 0.2)}`,
    background:
      `linear-gradient(180deg, ${alpha(theme.palette.primary.contrastText, 0.1)} 0%, ${alpha(theme.palette.primary.contrastText, 0.04)} 100%)`,
  },
  sectionSubgroupControls: {
    marginBottom: theme.spacing(1.5),
  },
  sectionSubgroupLinks: {
    marginTop: theme.spacing(1.5),
  },
  sectionDivider: {
    borderColor: alpha(theme.palette.primary.contrastText, 0.24),
    marginTop: theme.spacing(1.5),
    marginBottom: theme.spacing(1.5),
  },
  emptyState: {
    fontSize: theme.typography.body2.fontSize,
    color: theme.palette.text.secondary,
    fontStyle: "italic",
  },
  title: {
    marginBottom: theme.spacing(1.5),
    fontSize: theme.typography.h2.fontSize,
  },
  titleMulti: {
    marginBottom: theme.spacing(1),
    fontSize: `calc((${theme.typography.h2.fontSize} + ${theme.typography.h3.fontSize}) / 2)`,
  },
  paragraph: {
    marginBottom: theme.spacing(2),
    fontSize: theme.typography.h6.fontSize,
  },
  actionLink: {
    fontSize: theme.typography.body2.fontSize,
    color: theme.palette.accent.light,
    textAlign: "left",
    cursor: "pointer",
    display: "block",
    marginBottom: theme.spacing(1.5),
    textDecorationColor: theme.palette.accent.light,
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
  titleHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  reportDropdownWrapper: {
    marginBottom: theme.spacing(1.5),
  },
  reportDropdownHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    textAlign: "left",
    cursor: "pointer",
    backgroundColor: "transparent",
    color: "inherit",
    font: "inherit",
    appearance: "none",
    WebkitAppearance: "none",
    padding: theme.spacing(0.75, 1),
    border: `1px solid ${alpha(theme.palette.primary.contrastText, 0.28)}`,
    borderRadius: theme.shape.borderRadius,
    "&:hover": {
      backgroundColor: alpha(theme.palette.primary.contrastText, 0.12),
    },
  },
  reportDropdownLabel: {
    fontSize: theme.typography.body2.fontSize,
    fontWeight: 600,
  },
  reportDropdownLinks: {
    paddingLeft: theme.spacing(1),
    paddingTop: theme.spacing(0.75),
  },
  linksHint: {
    fontSize: theme.typography.body2.fontSize,
    color: alpha(theme.palette.primary.contrastText, 0.82),
    marginBottom: theme.spacing(1),
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

const MILLCREEK_RUN_ID = "mdobre-invincible-scarab";

export default function WatershedOverview() {
  const { classes } = useStyles();
  const navigate = useNavigate();

  const runId = useRunId();
  const [rxfireOpen, setRxfireOpen] = useState(false);

  const { data: spatialData, isLoading: rhessysLoading } = useQuery({
    queryKey: queryKeys.rhessysSpatialInputs.byRun(runId ?? ""),
    queryFn: ({ signal }) => fetchRhessysSpatialInputs(runId!, signal),
    enabled: !!runId,
  });

  const spatialFiles = spatialData?.files ?? [];

  const {
    scenarios: outputScenarios,
    isLoading: outputsLoading,
    hasChoroplethData,
  } = useRhessysOutputsData(runId);

  const {
    data: watersheds,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.watersheds.all,
    queryFn: fetchWatersheds,
  });

  const watershed = useMemo(() => {
    if (!watersheds?.features || !runId) return null;
    return watersheds.features.find(
      (feature: GeoJSON.Feature<GeoJSON.Geometry, WatershedProperties>) =>
        feature.id && feature.id.toString() === runId,
    );
  }, [watersheds?.features, runId]);

  const hasNoLongTermData =
    !rhessysLoading &&
    !outputsLoading &&
    spatialFiles.length === 0 &&
    outputScenarios.length === 0 &&
    !hasChoroplethData;

  const hasMultipleUtilities =
    (watershed?.properties?.huc10_utility_count ?? 0) > 1;

  const utilityDisplayNames = useMemo(() => {
    const names = (watershed?.properties?.huc10_pws_names ?? "")
      .split(";")
      .map((name: string) => name.trim())
      .filter((name: string) => name.length > 0);

    return names.length > 0 ? names : [watershed?.properties?.pws_name ?? ""];
  }, [watershed?.properties?.huc10_pws_names, watershed?.properties?.pws_name]);

  if (isLoading) return <SkeletonWatershedPanel />;
  if (error) return <div>Error: {(error as Error).message}</div>;
  if (!watersheds?.features) return <div>No watershed data found.</div>;

  if (!watershed) {
    toast.error("Watershed not found.");
    navigate({ to: "/" });
  }

  return (
    <div className={classes.root}>
      <div className={classes.contentBox}>
        <div className={classes.titleHeader}>
          <div>
            {hasMultipleUtilities ? (
              utilityDisplayNames.map((name: string, i: number) => (
                <Typography key={i} variant="h6" className={classes.titleMulti}>
                  <strong>{name}</strong>
                </Typography>
              ))
            ) : (
              <Typography variant="h6" className={classes.title}>
                <strong>{watershed?.properties?.pws_name}</strong>
              </Typography>
            )}
          </div>
          <Tooltip title="Download watershed data (not yet implemented)">
            <span>
              <IconButton disabled aria-label="Download watershed data">
                <DownloadIcon />
              </IconButton>
            </span>
          </Tooltip>
        </div>
        <Typography variant="body1" className={classes.paragraph}>
          <strong>County: </strong>
          {watershed?.properties?.county_nam ?? "N/A"}
        </Typography>
        <Typography variant="body1" className={classes.paragraph}>
          <strong>Area: </strong>
          {watershed?.properties?.shape_area
            ? `${watershed?.properties?.shape_area.toFixed(2)}`
            : "N/A"}
        </Typography>
        <Typography variant="body1" className={classes.paragraph}>
          <strong>Source Name: </strong>
          {watershed?.properties?.srcname ?? "N/A"}
        </Typography>
        <Typography variant="body1" className={classes.paragraph}>
          <strong>Source Type: </strong>
          {watershed?.properties?.srctype ?? "N/A"}
        </Typography>
        {(watershed?.properties?.owner_type ||
          watershed?.properties?.pop_group ||
          watershed?.properties?.treat_type) && (
          <>
            <Typography variant="body1" className={classes.paragraph}>
              <strong>Water Utility Type: </strong>
              {watershed?.properties?.owner_type ?? "N/A"}
            </Typography>
            <Typography variant="body1" className={classes.paragraph}>
              <strong>Customers Served: </strong>
              {watershed?.properties?.pop_group ?? "N/A"}
            </Typography>
            <Typography variant="body1" className={classes.paragraph}>
              <strong>Treatment Processes: </strong>
              {watershed?.properties?.treat_type ?? "N/A"}
            </Typography>
          </>
        )}
      </div>

      <div className={classes.modelsBox}>
        <Typography variant="body1">
          <strong>Impact Assessment</strong>
        </Typography>

        <Paper elevation={0} className={classes.impactPaper}>
          <Typography variant="body1" className={classes.sectionHeading}>
            Stream flow and erosion
          </Typography>

          <div
            className={`${classes.sectionSubgroup} ${classes.sectionSubgroupControls}`}
          >
            <Typography className={classes.sectionSubheading}>
              Map Controls
            </Typography>
            <WeppSection />
          </div>

          <Divider className={classes.sectionDivider} />

          <div
            className={`${classes.sectionSubgroup} ${classes.sectionSubgroupLinks}`}
          >
            <Typography className={classes.sectionSubheading}>
              Links and Reports
            </Typography>
            <Typography className={classes.linksHint}>
              Open model dashboards and downloadable reports.
            </Typography>
            <Link
              href={runId ? API_ENDPOINTS.WEPP_DASHBOARD(runId) : undefined}
              target="_blank"
              rel="noopener noreferrer"
              className={classes.actionLink}
              underline="always"
              aria-label="View WEPP model dashboard"
            >
              View WEPP model dashboard
            </Link>
            <Link
              href={runId ? API_ENDPOINTS.WEPP_DEVAL_DETAILS(runId) : undefined}
              target="_blank"
              rel="noopener noreferrer"
              className={classes.actionLink}
              underline="always"
              aria-label="View WEPP interactive report"
            >
              View WEPP interactive report
            </Link>
            {runId === MILLCREEK_RUN_ID && (
              <div className={classes.reportDropdownWrapper}>
                <button
                  type="button"
                  className={classes.reportDropdownHeader}
                  onClick={() => setRxfireOpen((prev) => !prev)}
                  aria-expanded={rxfireOpen}
                  aria-controls="rxfire-links"
                >
                  <Typography className={classes.reportDropdownLabel}>
                    Site Specific Prescribed Fire Scenarios
                  </Typography>
                  {rxfireOpen ? (
                    <ExpandLessIcon fontSize="small" />
                  ) : (
                    <ExpandMoreIcon fontSize="small" />
                  )}
                </button>
                <Collapse in={rxfireOpen}>
                  <div id="rxfire-links" className={classes.reportDropdownLinks}>
                    <Link
                      href="https://wepp-in-the-woods.github.io/millcreek-rxfire-reports/MillCreek_RxFire_Report_Manager_Defined.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={classes.actionLink}
                      underline="always"
                    >
                      Manager Defined
                    </Link>
                    <Link
                      href="https://wepp-in-the-woods.github.io/millcreek-rxfire-reports/MillCreek_RxFire_Report_Stream_Order_2.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={classes.actionLink}
                      underline="always"
                    >
                      Stream Order 2
                    </Link>
                    <Link
                      href="https://wepp-in-the-woods.github.io/millcreek-rxfire-reports/MillCreek_RxFire_Report_Stream_Order_3.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={classes.actionLink}
                      underline="always"
                    >
                      Stream Order 3
                    </Link>
                  </div>
                </Collapse>
              </div>
            )}
          </div>
        </Paper>

        {hasNoLongTermData ? null : (
          <Paper elevation={0} className={classes.impactPaper}>
            <Typography variant="body1" className={classes.sectionHeading}>
              Water quality and vegetation growth
            </Typography>

            <div
              className={`${classes.sectionSubgroup} ${classes.sectionSubgroupControls}`}
            >
              <Typography className={classes.sectionSubheading}>
                Map Controls
              </Typography>
              <RhessysSection />
              <RhessysOutputsSection />
            </div>

            <Divider className={classes.sectionDivider} />

            <div
              className={`${classes.sectionSubgroup} ${classes.sectionSubgroupLinks}`}
            >
              <Typography className={classes.sectionSubheading}>
                Links and Reports
              </Typography>
              <Typography className={classes.linksHint}>
                No external reports are currently available for this section.
              </Typography>
            </div>
          </Paper>
        )}

        <Paper elevation={0} className={classes.impactPaper}>
          <Typography variant="body1" className={classes.sectionHeading}>
            Watershed Data
          </Typography>
          <WatershedDataSection />
        </Paper>
      </div>
    </div>
  );
}
