import { FC, ChangeEvent } from "react";
import { useWatershed } from "../../../../contexts/WatershedContext";
import { getDependents } from "../../../../layers/registry";
import { getLayerParams, type LayerId, type DesiredMap } from "../../../../layers/types";

import {
  AVAILABLE_SCENARIOS,
  SCENARIO_VARIABLES,
  SCENARIO_VARIABLE_CONFIG,
  formatScenarioLabel,
  type ScenarioType,
  type ScenarioVariableType,
} from "../../../../layers/scenario";

import { tss } from "../../../../utils/tss";
import { Typography } from "@mui/material";
import Checkbox from "@mui/material/Checkbox";
import Radio from "@mui/material/Radio";

/**
 * Returns true when any layer that `requires` the given layer is currently
 * enabled.  Used to disable the checkbox so users can't accidentally
 * cascade-disable a dependency chain.
 */
function hasActiveDependents(id: LayerId, desired: DesiredMap): boolean {
  return getDependents(id).some((depId) => desired[depId].enabled);
}

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
  const {
    layerDesired,
    dispatchLayerAction,
    enableLayerWithParams,
    effective,
  } = useWatershed();

  const subcatchmentChecked = layerDesired.subcatchment.enabled;
  const channelsChecked = layerDesired.channels.enabled;
  const landuseChecked = layerDesired.landuse.enabled;
  const sbsChecked = layerDesired.sbs.enabled;
  const choroplethEnabled = layerDesired.choropleth.enabled;
  const choroplethParams = getLayerParams(layerDesired, "choropleth");
  const choroplethMetric = choroplethParams.metric;

  const scenarioParams = getLayerParams(layerDesired, "scenario");
  const selectedScenario = scenarioParams.scenario ?? null;
  const scenarioVariable = scenarioParams.variable ?? "sediment_yield";
  const scenarioEnabled = layerDesired.scenario.enabled;
  const scenarioLoading = effective.scenario.loading;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { id, checked } = e.target;
    handleToggle(id, checked);
  };

  /** Toggle a scenario on/off. Toggling the same scenario off disables the layer. */
  const handleScenarioChange = (scenario: ScenarioType) => {
    if (selectedScenario === scenario) {
      dispatchLayerAction({ type: "TOGGLE", id: "scenario", on: false });
    } else {
      enableLayerWithParams("scenario", { scenario });
    }
  };

  /** Switch the active variable (runoff / sediment_yield). */
  const handleVariableChange = (variable: ScenarioVariableType) => {
    dispatchLayerAction({
      type: "SET_PARAM",
      id: "scenario",
      key: "variable",
      value: variable,
    });
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

          {/* Scenario checkboxes */}
          <Typography className={classes.heading}>Scenarios</Typography>
          {AVAILABLE_SCENARIOS.map((scenario) => (
            <div key={scenario} className={classes.layer}>
              <Typography className={classes.layerTitle}>
                {formatScenarioLabel(scenario)}
              </Typography>
              <Checkbox
                checked={scenarioEnabled && selectedScenario === scenario}
                onChange={() => handleScenarioChange(scenario)}
                disabled={scenarioLoading}
                className={classes.layerCheckbox}
                slotProps={{ input: { id: scenario } }}
              />
            </div>
          ))}

          {/* Variable selection — visible when a scenario is active */}
          {scenarioEnabled && selectedScenario && (
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
                choroplethEnabled && choroplethMetric === "vegetationCover"
              }
              onChange={(e) => {
                if (e.target.checked) {
                  enableLayerWithParams("choropleth", {
                    metric: "vegetationCover",
                  });
                } else {
                  handleToggle("choropleth", false);
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
      )}
    </div>
  );
};

export default DataLayersTabContent;
