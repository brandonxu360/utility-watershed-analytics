import { toast } from "react-toastify";
import { tss } from 'tss-react';
import { useTheme } from '@mui/material/styles';
import { Button } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import type { ThemeMode } from '../../../utils/theme';

const useStyles = tss.withParams<{ mode: ThemeMode }>().create(({ mode }) => ({
  settingsButton: {
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
  settingsIcon: {
    fontSize: 28,
    color: mode.colors.primary100,
  },
}));

/**
 * SettingsControl - A custom map control component that provides settings functionality
 * 
 * @component
 */
export default function SettingsControl() {
  const theme = useTheme();
  const mode = (theme as { mode: ThemeMode }).mode;
  const { classes } = useStyles({ mode });

  return (
    <div className="leaflet-bar leaflet-control">
      <Button
        onClick={() => toast.error('Feature not implemented yet')}
        className={classes.settingsButton}
        aria-label="Open settings"
        title="Open settings"
      >
        <SettingsIcon className={classes.settingsIcon} />
      </Button>
    </div>
  );
}