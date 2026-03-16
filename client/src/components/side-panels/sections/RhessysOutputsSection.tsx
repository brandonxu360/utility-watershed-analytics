import { useCallback, useMemo } from "react";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select, { type SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { useWatershed } from "../../../contexts/WatershedContext";
import { getLayerParams } from "../../../layers/types";
import { tss } from "../../../utils/tss";
import type {
  RhessysOutputScenario,
  RhessysOutputVariable,
} from "../../../api/types";
import {
  GATE_CREEK_SCENARIOS,
  GATE_CREEK_VARIABLES,
  GATE_CREEK_YEAR_RANGE,
} from "../../../api/rhessysOutputsApi";

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
    maxHeight: 300,
  },
  formControl: {
    marginTop: theme.spacing(1.5),
  },
  loadingRow: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
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

interface RhessysOutputsSectionProps {
  scenarios: RhessysOutputScenario[];
  variables: RhessysOutputVariable[];
  isLoading: boolean;
  /** True when the current watershed has Gate Creek-style parquet data. */
  hasChoroplethData?: boolean;
}

export default function RhessysOutputsSection({
  scenarios,
  variables,
  isLoading,
  hasChoroplethData = false,
}: RhessysOutputsSectionProps) {
  const { classes } = useStyles();
  const {
    layerDesired,
    enableLayerWithParams,
    dispatchLayerAction,
    effective,
  } = useWatershed();

  const params = getLayerParams(layerDesired, "rhessysOutputs");
  const selectedScenario = params.scenario ?? "";
  const selectedVariable = params.variable ?? "";
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

  // ── Pre-computed map handlers ──

  const handleScenarioChange = useCallback(
    (event: SelectChangeEvent) => {
      const value = event.target.value;
      if (value === "none") {
        dispatchLayerAction({
          type: "TOGGLE",
          id: "rhessysOutputs",
          on: false,
        });
      } else {
        const variable = selectedVariable || variables[0]?.id || null;
        enableLayerWithParams("rhessysOutputs", {
          scenario: value,
          variable,
          mode: "raster",
          spatialScale: null,
          year: null,
        });
      }
    },
    [enableLayerWithParams, dispatchLayerAction, selectedVariable, variables],
  );

  const handleVariableChange = useCallback(
    (event: SelectChangeEvent) => {
      enableLayerWithParams("rhessysOutputs", {
        scenario: selectedScenario || null,
        variable: event.target.value,
        spatialScale: selectedSpatialScale,
        year: selectedYear,
        mode: selectedMode,
      });
    },
    [
      enableLayerWithParams,
      selectedScenario,
      selectedSpatialScale,
      selectedYear,
      selectedMode,
    ],
  );

  // ── Dynamic choropleth handlers ──

  const handleSpatialScaleChange = useCallback(
    (
      _: React.MouseEvent<HTMLElement>,
      newScale: "hillslope" | "patch" | null,
    ) => {
      if (!newScale) return;
      const vars = GATE_CREEK_VARIABLES[newScale];
      const variable = vars[0]?.id ?? null;
      enableLayerWithParams("rhessysOutputs", {
        scenario: selectedScenario || GATE_CREEK_SCENARIOS[0].id,
        variable,
        mode: "choropleth",
        spatialScale: newScale,
        year: selectedYear,
      });
    },
    [enableLayerWithParams, selectedScenario, selectedYear],
  );

  const handleChoroplethScenarioChange = useCallback(
    (event: SelectChangeEvent) => {
      const value = event.target.value;
      if (value === "none") {
        dispatchLayerAction({
          type: "TOGGLE",
          id: "rhessysOutputs",
          on: false,
        });
      } else {
        enableLayerWithParams("rhessysOutputs", {
          scenario: value,
          variable: selectedVariable || choroplethVariables[0]?.id || null,
          mode: "choropleth",
          spatialScale: selectedSpatialScale,
          year: selectedYear,
        });
      }
    },
    [
      enableLayerWithParams,
      dispatchLayerAction,
      selectedVariable,
      selectedSpatialScale,
      selectedYear,
      choroplethVariables,
    ],
  );

  const handleChoroplethVariableChange = useCallback(
    (event: SelectChangeEvent) => {
      enableLayerWithParams("rhessysOutputs", {
        scenario: selectedScenario || null,
        variable: event.target.value,
        mode: "choropleth",
        spatialScale: selectedSpatialScale,
        year: selectedYear,
      });
    },
    [
      enableLayerWithParams,
      selectedScenario,
      selectedSpatialScale,
      selectedYear,
    ],
  );

  const handleYearChange = useCallback(
    (event: SelectChangeEvent) => {
      enableLayerWithParams("rhessysOutputs", {
        scenario: selectedScenario || null,
        variable: selectedVariable || null,
        year: Number(event.target.value),
        mode: "choropleth",
        spatialScale: selectedSpatialScale,
      });
    },
    [
      enableLayerWithParams,
      selectedScenario,
      selectedVariable,
      selectedSpatialScale,
    ],
  );

  if (isLoading) {
    return (
      <div className={classes.loadingRow}>
        <CircularProgress size={16} />
        <Typography variant="body2" color="textSecondary">
          Checking for output data...
        </Typography>
      </div>
    );
  }

  if (!hasRasterData && !hasChoroplethData) {
    return (
      <Typography variant="body2" color="textSecondary">
        No output data available.
      </Typography>
    );
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
  const years = Array.from(
    { length: GATE_CREEK_YEAR_RANGE.max - GATE_CREEK_YEAR_RANGE.min + 1 },
    (_, i) => GATE_CREEK_YEAR_RANGE.min + i,
  );

  return (
    <>
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
        </>
      )}
    </>
  );
}
