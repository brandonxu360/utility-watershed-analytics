import { useCallback, useMemo } from "react";
import { useWatershed } from "../../../contexts/WatershedContext";
import {
  getLayerParams,
  type RhessysOutputParams,
} from "../../../layers/types";
import { type useRhessysOutputs } from "../../../hooks/useRhessysOutputs";
import {
  GATE_CREEK_VARIABLES,
  GATE_CREEK_SCENARIOS,
  GATE_CREEK_YEAR_RANGE,
  RHESSYS_OUTPUT_SCENARIO_DESCRIPTIONS,
} from "../../../api/constants";
import { useStyles } from "../watershedStyles";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import PanelStatus from "../../PanelStatus";

const gateCreekYears = Array.from(
  { length: GATE_CREEK_YEAR_RANGE.max - GATE_CREEK_YEAR_RANGE.min + 1 },
  (_, i) => GATE_CREEK_YEAR_RANGE.min + i,
);

export function RhessysOutputsControls({
  scenarios,
  variables,
  isLoading,
  hasChoroplethData,
}: {
  scenarios: ReturnType<typeof useRhessysOutputs>["scenarios"];
  variables: ReturnType<typeof useRhessysOutputs>["variables"];
  isLoading: boolean;
  hasChoroplethData: boolean;
}) {
  const { classes } = useStyles();
  const {
    layerDesired,
    dispatchLayerAction,
    enableLayerWithParams,
    effective,
  } = useWatershed();

  const params = getLayerParams(layerDesired, "rhessysOutputs");
  const selectedScenario = params.scenario ?? null;
  const selectedVariable = params.variable ?? null;
  const selectedMode =
    params.mode ?? (scenarios.length > 0 ? "raster" : "choropleth");
  const selectedSpatialScale = (params.spatialScale ?? "hillslope") as
    | "hillslope"
    | "patch";
  const selectedYear = params.year ?? 2000;
  const layerEnabled = effective.rhessysOutputs.enabled;
  const hasRasterData = scenarios.length > 0;

  const availableVariables = useMemo(() => {
    const meta = scenarios.find((s) => s.id === selectedScenario);
    return meta
      ? variables.filter((v) => meta.variables.includes(v.id))
      : variables;
  }, [scenarios, variables, selectedScenario]);

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
    (overrides: Partial<RhessysOutputParams>) =>
      enableLayerWithParams("rhessysOutputs", {
        ...currentParams,
        ...overrides,
      }),
    [enableLayerWithParams, currentParams],
  );

  const turnOff = useCallback(
    () =>
      dispatchLayerAction({ type: "TOGGLE", id: "rhessysOutputs", on: false }),
    [dispatchLayerAction],
  );

  const handleSpatialScaleChange = useCallback(
    (
      _: React.MouseEvent<HTMLElement>,
      newScale: "hillslope" | "patch" | null,
    ) => {
      if (!newScale) return;
      const vars = GATE_CREEK_VARIABLES[newScale];
      const nextVariable = vars.some((v) => v.id === selectedVariable)
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

  if (isLoading)
    return (
      <PanelStatus
        status="loading"
        size="sm"
        message="Checking for output data…"
      />
    );
  if (!hasRasterData && !hasChoroplethData) return null;

  // Pre-computed raster maps (Victoria + Mill Creek)
  if (hasRasterData && selectedMode !== "choropleth") {
    const rasterDescription =
      selectedScenario != null
        ? RHESSYS_OUTPUT_SCENARIO_DESCRIPTIONS[selectedScenario]
        : undefined;
    return (
      <>
        <FormControl
          fullWidth
          size="small"
          className={classes.rhessysOutputFormControl}
        >
          <InputLabel
            id="rhessys-outputs-scenario-label"
            className={classes.rhessysLabel}
          >
            Scenario
          </InputLabel>
          <Select
            labelId="rhessys-outputs-scenario-label"
            id="rhessys-outputs-scenario-select"
            value={layerEnabled && selectedScenario ? selectedScenario : "none"}
            label="Scenario"
            onChange={(e) => {
              const value = e.target.value;
              if (value === "none") return turnOff();
              updateParams({
                scenario: value,
                variable: selectedVariable || variables[0]?.id || null,
                mode: "raster",
                spatialScale: null,
                year: null,
              });
            }}
            className={classes.rhessysSelect}
            MenuProps={{
              PaperProps: { className: classes.rhessysOutputSelectPaper },
            }}
          >
            <MenuItem value="none">None</MenuItem>
            {scenarios.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {layerEnabled && selectedScenario && rasterDescription && (
          <Tooltip
            title={rasterDescription}
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
        )}

        {layerEnabled && selectedScenario && (
          <FormControl
            fullWidth
            size="small"
            className={classes.rhessysOutputFormControl}
          >
            <InputLabel
              id="rhessys-outputs-variable-label"
              className={classes.rhessysLabel}
            >
              Variable
            </InputLabel>
            <Select
              labelId="rhessys-outputs-variable-label"
              id="rhessys-outputs-variable-select"
              value={selectedVariable || ""}
              label="Variable"
              onChange={(e) => updateParams({ variable: e.target.value })}
              className={classes.rhessysSelect}
              MenuProps={{
                PaperProps: { className: classes.rhessysOutputSelectPaper },
              }}
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
  const selectedScenarioMeta = GATE_CREEK_SCENARIOS.find(
    (s) => s.id === selectedScenario,
  );
  return (
    <>
      <FormControl
        fullWidth
        size="small"
        className={classes.rhessysOutputFormControl}
      >
        <InputLabel
          id="rhessys-choropleth-scenario-label"
          className={classes.rhessysLabel}
        >
          Scenario
        </InputLabel>
        <Select
          labelId="rhessys-choropleth-scenario-label"
          id="rhessys-choropleth-scenario-select"
          value={layerEnabled && selectedScenario ? selectedScenario : "none"}
          label="Scenario"
          onChange={(e) => {
            const value = e.target.value;
            if (value === "none") return turnOff();
            updateParams({
              scenario: value,
              variable: selectedVariable || choroplethVariables[0]?.id || null,
              mode: "choropleth",
            });
          }}
          className={classes.rhessysSelect}
          MenuProps={{
            PaperProps: { className: classes.rhessysOutputSelectPaper },
          }}
        >
          <MenuItem value="none">None</MenuItem>
          {GATE_CREEK_SCENARIOS.map((s) => (
            <MenuItem key={s.id} value={s.id}>
              {s.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {layerEnabled &&
        selectedScenario &&
        selectedScenarioMeta?.description && (
          <Tooltip
            title={selectedScenarioMeta.description}
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
        )}

      {layerEnabled && selectedScenario && (
        <>
          <FormControl
            fullWidth
            size="small"
            className={classes.rhessysOutputFormControl}
          >
            <InputLabel
              id="rhessys-choropleth-variable-label"
              className={classes.rhessysLabel}
            >
              Variable
            </InputLabel>
            <Select
              labelId="rhessys-choropleth-variable-label"
              id="rhessys-choropleth-variable-select"
              value={selectedVariable || ""}
              label="Variable"
              onChange={(e) =>
                updateParams({ variable: e.target.value, mode: "choropleth" })
              }
              className={classes.rhessysSelect}
              MenuProps={{
                PaperProps: { className: classes.rhessysOutputSelectPaper },
              }}
            >
              {choroplethVariables.map((v) => (
                <MenuItem key={v.id} value={v.id}>
                  {v.label} ({v.units})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl
            fullWidth
            size="small"
            className={classes.rhessysOutputFormControl}
          >
            <InputLabel
              id="rhessys-choropleth-year-label"
              className={classes.rhessysLabel}
            >
              Year
            </InputLabel>
            <Select
              labelId="rhessys-choropleth-year-label"
              id="rhessys-choropleth-year-select"
              value={String(selectedYear)}
              label="Year"
              onChange={(e) =>
                updateParams({
                  year: Number(e.target.value),
                  mode: "choropleth",
                })
              }
              className={classes.rhessysSelect}
              MenuProps={{
                PaperProps: { className: classes.rhessysOutputSelectPaper },
              }}
            >
              {gateCreekYears.map((y) => (
                <MenuItem key={y} value={String(y)}>
                  {y}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Tooltip
            title="Water fluxes and productivities are sensitive to climate variability — selecting different years lets you explore that range rather than relying on a single year."
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
              aria-label="Why select a year?"
            >
              <InfoOutlinedIcon fontSize="inherit" />
              Why select a year?
            </Typography>
          </Tooltip>

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
