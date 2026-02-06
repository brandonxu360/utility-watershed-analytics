import { watershedOverviewRoute } from '../routes/router';
import { useMatch } from '@tanstack/react-router';
import { useAppStore } from '../store/store';
import { useIsSmallScreen } from '../hooks/useIsSmallScreen';
import { tss } from 'tss-react';
import { ThemeMode } from '../utils/theme';
import WatershedOverview from '../components/side-panels/WatershedOverview';
import HomeSidePanelContent from '../components/side-panels/HomeInfoPanel';
import SmallScreenNotice from '../components/SmallScreenNotice';
import BottomPanel from '../components/bottom-panels/BottomPanel';
import Map from '../components/map/Map';
import Paper from '@mui/material/Paper';
import { useTheme } from '@mui/material';

const useStyles = tss.withParams<{ mode: ThemeMode }>().create(({ mode }) => ({
  root: {
    display: 'flex',
    flex: 1,
    height: 'calc(100vh - 64px)',
    overflow: 'hidden',
  },
  sidePanel: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '30%',
    minHeight: 0,
    background: mode.colors.background,
    color: mode.colors.primary100,
  },
  sidePanelContent: {
    flex: 1,
    minHeight: 0,
    padding: '10px 30px 0',
    boxSizing: 'border-box',
    overflowY: 'auto',
  },
  mapWrapper: {
    flex: 1,
    minHeight: 0,
    position: 'relative',
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
}));

export default function Home(): JSX.Element {
  const theme = useTheme();
  const mode = (theme as { mode: ThemeMode }).mode;

  const { classes } = useStyles({ mode });
  const { isPanelOpen, panelContent } = useAppStore();
  const match = useMatch({ from: watershedOverviewRoute.id, shouldThrow: false });
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
          <Map />
        </div>
        {isPanelOpen && (
          <BottomPanel isOpen={isPanelOpen}>
            {panelContent}
          </BottomPanel>
        )}
      </div>
    </div>
  );
}
