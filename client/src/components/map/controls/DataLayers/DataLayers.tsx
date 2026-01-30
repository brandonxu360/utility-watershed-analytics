import { ChangeEvent, useState } from 'react';
import { useAppStore } from '../../../../store/store';
import DataLayersTabContent from './DataLayersTabContent';

import {
  FaChevronUp,
  FaChevronDown,
  FaWater,
  FaGlobe,
  FaTree,
  FaFireAlt,
} from 'react-icons/fa';

import { tss } from 'tss-react';
import { ThemeMode } from '../../../../utils/theme';
import { useTheme } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import { useQueryClient } from '@tanstack/react-query';

const useStyles = tss.withParams<{ mode: ThemeMode }>().create(({ mode }) => ({
  root: {
    display: 'flex',
    flexDirection: 'column-reverse',
    position: 'fixed',
    right: '10px',
    bottom: '25px',
    width: '275px',
    zIndex: 10000,
  },
  header: {
    background: mode.colors.primary500,
    display: 'flex',
    alignContent: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: 700,
    color: mode.colors.primary100,
    cursor: 'pointer',
    borderBottom: '1px solid #E5E5E5',
    height: '40px',
  },
  chevron: {
    fontSize: '14px',
    color: mode.colors.primary100,
  },
  tabContent: {
    background: mode.colors.primary100,
    padding: 0,
    borderRadius: 0,
  },
  heading: {
    fontSize: '14px',
    fontWeight: 600,
    color: mode.colors.primary500,
    padding: '10px 16px 0 16px',
  },
  bottomNav: {
    background: mode.colors.primary100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 0',
    height: '40px',
  },
  navContainer: {
    display: 'flex',
    gap: '25px',
  },
  navButton: {
    width: '40px',
    height: '40px',
    display: 'flex',
    background: '#f2f7fb',
    color: '#3a7bd5',
    cursor: 'pointer',
    '&.active': {
      background: '#e6eef8',
    },
    '&:hover': {
      background: '#e6eef8',
    },
  },
}));

/**
 * DataLayersControl - toggles visibility of map data layers:
 * - Subcatchments
 * - Channels
 * - Land Use
 */
export default function DataLayersControl() {
  const theme = useTheme();
  const mode = (theme as { mode: ThemeMode }).mode;
  const { classes } = useStyles({ mode });

  const queryClient = useQueryClient();

  const {
    setSubcatchment,
    setChannels,
    setLanduse,
    clearSelectedHillslope,
    closePanel,
    resetOverlays,
  } = useAppStore();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Hill Slopes');

  const navTabs = [
    { key: 'Hill Slopes', icon: <FaWater title="Hill Slopes" /> },
    { key: 'Surface Data', icon: <FaGlobe title="Coverage" /> },
    { key: 'Coverage', icon: <FaTree title="Vegetation" /> },
    { key: 'Soil Burn', icon: <FaFireAlt title="Soil Burn" /> },
  ];

  const toggleOpen = () => setIsOpen(prev => !prev);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { id, checked } = e.target;

    if (id === 'subcatchment') {
      setSubcatchment(checked);
      if (!checked) {
        queryClient.cancelQueries({ queryKey: ['subcatchments'] });
        closePanel();
        setLanduse(false);
        clearSelectedHillslope();
      }
    }

    if (id === 'channels') {
      setChannels(checked);
      if (!checked) {
        queryClient.cancelQueries({ queryKey: ['channels'] });
      }
    }

    if (id === 'landuse') {
      setSubcatchment(checked);
      setLanduse(checked);
      if (!checked) {
        resetOverlays();
      }
    }
  };

  return (
    <div className={classes.root}>
      <div>
        <div className={classes.header} onClick={toggleOpen}>
          Data Layers <span className={classes.chevron}>{isOpen ? <FaChevronDown /> : <FaChevronUp />}</span>
        </div>
        {isOpen && (
          <Paper className={classes.tabContent}>
            <div className={classes.heading}>{activeTab}</div>
            <DataLayersTabContent
              activeTab={activeTab}
              handleChange={handleChange}
            />
          </Paper>
        )}
        <div className={classes.bottomNav}>
          <div className={classes.navContainer}>
            {navTabs.map(tab => (
              <IconButton
                key={tab.key}
                className={`${classes.navButton}${activeTab === tab.key ? ' active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
                size="small"
              >
                {tab.icon}
              </IconButton>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
