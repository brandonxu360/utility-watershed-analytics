import { FC, ChangeEvent } from "react";
import { VegetationCover } from "../../../bottom-panels/VegetationCover";
import { useAppStore } from "../../../../store/store";
import { tss } from "../../../../utils/tss";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";

const useStyles = tss.create(({ theme }) => ({
  layers: {
    maxHeight: "120px",
    overflowY: "auto",
    padding: `${theme.spacing(0.5)} 0 ${theme.spacing(1)} 0`,
  },
  layer: {
    display: "flex",
    alignItems: "center",
    padding: `${theme.spacing(0.5)} ${theme.spacing(2)}`,
  },
  layerTitle: {
    fontSize: theme.typography.subtitle2.fontSize,
    color: theme.palette.primary.dark,
    fontWeight: 500,
    cursor: "pointer",
    flex: 1,
    textAlign: "left",
    textTransform: "none",
    justifyContent: "flex-start",
    background: "none",
  },
  layerCheckbox: {
    marginLeft: theme.spacing(1),
    color: theme.palette.primary.dark,
    "&.Mui-disabled": {
      color: theme.palette.muted.main,
      opacity: 0.85,
    },
  },
  helpIcon: {
    color: theme.palette.accent.main,
    fontSize: "16px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
  },
}));

type DataLayersTabContentProps = {
  activeTab: string;
  handleToggle: (id: string, checked: boolean) => void;
};

const DataLayersTabContent: FC<DataLayersTabContentProps> = ({
  activeTab,
  handleToggle,
}) => {
  const { classes } = useStyles();

  const { layerDesired, enableLayerWithParams, openPanel } = useAppStore();

  // Read desired state for checkbox checked values
  const subcatchmentChecked = layerDesired.subcatchment.enabled;
  const channelsChecked = layerDesired.channels.enabled;
  const landuseChecked = layerDesired.landuse.enabled;
  const sbsChecked = layerDesired.sbs.enabled;
  const choroplethMetric = layerDesired.choropleth.params.metric as
    | string
    | undefined;
  const choroplethEnabled = layerDesired.choropleth.enabled;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { id, checked } = e.target;
    handleToggle(id, checked);
  };

  return (
    <div className={classes.layers}>
      {activeTab === "WEPP Hillslopes" && (
        <>
          <div className={classes.layer}>
            <Button className={classes.layerTitle}>Subcatchments</Button>
            <Checkbox
              checked={subcatchmentChecked}
              onChange={handleChange}
              disabled={landuseChecked && subcatchmentChecked}
              className={classes.layerCheckbox}
              slotProps={{ input: { id: "subcatchment" } }}
            />
          </div>
          <div className={classes.layer}>
            <Button className={classes.layerTitle}>WEPP Channels</Button>
            <Checkbox
              checked={channelsChecked}
              onChange={handleChange}
              className={classes.layerCheckbox}
              slotProps={{ input: { id: "channels" } }}
            />
          </div>
        </>
      )}
      {activeTab === "Surface Data" && (
        <>
          <div className={classes.layer}>
            <Button className={classes.layerTitle}>Land Use (2025)</Button>
            <Checkbox
              checked={landuseChecked}
              onChange={handleChange}
              className={classes.layerCheckbox}
              slotProps={{ input: { id: "landuse" } }}
            />
          </div>
          <div className={classes.layer}>
            <Button
              className={classes.layerTitle}
              onClick={() => {}}
              style={{
                fontWeight:
                  choroplethEnabled && choroplethMetric === "evapotranspiration"
                    ? "bold"
                    : "normal",
              }}
            >
              Evapotranspiration
            </Button>
          </div>
        </>
      )}
      {activeTab === "Coverage" && (
        <>
          <div className={classes.layer}>
            <Button
              className={classes.layerTitle}
              onClick={() => {
                enableLayerWithParams("choropleth", {
                  metric: "vegetationCover",
                });
                openPanel(<VegetationCover />);
              }}
            >
              Vegetation Cover
            </Button>
          </div>
        </>
      )}
      {activeTab === "Soil Burn" && (
        <>
          <div className={classes.layer}>
            <Button className={classes.layerTitle}>Fire Severity</Button>
            <Checkbox
              onChange={handleChange}
              className={classes.layerCheckbox}
              slotProps={{ input: { id: "fireSeverity" } }}
            />
          </div>
          <div className={classes.layer}>
            <Button className={classes.layerTitle}>Soil Burn Severity</Button>
            <Checkbox
              checked={sbsChecked}
              onChange={handleChange}
              className={classes.layerCheckbox}
              slotProps={{ input: { id: "soilBurnSeverity" } }}
            />
          </div>
          <div className={classes.layer}>
            <Button className={classes.layerTitle}>Predict</Button>
          </div>
        </>
      )}
    </div>
  );
};

export default DataLayersTabContent;
