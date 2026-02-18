import { useState } from "react";
import { useMap } from "react-leaflet";
import { toast } from "react-toastify";
import { tss } from "../../../utils/tss";
import { Button, Paper, TextField, InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";

const useStyles = tss.create(({ theme }) => ({
  searchButton: {
    height: 36,
    minWidth: 36,
    backgroundColor: theme.palette.primary.dark,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 0,
    cursor: "pointer",
    appearance: "none",
    borderStyle: "outset",
    borderWidth: 2,
    borderRadius: 0,
    borderColor: theme.palette.surface.border,
    boxSizing: "border-box",
    "&:active": {
      borderStyle: "inset",
    },
  },
  searchIcon: {
    fontSize: 28,
    color: theme.palette.primary.contrastText,
  },
  searchModal: {
    position: "absolute",
    top: 0,
    right: 60,
    background: theme.palette.surface.overlay,
    color: theme.palette.primary.contrastText,
    padding: theme.spacing(1),
    borderRadius: theme.spacing(1),
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.5)",
    zIndex: 1000,
  },
  searchContent: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1.5),
  },
  searchInput: {
    minWidth: 260,
    "& .MuiInputBase-root": {
      height: 40,
      backgroundColor: theme.palette.accent.contrastText,
      color: theme.palette.secondary.main,
      borderRadius: theme.spacing(0.5),
      paddingLeft: theme.spacing(1),
    },
    "& .MuiOutlinedInput-notchedOutline": {
      border: `1px solid ${theme.palette.primary.contrastText}`,
    },
  },
  inputIcon: {
    color: theme.palette.secondary.main,
    fontSize: 20,
  },
  goButton: {
    fontSize: theme.typography.body2.fontSize,
    transitionDuration: "0.4s",
    backgroundColor: theme.palette.primary.contrastText,
    color: theme.palette.primary.dark,
    minWidth: "auto",
    padding: `${theme.spacing(0.5)} ${theme.spacing(1)}`,
    height: 40,
    "&:hover": {
      backgroundColor: theme.palette.primary.light,
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
  const { classes } = useStyles();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [input, setInput] = useState("");

  const handleSearch = () => {
    const [lat, lng] = input
      .split(",")
      .map((coord) => parseFloat(coord.trim()));
    if (!isNaN(lat) && !isNaN(lng)) {
      map.setView([lat, lng], 13);
      setInput("");
      setIsSearchOpen(false);
    } else {
      toast.error(
        'Invalid coordinates. Please enter in "latitude, longitude" format.',
      );
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
                className={classes.searchInput}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon className={classes.inputIcon} />
                      </InputAdornment>
                    ),
                  },
                  htmlInput: {
                    "aria-label": "Search bar",
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
