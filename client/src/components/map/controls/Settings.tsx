import { toast } from "react-toastify";
import { tss } from "../../../utils/tss";
import { Button } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";

const useStyles = tss.create(({ theme }) => ({
  settingsButton: {
    height: 36,
    minWidth: 36,
    backgroundColor: theme.palette.primary.dark,

    display: "flex",
    justifyContent: "center",
    alignItems: "center",

    padding: 0,
    cursor: "pointer",

    appearance: "none",
    borderStyle: "outset",
    borderWidth: 2,
    borderRadius: 0,
    borderColor: theme.palette.surface.border,
    boxSizing: "border-box",

    "&:active": {
      borderStyle: "inset",
    },
  },
  settingsIcon: {
    fontSize: 28,
    color: theme.palette.primary.contrastText,
  },
}));

/**
 * Settings - A custom map control component that provides settings functionality
 *
 * @component
 */
export default function Settings() {
  const { classes } = useStyles();

  return (
    <div className="leaflet-bar leaflet-control">
      <Button
        onClick={() => toast.error("Feature not implemented yet")}
        className={classes.settingsButton}
        aria-label="Open settings"
        title="Open settings"
      >
        <SettingsIcon className={classes.settingsIcon} />
      </Button>
    </div>
  );
}
