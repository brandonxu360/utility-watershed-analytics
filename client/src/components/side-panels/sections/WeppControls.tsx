import { useWatershed } from "../../../contexts/WatershedContext";
import { hasActiveDependents } from "../../../layers/registry";
import { getLayerParams } from "../../../layers/types";
import {
  SCENARIO_VARIABLES,
  SCENARIO_VARIABLE_CONFIG,
  SCENARIO_DESCRIPTIONS,
  type ScenarioType,
  type ScenarioVariableType,
} from "../../../api/types/scenario";
import { type ScenarioSummaryRow } from "../../../api/scenarioApi";
import { useStyles } from "../watershedStyles";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import Checkbox from "@mui/material/Checkbox";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

export function WeppControls({
  availableScenarios,
}: {
  availableScenarios: ScenarioSummaryRow[];
}) {
  const { classes } = useStyles();
  const {
    layerDesired,
    dispatchLayerAction,
    toggleLayer,
    enableLayerWithParams,
    effective,
  } = useWatershed();

  const {
    scenario: selectedScenario = null,
    variable: scenarioVariable = "sediment_yield",
  } = getLayerParams(layerDesired, "scenario");
  const scenarioEnabled = effective.scenario.enabled;
  const scenarioLoading = effective.scenario.loading;

  return (
    <>
      <div className={classes.scenarioGroup}>
        <FormControl
          fullWidth
          size="small"
          disabled={scenarioLoading}
          className={classes.scenarioFormControl}
        >
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
              !scenarioEnabled || !selectedScenario
                ? "none"
                : availableScenarios.length === 0
                  ? selectedScenario
                  : availableScenarios.some(
                        (s) => s.scenario === selectedScenario,
                      )
                    ? selectedScenario
                    : "none"
            }
            label="Scenario"
            onChange={(e) => {
              const value = e.target.value;
              if (value === "none") {
                dispatchLayerAction({
                  type: "TOGGLE",
                  id: "scenario",
                  on: false,
                });
              } else {
                enableLayerWithParams("scenario", {
                  scenario: value as ScenarioType,
                });
              }
            }}
            className={classes.scenarioSelect}
            MenuProps={{
              PaperProps: { className: classes.scenarioSelectPaper },
            }}
          >
            <MenuItem value="none">None</MenuItem>
            {availableScenarios.map((s) => (
              <MenuItem key={s.scenario} value={s.scenario}>
                {s.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {scenarioEnabled && selectedScenario && (
          <>
            <div className={classes.variableHeadingRow}>
              <Typography
                className={classes.variableHeading}
                id="scenario-variable-label"
              >
                Variable
              </Typography>
              <Tooltip
                title={
                  SCENARIO_DESCRIPTIONS[selectedScenario as ScenarioType] ?? ""
                }
                placement="top"
                arrow
                classes={{
                  tooltip: classes.tooltipBubble,
                  arrow: classes.tooltipArrow,
                }}
              >
                <Typography
                  className={classes.scenarioInfo}
                  tabIndex={0}
                  role="button"
                  aria-label="About this scenario"
                >
                  <InfoOutlinedIcon fontSize="inherit" />
                  About this scenario
                </Typography>
              </Tooltip>
            </div>
            <RadioGroup
              aria-labelledby="scenario-variable-label"
              name="scenario-variable"
              value={scenarioVariable}
              onChange={(e) =>
                dispatchLayerAction({
                  type: "SET_PARAM",
                  id: "scenario",
                  key: "variable",
                  value: e.target.value as ScenarioVariableType,
                })
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
            <Divider className={classes.sectionDivider} />
          </>
        )}
      </div>

      <div className={classes.layer}>
        <Typography className={classes.layerTitle}>Subcatchments</Typography>
        <Checkbox
          checked={layerDesired.subcatchment.enabled}
          onChange={(e) => toggleLayer(e.target.id, e.target.checked)}
          disabled={hasActiveDependents("subcatchment", layerDesired)}
          className={classes.layerCheckbox}
          slotProps={{ input: { id: "subcatchment" } }}
        />
      </div>
      <div className={classes.layer}>
        <Typography className={classes.layerTitle}>Channels</Typography>
        <Checkbox
          checked={layerDesired.channels.enabled}
          onChange={(e) => toggleLayer(e.target.id, e.target.checked)}
          className={classes.layerCheckbox}
          slotProps={{ input: { id: "channels" } }}
        />
      </div>
    </>
  );
}
