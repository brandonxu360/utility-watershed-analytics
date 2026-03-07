import { ChangeEvent } from "react";
import { useWatershed } from "../../../contexts/WatershedContext";
import { useLayerToggle } from "../../../hooks/useLayerToggle";
import { getLayerParams } from "../../../layers/types";
import { tss } from "../../../utils/tss";
import Typography from "@mui/material/Typography";
import Checkbox from "@mui/material/Checkbox";

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
}));

export default function WatershedDataSection() {
  const { classes } = useStyles();
  const toggle = useLayerToggle();

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
          Soil Burn Severity
        </Typography>
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
