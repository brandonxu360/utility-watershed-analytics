import { useMap } from 'react-leaflet';
import { tss } from 'tss-react';
import { useTheme } from '@mui/material/styles';
import { Button } from '@mui/material';
import RemoveIcon from '@mui/icons-material/Remove';
import type { ThemeMode } from '../../../utils/theme';

const useStyles = tss.withParams<{ mode: ThemeMode }>().create(({ mode }) => ({
  zoomOutButton: {
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
  zoomIcon: {
    fontSize: 28,
    color: mode.colors.primary100,
  },
}));

export default function ZoomOutControl() {
  const map = useMap();
  const theme = useTheme();
  const mode = (theme as { mode: ThemeMode }).mode;
  const { classes } = useStyles({ mode });

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