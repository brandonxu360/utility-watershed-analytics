import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select, { type SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";

import {
  GATE_CREEK_SCENARIOS,
  GATE_CREEK_YEAR_RANGE,
} from "../../../api/rhessys/constants";

interface ChoroplethVariable {
  id: string;
  label: string;
  units: string;
}

interface ChoroplethModeSectionProps {
  classes: Record<
    "select" | "selectPaper" | "formControl" | "label" | "toggleGroup",
    string
  >;
  selectedSpatialScale: "hillslope" | "patch";
  selectedScenario: string;
  selectedVariable: string;
  selectedYear: number;
  choroplethVariables: ChoroplethVariable[];
  layerEnabled: boolean;
  onSpatialScaleChange: (
    event: React.MouseEvent<HTMLElement>,
    value: "hillslope" | "patch" | null,
  ) => void;
  onScenarioChange: (event: SelectChangeEvent) => void;
  onVariableChange: (event: SelectChangeEvent) => void;
  onYearChange: (event: SelectChangeEvent) => void;
}

export default function ChoroplethModeSection({
  classes,
  selectedSpatialScale,
  selectedScenario,
  selectedVariable,
  selectedYear,
  choroplethVariables,
  layerEnabled,
  onSpatialScaleChange,
  onScenarioChange,
  onVariableChange,
  onYearChange,
}: ChoroplethModeSectionProps) {
  const years = Array.from(
    { length: GATE_CREEK_YEAR_RANGE.max - GATE_CREEK_YEAR_RANGE.min + 1 },
    (_, i) => GATE_CREEK_YEAR_RANGE.min + i,
  );

  return (
    <>
      <ToggleButtonGroup
        value={selectedSpatialScale}
        exclusive
        onChange={onSpatialScaleChange}
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
          onChange={onScenarioChange}
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
              onChange={onVariableChange}
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
              onChange={onYearChange}
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
