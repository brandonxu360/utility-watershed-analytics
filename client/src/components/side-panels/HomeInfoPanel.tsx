import { Typography } from "@mui/material";
import { tss } from "../../utils/tss";

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
}));

export default function HomeSidePanelContent(): JSX.Element {
  const { classes } = useStyles();
  return (
    <div className={classes.root} data-testid="home-panel">
      <Typography variant="h2" className={classes.heading}>
        <strong>Explore Watershed Analytics</strong>
      </Typography>
      <Typography variant="body1">
        Visualize and analyze hydrologic and environmental data for watersheds
        across the western United States. Gain insights into observed and
        modeled data to understand water and environmental conditions.
      </Typography>
      <Typography variant="h3">
        <strong>Tier 1 Watersheds</strong>
      </Typography>
      <Typography variant="body1">
        Access modeled results that provide initial insights but have not yet
        been calibrated.
      </Typography>
      <Typography variant="h3">
        <strong>Tier 2 Watersheds</strong>
      </Typography>
      <Typography variant="body1">
        Explore calibrated model results for enhanced accuracy and reliability.
        Start analyzing now to uncover trends, compare models, and support
        data-driven decisions for watershed management.
      </Typography>
      <Typography variant="body1">
        <strong>Get Started: Select a watershed to explore its data.</strong>
      </Typography>
    </div>
  );
}
