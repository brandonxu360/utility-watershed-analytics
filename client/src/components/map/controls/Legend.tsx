import { useState } from 'react';
import { toast } from 'react-toastify';
import { tss } from '../../../utils/tss';
import { Button, Paper } from '@mui/material';
import ListIcon from '@mui/icons-material/List';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';

const TIER1_COLOR = '#00FF7F';
const TIER2_COLOR = '#0000FF';

const useStyles = tss.create(({ theme }) => ({
  legendButton: {
    height: 36,
    minWidth: 36,
    backgroundColor: theme.palette.primary.dark,

    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',

    padding: 0,
    cursor: 'pointer',

    appearance: 'none',
    borderStyle: 'outset',
    borderWidth: 2,
    borderRadius: 0,
    borderColor: theme.palette.surface.border,
    boxSizing: 'border-box',

    '&:active': {
      borderStyle: 'inset',
    },
  },
  legendIcon: {
    fontSize: 28,
    color: theme.palette.primary.contrastText,
  },
  legendModal: {
    position: 'absolute',
    top: 0,
    left: 60,
    background: theme.palette.surface.overlay,
    color: theme.palette.primary.contrastText,
    padding: theme.spacing(1.5),
    borderRadius: theme.spacing(1),
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
    width: 330,
  },
  legendContent: {
    '& > div': {
      display: 'flex',
      alignItems: 'center',
      fontSize: theme.typography.body2.fontSize,
    },
  },
  watershedContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: theme.spacing(1.5),
  },
  watershedLeft: {
    display: 'flex',
    alignItems: 'center',
    '& > div': {
      marginRight: theme.spacing(1.5),
    },
  },
  watershedRight: {
    display: 'flex',
    alignItems: 'center',
    marginLeft: theme.spacing(3),
    gap: theme.spacing(1.5),
  },
  legendText: {
    fontWeight: 'bold',
  },
  tier1Color: {
    width: 20,
    height: 20,
    background: TIER1_COLOR,
    borderRadius: 5,
  },
  tier2Color: {
    width: 20,
    height: 20,
    background: TIER2_COLOR,
    borderRadius: 5,
  },
}));

/**
 * LegendControl - A custom map control component that displays a toggleable legend
 * showing different watershed tiers and their controls
 *
 * @component
 */
export default function Legend() {
  const { classes } = useStyles();

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
                  aria-label="Show Tier 1 watersheds"
                  role="button"
                  tabIndex={0}
                  aria-hidden={false}
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
                  aria-label="Show Tier 2 watersheds"
                  role="button"
                  tabIndex={0}
                  aria-hidden={false}
                />
              </div>
            </div>
          </div>
        </Paper>
      )}
    </div>
  );
}