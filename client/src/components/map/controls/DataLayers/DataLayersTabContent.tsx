import { FC, ChangeEvent } from "react";
import { useWatershed } from "../../../../contexts/WatershedContext";
import { getDependents } from "../../../../layers/registry";
import type { LayerId, DesiredMap } from "../../../../layers/types";
import { tss } from "../../../../utils/tss";
import { Typography } from "@mui/material";
import Checkbox from "@mui/material/Checkbox";

/**
 * Returns true when any layer that `requires` the given layer is currently
 * enabled.  Used to disable the checkbox so users can't accidentally
 * cascade-disable a dependency chain.
 */
function hasActiveDependents(id: LayerId, desired: DesiredMap): boolean {
  return getDependents(id).some((depId) => desired[depId].enabled);
}
import Radio from "@mui/material/Radio";

const useStyles = tss.create(({ theme }) => ({
  layers: {
    maxHeight: "375px",
    overflowY: "auto",
    padding: `${theme.spacing(0.5)} 0 ${theme.spacing(1)} 0`,
  },
  heading: {
    fontSize: theme.typography.subtitle2.fontSize,
    fontWeight: 600,
    color: theme.palette.primary.dark,
    padding: `${theme.spacing(1)} ${theme.spacing(2)} 0 ${theme.spacing(2)}`,
  },
  layer: {
    display: "flex",
    alignItems: "center",
    padding: `${theme.spacing(0.5)} ${theme.spacing(2)}`,
  },
  layerTitle: {
    fontSize: theme.typography.subtitle2.fontSize,
    color: theme.palette.primary.dark,
    flex: 1,
    paddingLeft: theme.spacing(1.5),
  },
  layerCheckbox: {
    marginLeft: theme.spacing(1),
    color: theme.palette.primary.dark,
    "&.Mui-disabled": {
      color: theme.palette.muted.main,
      opacity: 0.85,
    },
  },
  variableRow: {
    display: "flex",
    alignItems: "center",
    padding: `${theme.spacing(0.25)} ${theme.spacing(2)} ${theme.spacing(0.25)} ${theme.spacing(4)}`,
  },
  variableTitle: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.palette.primary.dark,
    flex: 1,
    paddingLeft: theme.spacing(1),
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

  const { layerDesired, enableLayerWithParams } = useWatershed();

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
      {activeTab === "WEPP" && (
        <>
          <div className={classes.layer}>
            <Typography className={classes.layerTitle}>
              Subcatchments
            </Typography>
            <Checkbox
              checked={subcatchmentChecked}
              onChange={handleChange}
              disabled={hasActiveDependents("subcatchment", layerDesired)}
              className={classes.layerCheckbox}
              slotProps={{ input: { id: "subcatchment" } }}
            />
          </div>
          <div className={classes.layer}>
            <Typography className={classes.layerTitle}>Channels</Typography>
            <Checkbox
              checked={channelsChecked}
              onChange={handleChange}
              className={classes.layerCheckbox}
              slotProps={{ input: { id: "channels" } }}
            />
          </div>

          {/* Scenario toggles */}
          {AVAILABLE_SCENARIOS.map((scenario) => (
            <div key={scenario} className={classes.layer}>
              <Typography className={classes.layerTitle}>
                {formatScenarioLabel(scenario)}
              </Typography>
              <Checkbox
                checked={selectedScenario === scenario}
                onChange={() => handleScenarioChange(scenario)}
                disabled={scenarioLoading || hasActiveDataLayer}
                className={classes.layerCheckbox}
                slotProps={{ input: { id: scenario } }}
              />
            </div>
          ))}

          {/* Variable selection - shown when a scenario is active */}
          {hasScenario && (
            <>
              <Typography className={classes.heading}>Variable</Typography>
              {SCENARIO_VARIABLES.map((variable) => (
                <div key={variable} className={classes.variableRow}>
                  <Typography className={classes.variableTitle}>
                    {SCENARIO_VARIABLE_CONFIG[variable].label}
                  </Typography>
                  <Radio
                    checked={scenarioVariable === variable}
                    onChange={() => handleVariableChange(variable)}
                    size="small"
                    slotProps={{ input: { id: `variable-${variable}` } }}
                  />
                </div>
              ))}
            </>
          )}
        </>
      )}
      {activeTab === "Watershed Data" && (
        <>
          <div className={classes.layer}>
            <Typography className={classes.layerTitle}>
              Land Use (2025)
            </Typography>
            <Checkbox
              checked={landuseChecked}
              onChange={handleChange}
              disabled={vegetation || hasScenario}
              className={classes.layerCheckbox}
              slotProps={{ input: { id: "landuse" } }}
            />
          </div>
          <div className={classes.layer}>
            <Button
              className={classes.layerTitle}
              onClick={() => { }}
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
                // Enabling choropleth causes ActiveBottomPanel to render VegetationCover
                enableLayerWithParams("choropleth", {
                  metric: "vegetationCover",
                });
              }}
            >
              Vegetation Cover
            </Typography>
            <Checkbox
              checked={vegetation}
              onChange={handleChange}
              disabled={hasScenario}
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
              disabled={hasScenario}
              className={classes.layerCheckbox}
              slotProps={{ input: { id: "sbs" } }}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default DataLayersTabContent;
