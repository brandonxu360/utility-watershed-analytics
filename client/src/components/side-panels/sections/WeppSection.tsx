import { ChangeEvent } from "react";
import { useRunId } from "../../../hooks/useRunId";
import { useWatershed } from "../../../contexts/WatershedContext";
import { useLayerToggle } from "../../../hooks/useLayerToggle";
import { useScenariosSummary } from "../../../hooks/useScenariosSummary";
import { hasActiveDependents } from "../../../layers/registry";
import { getLayerParams } from "../../../layers/types";

import {
  SCENARIO_VARIABLES,
  SCENARIO_VARIABLE_CONFIG,
  SCENARIO_DESCRIPTIONS,
  type ScenarioType,
  type ScenarioVariableType,
} from "../../../layers/scenario";

import { tss } from "../../../utils/tss";
import Typography from "@mui/material/Typography";
import Checkbox from "@mui/material/Checkbox";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select, { type SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

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
  scenarioGroup: {
    marginBottom: theme.spacing(0.5),
  },
  scenarioSelect: {
    color: theme.palette.primary.contrastText,
    "& .MuiSelect-select": {
      fontSize: theme.typography.body2.fontSize,
    },
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.palette.primary.contrastText,
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.palette.primary.contrastText,
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.palette.primary.contrastText,
    },
    "& .MuiSvgIcon-root": {
      color: theme.palette.primary.contrastText,
    },
  },
  scenarioSelectPaper: {
    maxHeight: 300,
  },
  scenarioFormControl: {
    marginTop: theme.spacing(0.5),
  },
  scenarioLabel: {
    color: theme.palette.primary.contrastText,
    "&.Mui-focused": {
      color: theme.palette.primary.contrastText,
    },
  },
  variableRow: {
    display: "flex",
    alignItems: "center",
    padding: `${theme.spacing(0.25)} 0`,
  },
  variableTitle: {
    fontSize: theme.typography.body2.fontSize,
    flex: 1,
    paddingLeft: theme.spacing(0.5),
  },
  variableHeading: {
    fontSize: theme.typography.body2.fontSize,
    flex: 1,
    paddingLeft: theme.spacing(0.5),
    fontWeight: 600,
  },
  radio: {
    color: theme.palette.primary.contrastText,
    "&.Mui-checked": {
      color: theme.palette.primary.contrastText,
    },
  },
  scenarioInfo: {
    display: "inline-flex",
    alignItems: "center",
    gap: theme.spacing(0.5),
    fontSize: theme.typography.caption.fontSize,
    color: theme.palette.common.white,
    background: theme.palette.accent.main,
    borderRadius: "999px",
    padding: `${theme.spacing(0.25)} ${theme.spacing(1)}`,
    cursor: "help",
    userSelect: "none" as const,
  },
  variableHeadingRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: theme.spacing(1.5),
    paddingBottom: theme.spacing(0.5),
  },
  tooltipBubble: {
    backgroundColor: theme.palette.accent.main,
    color: theme.palette.common.white,
    fontSize: theme.typography.caption.fontSize,
  },
  tooltipArrow: {
    color: theme.palette.accent.main,
  },
}));

export default function WeppSection() {
  const { classes } = useStyles();
  const toggle = useLayerToggle();

  const runId = useRunId();

  const {
    layerDesired,
    dispatchLayerAction,
    enableLayerWithParams,
    effective,
  } = useWatershed();

  const { data: scenariosSummary } = useScenariosSummary(runId);

  const availableScenarios = scenariosSummary ?? [];

  const subcatchmentChecked = layerDesired.subcatchment.enabled;
  const channelsChecked = layerDesired.channels.enabled;

  const scenarioParams = getLayerParams(layerDesired, "scenario");
  const selectedScenario = scenarioParams.scenario ?? null;
  const scenarioVariable = scenarioParams.variable ?? "sediment_yield";
  const scenarioEnabled = effective.scenario.enabled;
  const scenarioLoading = effective.scenario.loading;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    toggle(e.target.id, e.target.checked);
  };

  const handleScenarioSelect = (e: SelectChangeEvent) => {
    const value = e.target.value;
    if (value === "none") {
      dispatchLayerAction({ type: "TOGGLE", id: "scenario", on: false });
    } else {
      enableLayerWithParams("scenario", { scenario: value as ScenarioType });
    }
  };

  const handleVariableChange = (variable: ScenarioVariableType) => {
    dispatchLayerAction({
      type: "SET_PARAM",
      id: "scenario",
      key: "variable",
      value: variable,
    });
  };

  return (
    <>
      <div className={classes.scenarioGroup}>
        <FormControl fullWidth size="small" disabled={scenarioLoading} className={classes.scenarioFormControl}>
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
            onChange={handleScenarioSelect}
            className={classes.scenarioSelect}
            MenuProps={{ PaperProps: { className: classes.scenarioSelectPaper } }}
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
                title={SCENARIO_DESCRIPTIONS[selectedScenario] ?? ""}
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
        <Typography className={classes.layerTitle}>Subcatchments</Typography>
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
  );
}
