import { tss } from "../../../utils/tss";
import { useCallback, useMemo } from "react";
import PanelStatus from "../../PanelStatus";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select, { type SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { useWatershed } from "../../../contexts/WatershedContext";
import { useRunId } from "../../../hooks/useRunId";
import { useRhessysOutputs } from "../../../hooks/useRhessysOutputs";

import {
  getLayerParams,
  type RhessysOutputParams,
} from "../../../layers/types";

import {
  GATE_CREEK_VARIABLES,
  GATE_CREEK_SCENARIOS,
  GATE_CREEK_YEAR_RANGE,
} from "../../../api/constants";

const useStyles = tss.create(({ theme }) => ({
  select: {
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
  selectPaper: {
    maxHeight: 200,
  },
  formControl: {
    marginTop: theme.spacing(1.5),
  },
  label: {
    color: theme.palette.primary.contrastText,
    "&.Mui-focused": {
      color: theme.palette.primary.contrastText,
    },
  },
  toggleGroup: {
    marginTop: theme.spacing(1),
    "& .MuiToggleButton-root": {
      color: theme.palette.primary.contrastText,
      borderColor: theme.palette.primary.contrastText,
      fontSize: theme.typography.caption.fontSize,
      padding: `${theme.spacing(0.25)} ${theme.spacing(1)}`,
      "&.Mui-selected": {
        backgroundColor: theme.palette.primary.contrastText,
        color: theme.palette.primary.main,
        "&:hover": {
          backgroundColor: theme.palette.primary.contrastText,
        },
      },
    },
  },
}));

const years = Array.from(
  { length: GATE_CREEK_YEAR_RANGE.max - GATE_CREEK_YEAR_RANGE.min + 1 },
  (_, i) => GATE_CREEK_YEAR_RANGE.min + i,
);

export default function RhessysOutputsSection() {
  const { classes } = useStyles();

  const runId = useRunId();

  const { scenarios, variables, isLoading, hasChoroplethData } =
    useRhessysOutputs(runId);

  const {
    layerDesired,
    enableLayerWithParams,
    dispatchLayerAction,
    effective,
  } = useWatershed();

  const params = getLayerParams(layerDesired, "rhessysOutputs");
  const selectedScenario = params.scenario ?? null;
  const selectedVariable = params.variable ?? null;
  const selectedMode =
    params.mode ?? (scenarios.length > 0 ? "raster" : "choropleth");
  const selectedSpatialScale = params.spatialScale ?? "hillslope";
  const selectedYear = params.year ?? 2000;
  const layerEnabled = effective.rhessysOutputs.enabled;

  const hasRasterData = scenarios.length > 0;

  // Pre-computed maps: variables available for the selected scenario
  const currentScenarioMeta = scenarios.find((s) => s.id === selectedScenario);
  const availableVariables = currentScenarioMeta
    ? variables.filter((v) => currentScenarioMeta.variables.includes(v.id))
    : variables;

  // Dynamic choropleth: variables for current spatial scale
  const choroplethVariables = useMemo(
    () => GATE_CREEK_VARIABLES[selectedSpatialScale] ?? [],
    [selectedSpatialScale],
  );

  const currentParams = useMemo(
    () => ({
      scenario: selectedScenario,
      variable: selectedVariable,
      mode: selectedMode,
      spatialScale: selectedSpatialScale,
      year: selectedYear,
    }),
    [
      selectedScenario,
      selectedVariable,
      selectedMode,
      selectedSpatialScale,
      selectedYear,
    ],
  );

  const updateParams = useCallback(
    (overrides: Partial<RhessysOutputParams>) => {
      enableLayerWithParams("rhessysOutputs", {
        ...currentParams,
        ...overrides,
      });
    },
    [enableLayerWithParams, currentParams],
  );

  const turnOff = useCallback(() => {
    dispatchLayerAction({ type: "TOGGLE", id: "rhessysOutputs", on: false });
  }, [dispatchLayerAction]);

  const handleScenarioChange = useCallback(
    (event: SelectChangeEvent) => {
      const value = event.target.value;
      if (value === "none") return turnOff();
      updateParams({
        scenario: value,
        variable: selectedVariable || variables[0]?.id || null,
        mode: "raster",
        spatialScale: null,
        year: null,
      });
    },
    [updateParams, turnOff, selectedVariable, variables],
  );

  const handleVariableChange = useCallback(
    (event: SelectChangeEvent) => {
      updateParams({ variable: event.target.value });
    },
    [updateParams],
  );

  const handleSpatialScaleChange = useCallback(
    (
      _: React.MouseEvent<HTMLElement>,
      newScale: "hillslope" | "patch" | null,
    ) => {
      if (!newScale) return;

      const vars = GATE_CREEK_VARIABLES[newScale];
      const variableStillValid = vars.some((v) => v.id === selectedVariable);
      const nextVariable = variableStillValid
        ? selectedVariable
        : (vars[0]?.id ?? null);

      const nextParams: Partial<RhessysOutputParams> = {
        spatialScale: newScale,
        variable: nextVariable,
        mode: "choropleth",
      };

      if (layerEnabled) {
        updateParams(nextParams);
      } else {
        for (const [key, value] of Object.entries(nextParams)) {
          dispatchLayerAction({
            type: "SET_PARAM",
            id: "rhessysOutputs",
            key,
            value,
          });
        }
      }
    },
    [updateParams, dispatchLayerAction, layerEnabled, selectedVariable],
  );

  const handleChoroplethScenarioChange = useCallback(
    (event: SelectChangeEvent) => {
      const value = event.target.value;
      if (value === "none") return turnOff();
      updateParams({
        scenario: value,
        variable: selectedVariable || choroplethVariables[0]?.id || null,
        mode: "choropleth",
      });
    },
    [updateParams, turnOff, selectedVariable, choroplethVariables],
  );

  const handleChoroplethVariableChange = useCallback(
    (event: SelectChangeEvent) => {
      updateParams({ variable: event.target.value, mode: "choropleth" });
    },
    [updateParams],
  );

  const handleYearChange = useCallback(
    (event: SelectChangeEvent) => {
      updateParams({ year: Number(event.target.value), mode: "choropleth" });
    },
    [updateParams],
  );

  if (isLoading)
    return (
      <PanelStatus
        status="loading"
        size="sm"
        message="Checking for output data…"
      />
    );

  if (!hasRasterData && !hasChoroplethData) {
    return null;
  }

  // Pre-computed raster maps (Victoria + Mill Creek)
  if (hasRasterData && selectedMode !== "choropleth") {
    return (
      <>
        <FormControl fullWidth size="small" className={classes.formControl}>
          <InputLabel
            id="rhessys-outputs-scenario-label"
            className={classes.label}
          >
            Scenario
          </InputLabel>
          <Select
            labelId="rhessys-outputs-scenario-label"
            id="rhessys-outputs-scenario-select"
            value={layerEnabled && selectedScenario ? selectedScenario : "none"}
            label="Scenario"
            onChange={handleScenarioChange}
            className={classes.select}
            MenuProps={{ PaperProps: { className: classes.selectPaper } }}
          >
            <MenuItem value="none">None</MenuItem>
            {scenarios.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {layerEnabled && selectedScenario && (
          <FormControl fullWidth size="small" className={classes.formControl}>
            <InputLabel
              id="rhessys-outputs-variable-label"
              className={classes.label}
            >
              Variable
            </InputLabel>
            <Select
              labelId="rhessys-outputs-variable-label"
              id="rhessys-outputs-variable-select"
              value={selectedVariable || ""}
              label="Variable"
              onChange={handleVariableChange}
              className={classes.select}
              MenuProps={{ PaperProps: { className: classes.selectPaper } }}
            >
              {availableVariables.map((v) => (
                <MenuItem key={v.id} value={v.id}>
                  {v.label} ({v.units})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </>
    );
  }

  // Dynamic choropleth (Gate Creek)
  return (
    <>
      <FormControl fullWidth size="small" className={classes.formControl}>
        <InputLabel
          id="rhessys-choropleth-scenario-label"
          className={classes.label}
        >
          Scenario
        </InputLabel>
        <Select
          labelId="rhessys-choropleth-scenario-label"
          id="rhessys-choropleth-scenario-select"
          value={layerEnabled && selectedScenario ? selectedScenario : "none"}
          label="Scenario"
          onChange={handleChoroplethScenarioChange}
          className={classes.select}
          MenuProps={{ PaperProps: { className: classes.selectPaper } }}
        >
          <MenuItem value="none">None</MenuItem>
          {GATE_CREEK_SCENARIOS.map((s) => (
            <MenuItem key={s.id} value={s.id}>
              {s.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {layerEnabled && selectedScenario && (
        <>
          <FormControl fullWidth size="small" className={classes.formControl}>
            <InputLabel
              id="rhessys-choropleth-variable-label"
              className={classes.label}
            >
              Variable
            </InputLabel>
            <Select
              labelId="rhessys-choropleth-variable-label"
              id="rhessys-choropleth-variable-select"
              value={selectedVariable || ""}
              label="Variable"
              onChange={handleChoroplethVariableChange}
              className={classes.select}
              MenuProps={{ PaperProps: { className: classes.selectPaper } }}
            >
              {choroplethVariables.map((v) => (
                <MenuItem key={v.id} value={v.id}>
                  {v.label} ({v.units})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small" className={classes.formControl}>
            <InputLabel
              id="rhessys-choropleth-year-label"
              className={classes.label}
            >
              Year
            </InputLabel>
            <Select
              labelId="rhessys-choropleth-year-label"
              id="rhessys-choropleth-year-select"
              value={String(selectedYear)}
              label="Year"
              onChange={handleYearChange}
              className={classes.select}
              MenuProps={{ PaperProps: { className: classes.selectPaper } }}
            >
              {years.map((y) => (
                <MenuItem key={y} value={String(y)}>
                  {y}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <ToggleButtonGroup
            value={selectedSpatialScale}
            exclusive
            onChange={handleSpatialScaleChange}
            size="small"
            fullWidth
            className={classes.toggleGroup}
          >
            <ToggleButton value="hillslope">Hillslope</ToggleButton>
            <ToggleButton value="patch">Patch</ToggleButton>
          </ToggleButtonGroup>
        </>
      )}
    </>
  );
}
