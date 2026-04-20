import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import InboxIcon from "@mui/icons-material/Inbox";
import { tss } from "../utils/tss";

type PanelStatusProps = {
  status: "loading" | "error" | "empty";
  message?: string;
  /** "sm" for compact side-panel contexts, "md" (default) for bottom panels */
  size?: "sm" | "md";
};

const DEFAULT_MESSAGES: Record<PanelStatusProps["status"], string> = {
  loading: "Fetching data…",
  error: "Unable to load data.",
  empty: "Nothing to show here.",
};

const useStyles = tss
  .withParams<{ size: "sm" | "md" }>()
  .create(({ theme, size }) => ({
    root: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing(1),
      padding: size === "sm" ? theme.spacing(2) : theme.spacing(4),
      color: theme.palette.primary.contrastText,
      width: "100%",
      boxSizing: "border-box",
    },
    icon: {
      fontSize: size === "sm" ? 24 : 36,
      color: "inherit",
    },
    errorIcon: {
      color: theme.palette.error.main,
    },
    message: {
      textAlign: "center",
      color: "inherit",
    },
  }));

export default function PanelStatus({
  status,
  message,
  size = "md",
}: PanelStatusProps) {
  const { classes, cx } = useStyles({ size });
  const text = message ?? DEFAULT_MESSAGES[status];

  return (
    <div className={classes.root} role="status" aria-live="polite">
      {status === "loading" && (
        <CircularProgress size={size === "sm" ? 20 : 28} color="inherit" />
      )}
      {status === "error" && (
        <ErrorOutlineIcon
          className={cx(classes.icon, classes.errorIcon)}
          aria-hidden
        />
      )}
      {status === "empty" && <InboxIcon className={classes.icon} aria-hidden />}
      <Typography
        variant={size === "sm" ? "body2" : "body1"}
        className={classes.message}
      >
        {text}
      </Typography>
    </div>
  );
}
