import { useParams } from "@tanstack/react-router";
import { useIsSmallScreen } from "../hooks/useIsSmallScreen";
import { tss } from "../utils/tss";
import { WatershedProvider, useWatershed } from "../contexts/WatershedContext";
import { VegetationCover } from "../components/bottom-panels/VegetationCover";
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

  const runId =
    useParams({
      from: "/watershed/$webcloudRunId",
      select: (params) => params?.webcloudRunId,
      shouldThrow: false,
    }) ?? null;

  const isSmallScreen = useIsSmallScreen();

  if (isSmallScreen) {
    return <SmallScreenNotice />;
  }

  return (
    <WatershedProvider runId={runId}>
      <div className={classes.root}>
        <Paper elevation={3} className={classes.sidePanel} square>
          <div className={classes.sidePanelContent}>
            {runId ? <WatershedOverview /> : <HomeSidePanelContent />}
          </div>
        </Paper>
        <div className={classes.mapWrapper}>
          <div className={classes.map}>
            <WatershedMap />
          </div>
          <ActiveBottomPanel />
        </div>
      </div>
    </WatershedProvider>
  );
}

/**
 * Declarative bottom panel — renders when the choropleth or scenario layer is
 * effectively active.
 */
function ActiveBottomPanel(): JSX.Element | null {
  const { isEffective } = useWatershed();

  if (isEffective("choropleth")) {
    return (
      <BottomPanel isOpen>
        <VegetationCover />
      </BottomPanel>
    );
  }

  return null;
}
