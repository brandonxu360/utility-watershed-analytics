import { useCallback, useMemo } from "react";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import type { SelectChangeEvent } from "@mui/material/Select";
import { useWatershed } from "../../../contexts/WatershedContext";
import { getLayerParams, type RhessysOutputParams } from "../../../layers/types";
import { tss } from "../../../utils/tss";

import type {
  RhessysOutputScenario,
  RhessysOutputVariable,
} from "../../../api/types";

import { GATE_CREEK_SCENARIOS, GATE_CREEK_VARIABLES } from "../../../api/rhessysConstants";
import RasterModeSection from "./RasterModeSection";
import ChoroplethModeSection from "./ChoroplethModeSection";

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

  // Shared param-update helper

  const currentParams = useMemo(
    () => ({
      scenario: selectedScenario || null,
      variable: selectedVariable || null,
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

  // ── Pre-computed map handlers ──

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

  // ── Dynamic choropleth handlers ──

  const handleSpatialScaleChange = useCallback(
    (
      _: React.MouseEvent<HTMLElement>,
      newScale: "hillslope" | "patch" | null,
    ) => {
      if (!newScale) return;
      const vars = GATE_CREEK_VARIABLES[newScale];
      updateParams({
        scenario: selectedScenario || GATE_CREEK_SCENARIOS[0].id,
        variable: vars[0]?.id ?? null,
        mode: "choropleth",
        spatialScale: newScale,
      });
    },
    [updateParams, selectedScenario],
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
      <RasterModeSection
        classes={classes}
        scenarios={scenarios}
        availableVariables={availableVariables}
        selectedScenario={selectedScenario}
        selectedVariable={selectedVariable}
        layerEnabled={layerEnabled}
        onScenarioChange={handleScenarioChange}
        onVariableChange={handleVariableChange}
      />
    );
  }

  // Dynamic choropleth (Gate Creek)
  return (
    <ChoroplethModeSection
      classes={classes}
      selectedSpatialScale={selectedSpatialScale}
      selectedScenario={selectedScenario}
      selectedVariable={selectedVariable}
      selectedYear={selectedYear}
      choroplethVariables={choroplethVariables}
      layerEnabled={layerEnabled}
      onSpatialScaleChange={handleSpatialScaleChange}
      onScenarioChange={handleChoroplethScenarioChange}
      onVariableChange={handleChoroplethVariableChange}
      onYearChange={handleYearChange}
    />
  );
}
