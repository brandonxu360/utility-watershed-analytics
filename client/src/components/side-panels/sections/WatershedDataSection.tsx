import { ChangeEvent } from "react";
import { useWatershed } from "../../../contexts/WatershedContext";
import { useLayerToggle } from "../../../hooks/useLayerToggle";
import { useRunId } from "../../../hooks/useRunId";
import { API_ENDPOINTS } from "../../../api/apiEndpoints";
import { getLayerParams } from "../../../layers/types";
import { tss } from "../../../utils/tss";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import Checkbox from "@mui/material/Checkbox";
import DownloadIcon from "@mui/icons-material/Download";

const useStyles = tss.create(({ theme }) => ({
  layer: {
    display: "flex",
    alignItems: "center",
    padding: `${theme.spacing(0.5)} 0`,
  },
  layerTitle: {
    fontSize: theme.typography.body2.fontSize,
    flex: 1,
  },
  layerCheckbox: {
    color: theme.palette.primary.contrastText,
    "&.Mui-checked": {
      color: theme.palette.primary.contrastText,
    },
    "&.Mui-disabled": {
      color: theme.palette.muted.main,
      opacity: 0.85,
    },
  },
  downloadButton: {
    color: theme.palette.primary.contrastText,
    padding: theme.spacing(0.5),
    "&:hover": {
      color: theme.palette.primary.light,
    },
  },
}));

export default function WatershedDataSection() {
  const { classes } = useStyles();
  const toggle = useLayerToggle();
  const runId = useRunId();

  const { layerDesired, enableLayerWithParams } = useWatershed();

  const landuseChecked = layerDesired.landuse.enabled;
  const sbsChecked = layerDesired.sbs.enabled;
  const choroplethEnabled = layerDesired.choropleth.enabled;
  const choroplethParams = getLayerParams(layerDesired, "choropleth");
  const choroplethMetric = choroplethParams.metric;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    toggle(e.target.id, e.target.checked);
  };

  return (
    <>
      <div className={classes.layer}>
        <Typography className={classes.layerTitle}>Land Use (2025)</Typography>
        <Checkbox
          checked={landuseChecked}
          onChange={handleChange}
          className={classes.layerCheckbox}
          slotProps={{ input: { id: "landuse" } }}
        />
      </div>
      <div className={classes.layer}>
        <Typography className={classes.layerTitle}>Vegetation Cover</Typography>
        <Checkbox
          checked={choroplethEnabled && choroplethMetric === "vegetationCover"}
          onChange={(e) => {
            if (e.target.checked) {
              enableLayerWithParams("choropleth", {
                metric: "vegetationCover",
              });
            } else {
              toggle("choropleth", false);
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
        {sbsChecked && runId && (
          <Tooltip title="Download SBS GeoTIFF">
            <IconButton
              className={classes.downloadButton}
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
          checked={sbsChecked}
          onChange={handleChange}
          className={classes.layerCheckbox}
          slotProps={{ input: { id: "sbs" } }}
        />
      </div>
    </>
  );
}
