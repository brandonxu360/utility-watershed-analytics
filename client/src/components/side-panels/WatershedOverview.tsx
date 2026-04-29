import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useRunId } from "../../hooks/useRunId";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../api/queryKeys";
import { fetchWatersheds } from "../../api/api";
import { API_ENDPOINTS } from "../../api/apiEndpoints";
import { WatershedProperties } from "../../types/WatershedProperties";
import { toast } from "react-toastify";
import { useWatershed } from "../../contexts/WatershedContext";
import { useRhessysSpatialInputs } from "../../hooks/useRhessysSpatialInputs";
import { useRhessysOutputs } from "../../hooks/useRhessysOutputs";
import { scenariosSummaryOptions } from "../../api/scenarioApi";
import { getLayerParams } from "../../layers/types";
import { useStyles } from "./watershedStyles";
import { WeppControls } from "./sections/WeppControls";
import { RhessysSpatialControls } from "./sections/RhessysSpatialControls";
import { RhessysOutputsControls } from "./sections/RhessysOutputsControls";
import Typography from "@mui/material/Typography";
import Skeleton from "@mui/material/Skeleton";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Checkbox from "@mui/material/Checkbox";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import DownloadIcon from "@mui/icons-material/Download";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import PanelStatus from "../PanelStatus";

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

  const { layerDesired, toggleLayer, enableLayerWithParams } = useWatershed();

  const {
    data: watersheds,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.watersheds.all,
    queryFn: fetchWatersheds,
  });

  // All hook calls live here so useLayerQuery side-effects fire exactly once.
  // The fetched data is passed as props to the sub-components below.
  const { files: rhessysSpatialFiles, isLoading: rhessysSpatialLoading } =
    useRhessysSpatialInputs(runId);

  const {
    scenarios: rhessysOutputScenarios,
    variables: rhessysOutputVariables,
    isLoading: rhessysOutputsLoading,
    hasChoroplethData,
  } = useRhessysOutputs(runId);

  const { data: scenariosSummary } = useQuery(scenariosSummaryOptions(runId));

  const watershed = useMemo(() => {
    if (!watersheds?.features || !runId) return null;
    return watersheds.features.find(
      (feature: GeoJSON.Feature<GeoJSON.Geometry, WatershedProperties>) =>
        feature.id && feature.id.toString() === runId,
    );
  }, [watersheds?.features, runId]);

  const hasNoLongTermData =
    !rhessysSpatialLoading &&
    !rhessysOutputsLoading &&
    rhessysSpatialFiles.length === 0 &&
    rhessysOutputScenarios.length === 0 &&
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
  if (error)
    return (
      <PanelStatus status="error" message={error ? error.message : undefined} />
    );
  if (!watersheds?.features)
    return <PanelStatus status="empty" message="No watershed data found." />;

  if (!watershed) {
    toast.error("Watershed not found.");
    navigate({ to: "/" });
  }

  return (
    <div className={classes.root}>
      {/* ── Watershed properties ───────────────────────────────────────── */}
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

        {/* ── Stream flow and erosion ───────────────────────────────────── */}
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
            <WeppControls availableScenarios={scenariosSummary ?? []} />
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
                  <div
                    id="rxfire-links"
                    className={classes.reportDropdownLinks}
                  >
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

        {/* ── Water quality and vegetation growth ──────────────────────── */}
        {!hasNoLongTermData && (
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

              <RhessysSpatialControls
                files={rhessysSpatialFiles}
                isLoading={rhessysSpatialLoading}
              />
              <RhessysOutputsControls
                scenarios={rhessysOutputScenarios}
                variables={rhessysOutputVariables}
                isLoading={rhessysOutputsLoading}
                hasChoroplethData={hasChoroplethData}
              />
            </div>
          </Paper>
        )}

        {/* ── Watershed Data ────────────────────────────────────────────── */}
        <Paper elevation={0} className={classes.impactPaper}>
          <Typography variant="body1" className={classes.sectionHeading}>
            Watershed Data
          </Typography>

          <div className={classes.layer}>
            <Typography className={classes.layerTitle}>
              Land Use (2025)
            </Typography>
            <Checkbox
              checked={layerDesired.landuse.enabled}
              onChange={(e) => toggleLayer(e.target.id, e.target.checked)}
              className={classes.layerCheckbox}
              slotProps={{ input: { id: "landuse" } }}
            />
          </div>
          <div className={classes.layer}>
            <Typography className={classes.layerTitle}>
              Vegetation Cover
            </Typography>
            <Checkbox
              checked={
                layerDesired.choropleth.enabled &&
                getLayerParams(layerDesired, "choropleth").metric ===
                  "vegetationCover"
              }
              onChange={(e) => {
                if (e.target.checked) {
                  enableLayerWithParams("choropleth", {
                    metric: "vegetationCover",
                  });
                } else {
                  toggleLayer("choropleth", false);
                }
              }}
              className={classes.layerCheckbox}
              slotProps={{ input: { id: "vegetationCover" } }}
            />
          </div>
          <div className={classes.layer}>
            <Typography className={classes.layerTitle}>
              Predicted Soil Burn Severity
            </Typography>
            {layerDesired.sbs.enabled && runId && (
              <Tooltip title="Download SBS GeoTIFF">
                <IconButton
                  className={classes.layerDownloadButton}
                  size="small"
                  aria-label="Download SBS GeoTIFF"
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = API_ENDPOINTS.SBS_TIFF_DOWNLOAD(runId);
                    link.target = "_blank";
                    link.rel = "noopener noreferrer";
                    link.download = "";
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                >
                  <DownloadIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Checkbox
              checked={layerDesired.sbs.enabled}
              onChange={(e) => toggleLayer(e.target.id, e.target.checked)}
              className={classes.layerCheckbox}
              slotProps={{ input: { id: "sbs" } }}
            />
          </div>
        </Paper>
      </div>
    </div>
  );
}
