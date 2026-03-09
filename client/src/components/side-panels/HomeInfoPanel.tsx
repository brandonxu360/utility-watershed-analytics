import { Button, Typography } from "@mui/material";
import { tss } from "../../utils/tss";
import { useNavigate } from "@tanstack/react-router";

const useStyles = tss.create(({ theme }) => ({
  root: {
    padding: `${theme.spacing(2)} ${theme.spacing(0.25)}`,
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(1.5),
  },
  heading: {
    fontSize: theme.typography.h2.fontSize,
  },
  quickLinksBlock: {
    marginTop: theme.spacing(4),
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(1),
  },
  quickLinkButton: {
    alignSelf: "flex-start",
    color: theme.palette.primary.contrastText,
    borderColor: theme.palette.primary.contrastText,
    background: "rgba(255,255,255,0.06)",
    "&:hover": {
      borderColor: theme.palette.primary.contrastText,
      background: "rgba(255,255,255,0.12)",
    },
  },
}));

export default function HomeSidePanelContent(): JSX.Element {
  const { classes } = useStyles();
  const navigate = useNavigate();
  return (
    <div className={classes.root} data-testid="home-panel">
      <Typography variant="h2" className={classes.heading}>
        <strong>Explore Fire and Watershed Impacts</strong>
      </Typography>
      <Typography variant="body1">
        This tool helps watershed and water utility managers explore how
        different fire and management scenarios affect short- and long-term
        water quality in source watersheds.
      </Typography>
      <Typography variant="body1">
        <strong>Get Started: Select a watershed to explore its data.</strong>
      </Typography>
      <div className={classes.quickLinksBlock}>
        <Typography variant="h3">
          <strong>Quick links</strong>
        </Typography>
        <Typography variant="body2">
          Jump to featured watersheds with richer data and model inputs.
        </Typography>
        {/* Victoria watersheds — uncomment when data is ready
        <Button
          variant="outlined"
          size="small"
          className={classes.quickLinkButton}
          onClick={() =>
            navigate({
              to: "/watershed/$webcloudRunId",
              params: {
                webcloudRunId: "batch;;victoria-ca-2026-sbs;;Sooke15",
              },
            })
          }
        >
          Victoria - Sooke15
        </Button>
        <Button
          variant="outlined"
          size="small"
          className={classes.quickLinkButton}
          onClick={() =>
            navigate({
              to: "/watershed/$webcloudRunId",
              params: {
                webcloudRunId: "batch;;victoria-ca-2026-sbs;;Sooke09",
              },
            })
          }
        >
          Victoria - Sooke09
        </Button>
        */}
        <Button
          variant="outlined"
          size="small"
          className={classes.quickLinkButton}
          onClick={() =>
            navigate({
              to: "/watershed/$webcloudRunId",
              params: { webcloudRunId: "aversive-forestry" },
            })
          }
        >
          Gate Creek (RHESSys inputs)
        </Button>
        <Button
          variant="outlined"
          size="small"
          className={classes.quickLinkButton}
          onClick={() =>
            navigate({
              to: "/watershed/$webcloudRunId",
              params: { webcloudRunId: "mdobre-invincible-scarab" },
            })
          }
        >
          Mill Creek
        </Button>
      </div>
    </div>
  );
}
