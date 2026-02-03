import { useState } from 'react';
import { useMap } from 'react-leaflet';
import { toast } from 'react-toastify';
import { tss } from 'tss-react';
import { useTheme } from '@mui/material/styles';
import { Button, Paper, TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import type { ThemeMode } from '../../../utils/theme';

const useStyles = tss.withParams<{ mode: ThemeMode }>().create(({ mode }) => ({
  searchButton: {
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
  searchIcon: {
    fontSize: 28,
    color: mode.colors.primary100,
  },
  searchModal: {
    position: 'absolute',
    top: 0,
    right: 60,
    background: 'rgba(0, 0, 0, 0.8)',
    color: mode.colors.primary100,
    padding: mode.space[200],
    borderRadius: mode.space[200],
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  searchContent: {
    display: 'flex',
    alignItems: 'center',
    gap: mode.space[300],
  },
  searchInput: {
    minWidth: 220,
    '& .MuiInputBase-root': {
      height: 40,
      backgroundColor: mode.colors.primary100,
      color: mode.colors.primary500,
      borderRadius: mode.space[100],
      paddingLeft: mode.space[200],
    },
    '& .MuiOutlinedInput-notchedOutline': {
      border: `1px solid ${mode.colors.primary100}`,
    },
    '& .MuiInputBase-input': {
      padding: `${mode.space[200]} ${mode.space[300]}`,
    },
  },
  inputIcon: {
    color: mode.colors.primary500,
    fontSize: 20,
  },
  goButton: {
    fontSize: mode.fs[100],
    transitionDuration: '0.4s',
    backgroundColor: mode.colors.primary100,
    color: mode.colors.primary500,
    minWidth: 'auto',
    padding: `${mode.space[100]} ${mode.space[200]}`,
    height: 40,
    '&:hover': {
      backgroundColor: mode.colors.primary200,
    },
  },
}));

/**
 * SearchControl - A custom map control component that provides location search functionality
 * 
 * @component
 */
export default function SearchControl() {
  const map = useMap();
  const theme = useTheme();
  const mode = (theme as { mode: ThemeMode }).mode;
  const { classes } = useStyles({ mode });

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [input, setInput] = useState('');

  const handleSearch = () => {
    const [lat, lng] = input.split(',').map(coord => parseFloat(coord.trim()));
    if (!isNaN(lat) && !isNaN(lng)) {
      map.setView([lat, lng], 13);
      setInput('');
      setIsSearchOpen(false);
    } else {
      toast.error('Invalid coordinates. Please enter in "latitude, longitude" format.');
    }
  };

  return (
    <>
      <div className="leaflet-bar leaflet-control">
        <Button
          onClick={() => setIsSearchOpen(!isSearchOpen)}
          className={classes.searchButton}
          aria-label="Search location"
          title="Search location"
        >
          {isSearchOpen ? (
            <CloseIcon className={classes.searchIcon} />
          ) : (
            <SearchIcon className={classes.searchIcon} />
          )}
        </Button>

        {isSearchOpen && (
          <Paper className={classes.searchModal}>
            <div className={classes.searchContent}>
              <TextField
                size="small"
                placeholder="Search coordinates"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                aria-label="Search bar"
                className={classes.searchInput}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon className={classes.inputIcon} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <Button
                onClick={handleSearch}
                className={classes.goButton}
                aria-label="Go button"
              >
                Go
              </Button>
            </div>
          </Paper>
        )}
      </div>
    </>
  );
}