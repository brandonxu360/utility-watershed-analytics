import { useState } from 'react';
import { toast } from 'react-toastify';
import { tss } from 'tss-react';
import { useTheme } from '@mui/material/styles';
import { Button, Paper } from '@mui/material';
import ListIcon from '@mui/icons-material/List';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import type { ThemeMode } from '../../../utils/theme';

const useStyles = tss.withParams<{ mode: ThemeMode }>().create(({ mode }) => ({
  legendButton: {
    height: 36,
    minWidth: 36,
    backgroundColor: mode.colors.primary500,

    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',

    padding: 0,
    cursor: 'pointer',

    appearance: 'none',
    borderStyle: 'outset',
    borderWidth: 2,
    borderRadius: 0,
    borderColor: '#000',
    boxSizing: 'border-box',

    '&:active': {
      borderStyle: 'inset',
    },
  },
  legendIcon: {
    fontSize: 28,
    color: mode.colors.primary100,
  },
  legendModal: {
    position: 'absolute',
    top: 0,
    left: 60,
    background: 'rgba(0, 0, 0, 0.8)',
    color: mode.colors.primary100,
    padding: mode.space[300],
    borderRadius: mode.space[200],
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
    width: 330,
  },
  legendContent: {
    '& > div': {
      display: 'flex',
      alignItems: 'center',
      fontSize: mode.fs[100],
    },
  },
  watershedContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: mode.space[300],
  },
  watershedLeft: {
    display: 'flex',
    alignItems: 'center',
    '& > div': {
      marginRight: mode.space[300],
    },
  },
  watershedRight: {
    display: 'flex',
    alignItems: 'center',
    marginLeft: mode.space[500],
    gap: mode.space[300],
  },
  legendText: {
    fontWeight: 'bold',
  },
  tier1Color: {
    width: 20,
    height: 20,
    background: '#00FF7F',
    borderRadius: 5,
  },
  tier2Color: {
    width: 20,
    height: 20,
    background: '#0000FF',
    borderRadius: 5,
  },
}));

/**
 * LegendControl - A custom map control component that displays a toggleable legend
 * showing different watershed tiers and their controls
 *
 * @component
 */
export default function LegendControl() {
  const theme = useTheme();
  const mode = (theme as { mode: ThemeMode }).mode;
  const { classes } = useStyles({ mode });

  const [isLegendOpen, setIsLegendOpen] = useState(false);

  const toggleLegend = () => setIsLegendOpen((prev) => !prev);

  return (
    <div className="leaflet-bar leaflet-control">
      <Button
        onClick={toggleLegend}
        className={classes.legendButton}
        aria-label={isLegendOpen ? 'Close legend' : 'Open legend'}
        title={isLegendOpen ? 'Close legend' : 'Open legend'}
      >
        {isLegendOpen ? (
          <CloseIcon className={classes.legendIcon} />
        ) : (
          <ListIcon className={classes.legendIcon} />
        )}
      </Button>

      {isLegendOpen && (
        <Paper className={classes.legendModal}>
          <div className={classes.legendContent}>
            <div className={classes.watershedContainer}>
              <div className={classes.watershedLeft}>
                <div className={classes.tier1Color}></div>
                <span className={classes.legendText}>Tier 1 watersheds</span>
              </div>
              <div className={classes.watershedRight}>
                <VisibilityIcon
                  className={classes.legendIcon}
                  style={{ cursor: 'pointer' }}
                  onClick={() => toast.error('Feature not implemented yet')}
                />
              </div>
            </div>
            <div className={classes.watershedContainer}>
              <div className={classes.watershedLeft}>
                <div className={classes.tier2Color}></div>
                <span className={classes.legendText}>Tier 2 watersheds</span>
              </div>
              <div className={classes.watershedRight}>
                <VisibilityIcon
                  className={classes.legendIcon}
                  style={{ cursor: 'pointer' }}
                  onClick={() => toast.error('Feature not implemented yet')}
                />
              </div>
            </div>
          </div>
        </Paper>
      )}
    </div>
  );
}