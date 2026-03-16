import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select, { type SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

import type {
  RhessysOutputScenario,
  RhessysOutputVariable,
} from "../../../api/types";

interface RasterModeSectionProps {
  classes: Record<"select" | "selectPaper" | "formControl" | "label", string>;
  scenarios: RhessysOutputScenario[];
  availableVariables: RhessysOutputVariable[];
  selectedScenario: string;
  selectedVariable: string;
  layerEnabled: boolean;
  onScenarioChange: (event: SelectChangeEvent) => void;
  onVariableChange: (event: SelectChangeEvent) => void;
}

export default function RasterModeSection({
  classes,
  scenarios,
  availableVariables,
  selectedScenario,
  selectedVariable,
  layerEnabled,
  onScenarioChange,
  onVariableChange,
}: RasterModeSectionProps) {
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
          onChange={onScenarioChange}
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
            onChange={onVariableChange}
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
