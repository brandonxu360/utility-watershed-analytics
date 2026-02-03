import { useMap } from 'react-leaflet';
import { tss } from 'tss-react';
import { useTheme } from '@mui/material/styles';
import { Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import type { ThemeMode } from '../../../utils/theme';

const useStyles = tss.withParams<{ mode: ThemeMode }>().create(({ mode }) => ({
  zoomInButton: {
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

export default function ZoomInControl() {
  const map = useMap();
  const theme = useTheme();
  const mode = (theme as { mode: ThemeMode }).mode;
  const { classes } = useStyles({ mode });

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