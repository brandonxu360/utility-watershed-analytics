import { useMap } from 'react-leaflet';
import { tss } from '../../../utils/tss';
import { Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

const useStyles = tss.create(({ theme }) => ({
  zoomInButton: {
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
  zoomIcon: {
    fontSize: 28,
    color: theme.palette.primary.contrastText,
  },
}));

export default function ZoomInControl() {
  const map = useMap();
  const { classes } = useStyles();

  return (
    <div className="leaflet-bar leaflet-control">
      <Button
        onClick={() => map.zoomIn()}
        className={classes.zoomInButton}
        aria-label="Zoom in"
        title="Zoom in"
      >
        <AddIcon className={classes.zoomIcon} />
      </Button>
    </div>
  );
}