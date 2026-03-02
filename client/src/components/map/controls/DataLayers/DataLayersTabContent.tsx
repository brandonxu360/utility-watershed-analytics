import { FC, ChangeEvent } from "react";
import { useWatershed } from "../../../../contexts/WatershedContext";
import { getDependents } from "../../../../layers/registry";
import {
  getLayerParams,
  type LayerId,
  type DesiredMap,
} from "../../../../layers/types";

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
import RadioGroup from "@mui/material/RadioGroup";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select, { type SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

/**
 * Returns true when any layer that `requires` the given layer is currently
 * enabled. Used to disable the checkbox so users can't accidentally
 * cascade-disable a dependency chain.
 */
function hasActiveDependents(id: LayerId, desired: DesiredMap): boolean {
  return getDependents(id).some((depId) => desired[depId].enabled);
}

const useStyles = tss.create(({ theme }) => ({
  layers: {
    maxHeight: "350px",
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
  scenarioGroup: {
    margin: `${theme.spacing(1)} ${theme.spacing(1.75)}`,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(0, 1),
  },
  scenarioSelect: {
    color: theme.palette.primary.dark,
    "& .MuiSelect-select": {
      fontSize: theme.typography.subtitle2.fontSize,
    },
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.palette.primary.dark,
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.palette.primary.dark,
    },
    "& .MuiSvgIcon-root": {
      color: theme.palette.primary.dark,
    },
  },
  scenarioLabel: {
    color: theme.palette.primary.dark,
    "&.Mui-focused": {
      color: theme.palette.primary.dark,
    },
  },
  variableRow: {
    display: "flex",
    alignItems: "center",
    padding: `${theme.spacing(0.25)} 0`,
  },
  variableTitle: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.palette.primary.dark,
    flex: 1,
    paddingLeft: theme.spacing(0.5),
  },
  radio: {
    color: theme.palette.primary.dark,
    "&.Mui-checked": {
      color: theme.palette.primary.dark,
    },
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

  /** Handle scenario select change. "none" disables the layer. */
  const handleScenarioSelect = (e: SelectChangeEvent) => {
    const value = e.target.value;
    if (value === "none") {
      dispatchLayerAction({ type: "TOGGLE", id: "scenario", on: false });
    } else {
      enableLayerWithParams("scenario", { scenario: value as ScenarioType });
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
          <div className={classes.scenarioGroup}>
            <FormControl fullWidth size="small" disabled={scenarioLoading}>
              <InputLabel
                id="scenario-select-label"
                className={classes.scenarioLabel}
              >
                Scenario
              </InputLabel>
              <Select
                labelId="scenario-select-label"
                id="scenario-select"
                value={
                  scenarioEnabled && selectedScenario
                    ? selectedScenario
                    : "none"
                }
                label="Scenario"
                onChange={handleScenarioSelect}
                className={classes.scenarioSelect}
                MenuProps={{
                  style: { zIndex: 10001 },
                  PaperProps: { style: { maxHeight: 150 } },
                }}
              >
                <MenuItem value="none">None</MenuItem>
                {AVAILABLE_SCENARIOS.map((scenario) => (
                  <MenuItem key={scenario} value={scenario}>
                    {formatScenarioLabel(scenario)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {scenarioEnabled && selectedScenario && (
              <>
                <Typography
                  className={classes.variableTitle}
                  sx={{ fontWeight: 600, pt: 1.5, pb: 0.5 }}
                  id="scenario-variable-label"
                >
                  Variable
                </Typography>
                <RadioGroup
                  aria-labelledby="scenario-variable-label"
                  name="scenario-variable"
                  value={scenarioVariable}
                  onChange={(e) =>
                    handleVariableChange(e.target.value as ScenarioVariableType)
                  }
                >
                  {SCENARIO_VARIABLES.map((variable) => (
                    <div key={variable} className={classes.variableRow}>
                      <Typography className={classes.variableTitle}>
                        {SCENARIO_VARIABLE_CONFIG[variable].label}
                      </Typography>
                      <Radio
                        className={classes.radio}
                        value={variable}
                        size="small"
                        slotProps={{ input: { id: `variable-${variable}` } }}
                      />
                    </div>
                  ))}
                </RadioGroup>
              </>
            )}
          </div>

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
