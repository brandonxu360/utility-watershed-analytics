import { tss } from "../utils/tss";

const useStyles = tss.create(({ theme }) => ({
  root: {
    position: "fixed",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing(8),
    background: theme.palette.primary.dark,
  },
  smallScreenTitle: {
    fontSize: theme.typography.h3.fontSize,
    paddingBottom: theme.spacing(1),
    color: theme.palette.text.secondary,
  },
  smallScreenBody: {
    color: theme.palette.text.primary,
  },
}));

export default function SmallScreenNotice(): JSX.Element {
  const { classes } = useStyles();
  return (
    <div className={classes.root}>
      <div role="alert">
        <h1 id="small-screen-title" className={classes.smallScreenTitle}>
          Best viewed on larger screens
        </h1>
        <p className={classes.smallScreenBody}>
          This experience is optimized for tablets and desktops. For the
          clearest maps, charts, and controls, please use a device with a wider
          display.
        </p>
      </div>
    </div>
  );
}
