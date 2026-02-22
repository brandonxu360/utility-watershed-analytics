import { useMatch } from "@tanstack/react-router";
import { useAppStore } from "../store/store";
import { useIsSmallScreen } from "../hooks/useIsSmallScreen";
import { tss } from "../utils/tss";
import WatershedOverview from "../components/side-panels/WatershedOverview";
import HomeSidePanelContent from "../components/side-panels/HomeInfoPanel";
import SmallScreenNotice from "../components/SmallScreenNotice";
import BottomPanel from "../components/bottom-panels/BottomPanel";
import WatershedMap from "../components/map/WatershedMap";
import Paper from "@mui/material/Paper";

const useStyles = tss.create(({ theme }) => ({
  root: {
    display: "flex",
    flex: 1,
    height: "calc(100vh - 64px)",
    overflow: "hidden",
  },
  sidePanel: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    width: "30%",
    minHeight: 0,
    background: theme.palette.primary.dark,
    color: theme.palette.primary.contrastText,
  },
  sidePanelContent: {
    flex: 1,
    minHeight: 0,
    padding: `${theme.spacing(1)} ${theme.spacing(4)} 0`,
    boxSizing: "border-box",
    overflowY: "auto",
  },
  mapWrapper: {
    flex: 1,
    minHeight: 0,
    position: "relative",
    overflow: "hidden",
  },
  map: {
    width: "100%",
    height: "100%",
  },
}));

export default function Home(): JSX.Element {
  const { classes } = useStyles();
  const { isPanelOpen, panelContent } = useAppStore();

  const match = useMatch({
    from: '/watershed/$webcloudRunId',
    shouldThrow: false,
  });

  const watershedID = match?.params.webcloudRunId ?? null;
  const isSmallScreen = useIsSmallScreen();

  if (isSmallScreen) {
    return <SmallScreenNotice />;
  }

  return (
    <div className={classes.root}>
      <Paper elevation={3} className={classes.sidePanel} square>
        <div className={classes.sidePanelContent}>
          {watershedID ? <WatershedOverview /> : <HomeSidePanelContent />}
        </div>
      </Paper>
      <div className={classes.mapWrapper}>
        <div className={classes.map}>
          <WatershedMap />
        </div>
        {isPanelOpen && (
          <BottomPanel isOpen={isPanelOpen}>{panelContent}</BottomPanel>
        )}
      </div>
    </div>
  );
}
