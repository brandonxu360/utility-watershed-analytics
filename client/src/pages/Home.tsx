import { useNavigate } from "@tanstack/react-router";
import { useIsSmallScreen } from "../hooks/useIsSmallScreen";
import { useRunId } from "../hooks/useRunId";
import { useRef, useState, useEffect } from "react";
import { tss } from "../utils/tss";
import { WatershedProvider, useWatershed } from "../contexts/WatershedContext";
import { VegetationCover } from "../components/bottom-panels/VegetationCover";
import { ScenariosTable } from "../components/bottom-panels/ScenariosTable";
import { RhessysTimeSeries } from "../components/bottom-panels/RhessysTimeSeries";
import { useRhessysOutputsData } from "../hooks/useRhessysOutputsData";
import WatershedOverview from "../components/side-panels/WatershedOverview";
import HomeSidePanelContent from "../components/side-panels/HomeInfoPanel";
import SmallScreenNotice from "../components/SmallScreenNotice";
import BottomPanel from "../components/bottom-panels/BottomPanel";
import WatershedMap from "../components/map/WatershedMap";
import BackButton from "../components/BackButton";
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
  backButtonBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: `0 ${theme.spacing(4)}`,
    background: theme.palette.surface.overlay,
  },
  scrollHint: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.palette.text.primary,
    fontStyle: "italic",
    opacity: 0,
    transition: "opacity 0.25s ease",
  },
  scrollHintVisible: {
    opacity: 1,
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
  const { classes, cx } = useStyles();
  const navigate = useNavigate();
  const runId = useRunId();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setIsScrolled(el.scrollTop > 0);
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const isSmallScreen = useIsSmallScreen();

  if (isSmallScreen) {
    return <SmallScreenNotice />;
  }

  return (
    <WatershedProvider runId={runId}>
      <div className={classes.root}>
        <Paper elevation={3} className={classes.sidePanel} square>
          {runId && (
            <div className={classes.backButtonBar}>
              <BackButton
                onClick={() => navigate({ to: "/" })}
                label="Close watershed overview panel"
              />
              <span
                className={cx(
                  classes.scrollHint,
                  isScrolled && classes.scrollHintVisible,
                )}
              >
                Press Back to return to the map
              </span>
            </div>
          )}
          <div ref={scrollRef} className={classes.sidePanelContent}>
            {runId ? <WatershedOverview /> : <HomeSidePanelContent />}
          </div>
        </Paper>
        <div className={classes.mapWrapper}>
          <div className={classes.map}>
            <WatershedMap />
          </div>
          <ActiveBottomPanel runId={runId} />
        </div>
      </div>
    </WatershedProvider>
  );
}

function ActiveBottomPanel({
  runId,
}: {
  runId: string | null;
}): JSX.Element | null {
  const { isEffective } = useWatershed();
  const { hasChoroplethData } = useRhessysOutputsData(runId);

  if (isEffective("choropleth")) {
    return (
      <BottomPanel key="choropleth" isOpen>
        <VegetationCover />
      </BottomPanel>
    );
  }

  if (isEffective("rhessysOutputs") && hasChoroplethData) {
    return (
      <BottomPanel key="rhessysOutputs" isOpen>
        <RhessysTimeSeries />
      </BottomPanel>
    );
  }

  if (isEffective("rhessysOutputs") || isEffective("rhessysSpatial")) {
    return null;
  }

  if (runId) {
    return (
      <BottomPanel key="scenarios" isOpen>
        <ScenariosTable />
      </BottomPanel>
    );
  }

  return null;
}
