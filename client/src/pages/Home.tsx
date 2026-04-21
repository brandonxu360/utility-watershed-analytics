import { useNavigate } from "@tanstack/react-router";
import { useIsSmallScreen } from "../hooks/useIsSmallScreen";
import { useRunId } from "../hooks/useRunId";
import { tss } from "../utils/tss";
import { WatershedProvider } from "../contexts/WatershedContext";
import WatershedOverview from "../components/side-panels/WatershedOverview";
import HomeSidePanelContent from "../components/side-panels/HomeInfoPanel";
import SmallScreenNotice from "../components/SmallScreenNotice";
import WatershedMap from "../components/map/WatershedMap";
import BackButton from "../components/BackButton";
import Paper from "@mui/material/Paper";
import ActiveBottomPanel from "../components/bottom-panels/ActiveBottomPanel";

const useStyles = tss
  .withParams<{ hasRunId: boolean }>()
  .create(({ theme, hasRunId }) => ({
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
      position: "sticky",
      top: 0,
      zIndex: 100,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      height: "48px",
      margin: `0 -${theme.spacing(4)}`,
      padding: `${theme.spacing(4)}`,
      background: theme.palette.surface.overlay,
      backdropFilter: "blur(8px)",
    },
    scrollHint: {
      fontSize: theme.typography.caption.fontSize,
      color: theme.palette.text.primary,
      fontStyle: "italic",
      transition: "opacity 0.25s ease",
    },
    sidePanelContent: {
      flex: 1,
      minHeight: 0,
      padding: `${hasRunId ? 0 : theme.spacing(1)} ${theme.spacing(4)} 0`,
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
  const navigate = useNavigate();
  const runId = useRunId();
  const { classes, cx } = useStyles({ hasRunId: !!runId });

  const isSmallScreen = useIsSmallScreen();

  if (isSmallScreen) {
    return <SmallScreenNotice />;
  }

  return (
    <WatershedProvider runId={runId}>
      <div className={classes.root}>
        <Paper elevation={3} className={classes.sidePanel} square>
          <div className={classes.sidePanelContent}>
            {runId && (
              <div className={classes.backButtonBar}>
                <BackButton
                  onClick={() => navigate({ to: "/" })}
                  label="Close watershed overview panel"
                />
                <span className={cx(classes.scrollHint)}>
                  Press Back to view all watersheds
                </span>
              </div>
            )}
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
