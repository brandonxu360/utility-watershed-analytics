import { useMap } from 'react-leaflet';
import { tss } from '../../../utils/tss';
import { Button } from '@mui/material';
import RemoveIcon from '@mui/icons-material/Remove';

const useStyles = tss.create(({ theme }) => ({
  zoomOutButton: {
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

export default function ZoomOutControl() {
  const map = useMap();
  const { classes } = useStyles();

  return (
    <div className="leaflet-control leaflet-bar">
      <Button
        onClick={() => map.zoomOut()}
        className={classes.zoomOutButton}
        aria-label="Zoom out"
        title="Zoom out"
      >
        <RemoveIcon className={classes.zoomIcon} />
      </Button>
    </div>
  );
}