import { watershedOverviewRoute } from '../../routes/router';
import { useMatch } from '@tanstack/react-router';
import { useAppStore } from '../../store/store';
import { useIsSmallScreen } from '../../hooks/useIsSmallScreen';
import { tss } from 'tss-react';
import WatershedOverview from '../../components/side-panels/WatershedOverview';
import HomeSidePanelContent from '../../components/side-panels/HomeInfoPanel';
import SmallScreenNotice from '../../components/small-screen-notice/SmallScreenNotice';
import BottomPanel from '../../components/bottom-panels/BottomPanel';
import Map from '../../components/map/Map';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';

const useStyles = tss.create(() => ({
  root: {
    display: 'flex',
    flex: 1,
    height: 'calc(100vh - 64px)',
  },
  sidePanel: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '30%',
    minHeight: 0,
    background: 'rgba(18, 18, 18, 0.9)',
    color: '#F5F5F5',
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
  },
  map: {
    width: '100%',
    height: '100%',
  },
}));

export default function Home(): JSX.Element {
  const { classes } = useStyles();
  const { isPanelOpen, panelContent } = useAppStore();
  const match = useMatch({ from: watershedOverviewRoute.id, shouldThrow: false });
  const watershedID = match?.params.webcloudRunId ?? null;
  const isSmallScreen = useIsSmallScreen();

  if (isSmallScreen) {
    return <SmallScreenNotice />;
  }

  return (
    <Box className={classes.root}>
      <Paper elevation={3} className={classes.sidePanel} square>
        <Box className={classes.sidePanelContent}>
          {watershedID ? <WatershedOverview /> : <HomeSidePanelContent />}
        </Box>
      </Paper>
      <Box className={classes.mapWrapper}>
        <Box className={classes.map}>
          <Map />
        </Box>
        {isPanelOpen && (
          <BottomPanel isOpen={isPanelOpen}>
            {panelContent}
          </BottomPanel>
        )}
      </Box>
    </Box>
  );
}
