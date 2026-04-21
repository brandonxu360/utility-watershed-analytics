import { useCallback } from "react";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select, { type SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import PanelStatus from "../../PanelStatus";
import { useWatershed } from "../../../contexts/WatershedContext";
import { useRunId } from "../../../hooks/useRunId";
import { useRhessysSpatialInputs } from "../../../hooks/useRhessysSpatialInputs";
import { getLayerParams } from "../../../layers/types";
import { tss } from "../../../utils/tss";
import { alpha, Divider } from "@mui/material";

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
    marginTop: theme.spacing(0.5),
  },
  label: {
    color: theme.palette.primary.contrastText,
    "&.Mui-focused": {
      color: theme.palette.primary.contrastText,
    },
  },
  sectionDivider: {
    borderColor: alpha(theme.palette.primary.contrastText, 0.5),
    marginTop: theme.spacing(1.5),
    marginBottom: theme.spacing(1.5),
  },
}));

export default function RhessysSection() {
  const { classes } = useStyles();
  const runId = useRunId();
  const { files, isLoading } = useRhessysSpatialInputs(runId);
  const {
    layerDesired,
    enableLayerWithParams,
    dispatchLayerAction,
    effective,
  } = useWatershed();

  const params = getLayerParams(layerDesired, "rhessysSpatial");
  const selectedFilename = params.filename ?? "";
  const layerEnabled = effective.rhessysSpatial.enabled;

  const handleChange = useCallback(
    (event: SelectChangeEvent) => {
      const value = event.target.value;
      if (value === "none") {
        dispatchLayerAction({
          type: "TOGGLE",
          id: "rhessysSpatial",
          on: false,
        });
      } else {
        enableLayerWithParams("rhessysSpatial", { filename: value });
      }
    },
    [enableLayerWithParams, dispatchLayerAction],
  );

  if (isLoading)
    return (
      <PanelStatus
        status="loading"
        size="sm"
        message="Checking for spatial data…"
      />
    );

  if (files.length === 0) {
    return null;
  }

  return (
    <>
      <FormControl fullWidth size="small" className={classes.formControl}>
        <InputLabel id="rhessys-spatial-select-label" className={classes.label}>
          Spatial Input
        </InputLabel>
        <Select
          labelId="rhessys-spatial-select-label"
          id="rhessys-spatial-select"
          value={layerEnabled && selectedFilename ? selectedFilename : "none"}
          label="Spatial Input"
          onChange={handleChange}
          className={classes.select}
          MenuProps={{
            PaperProps: { className: classes.selectPaper },
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
