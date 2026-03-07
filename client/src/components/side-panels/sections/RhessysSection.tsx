import { useCallback } from "react";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select, { type SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import { useWatershed } from "../../../contexts/WatershedContext";
import { getLayerParams } from "../../../layers/types";
import { tss } from "../../../utils/tss";
import type { RhessysSpatialFile } from "../../../api/types";

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
    "& .MuiSvgIcon-root": {
      color: theme.palette.primary.contrastText,
    },
  },
  label: {
    color: theme.palette.primary.contrastText,
    "&.Mui-focused": {
      color: theme.palette.primary.contrastText,
    },
  },
}));

interface RhessysSectionProps {
  files: RhessysSpatialFile[];
  isLoading: boolean;
  hasData: boolean;
}

export default function RhessysSection({
  files,
  isLoading,
  hasData,
}: RhessysSectionProps) {
  const { classes } = useStyles();
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

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 8, paddingBottom: 8 }}>
        <CircularProgress size={16} />
        <Typography variant="body2" color="textSecondary">
          Checking for spatial data...
        </Typography>
      </div>
    );
  }

  if (!hasData) {
    return (
      <Typography variant="body2" color="textSecondary">
        No features available yet.
      </Typography>
    );
  }

  return (
    <FormControl fullWidth size="small" sx={{ mt: 0.5 }}>
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
      >
        <MenuItem value="none">None</MenuItem>
        {files.map((f) => (
          <MenuItem key={f.filename} value={f.filename}>
            {f.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
