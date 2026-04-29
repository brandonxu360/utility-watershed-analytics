import { useWatershed } from "../../../contexts/WatershedContext";
import { getLayerParams } from "../../../layers/types";
import { type useRhessysSpatialInputs } from "../../../hooks/useRhessysSpatialInputs";
import { useStyles } from "../watershedStyles";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import PanelStatus from "../../PanelStatus";

export function RhessysSpatialControls({
  files,
  isLoading,
}: {
  files: ReturnType<typeof useRhessysSpatialInputs>["files"];
  isLoading: boolean;
}) {
  const { classes } = useStyles();
  const {
    layerDesired,
    dispatchLayerAction,
    enableLayerWithParams,
    effective,
  } = useWatershed();
  const { filename: selectedFilename = "" } = getLayerParams(
    layerDesired,
    "rhessysSpatial",
  );
  const layerEnabled = effective.rhessysSpatial.enabled;

  if (isLoading)
    return (
      <PanelStatus
        status="loading"
        size="sm"
        message="Checking for spatial data…"
      />
    );
  if (files.length === 0) return null;

  return (
    <>
      <FormControl
        fullWidth
        size="small"
        className={classes.rhessysSpatialFormControl}
      >
        <InputLabel
          id="rhessys-spatial-select-label"
          className={classes.rhessysLabel}
        >
          Spatial Input
        </InputLabel>
        <Select
          labelId="rhessys-spatial-select-label"
          id="rhessys-spatial-select"
          value={layerEnabled && selectedFilename ? selectedFilename : "none"}
          label="Spatial Input"
          onChange={(e) => {
            const value = e.target.value;
            if (value === "none") {
              dispatchLayerAction({
                type: "TOGGLE",
                id: "rhessysSpatial",
                on: false,
              });
            } else {
              enableLayerWithParams("rhessysSpatial", { filename: value });
            }
          }}
          className={classes.rhessysSelect}
          MenuProps={{
            PaperProps: { className: classes.rhessysSpatialSelectPaper },
          }}
        >
          <MenuItem value="none">None</MenuItem>
          {files.map((f) => (
            <MenuItem key={f.filename} value={f.filename}>
              {f.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Divider className={classes.sectionDivider} />
    </>
  );
}
