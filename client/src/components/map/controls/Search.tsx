import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { useMap } from "react-leaflet";
import { toast } from "react-toastify";
import { useNavigate } from "@tanstack/react-router";
import L from "leaflet";
import { tss } from "../../../utils/tss";
import { useRunId } from "../../../hooks/useRunId";
import {
  Button,
  Paper,
  TextField,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import type { WatershedProperties } from "../../../types/WatershedProperties";

type WatershedIndexItem = {
  id: string;
  name: string;
  sourceName: string;
  huc: string;
  center: [number, number];
  bbox?: [number, number, number, number];
};

type MatchField = "name" | "sourceName" | "huc" | "id";

type SearchCandidate = {
  item: WatershedIndexItem;
  matchField: MatchField;
};

type SearchControlProps = {
  watersheds?: GeoJSON.FeatureCollection<GeoJSON.Geometry, WatershedProperties>;
};

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightMatches(
  text: string,
  query: string,
  markClassName: string,
): ReactNode {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return text;
  }

  const tokens = normalizedQuery
    .split(/\s+/)
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  if (tokens.length === 0) {
    return text;
  }

  const pattern = new RegExp(`(${tokens.map(escapeRegExp).join("|")})`, "ig");
  const parts = text.split(pattern);

  return parts.map((part, index) => {
    const isMatch = tokens.some((token) => part.toLowerCase() === token);
    return isMatch ? (
      <mark key={`${part}-${index}`} className={markClassName}>
        {part}
      </mark>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    );
  });
}

const SEARCH_FIELDS: MatchField[] = ["id", "huc", "name", "sourceName"];

function parseLatLng(input: string): [number, number] | null {
  const trimmed = input.trim();
  const coordsPattern = /^(-?\d+(?:\.\d+)?)\s*(?:,\s*|\s+)(-?\d+(?:\.\d+)?)$/;
  const match = trimmed.match(coordsPattern);

  if (!match) {
    return null;
  }

  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }

  return [lat, lng];
}

function isValidLatLngRange(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

function isCoordinateLike(input: string): boolean {
  const normalized = input.trim();
  if (!/\d/.test(normalized)) {
    return false;
  }
  if (parseLatLng(normalized) !== null) {
    return true;
  }
  // Comma usually indicates a lat/lng attempt even when parsing fails (e.g. "45,").
  if (normalized.includes(",")) {
    return true;
  }
  const tokens = normalized.split(/\s+/).filter(Boolean);
  const numericTokens = tokens.filter((token) =>
    /^-?\d+(?:\.\d+)?$/.test(token),
  );
  return numericTokens.length >= 2;
}

function rankWatershedMatches(
  query: string,
  index: WatershedIndexItem[],
): SearchCandidate[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [];
  }

  const scored = new Map<string, { score: number; matchField: MatchField }>();
  const tokens = normalized.split(/\s+/).filter(Boolean);

  for (const item of index) {
    for (const field of SEARCH_FIELDS) {
      const rawValue = String(item[field] ?? "");
      const value = rawValue.trim().toLowerCase();
      if (!value) {
        continue;
      }

      let score: number | null = null;

      if ((field === "id" || field === "huc") && value === normalized) {
        score = 0;
      } else if (value === normalized) {
        score = 1;
      } else if (value.startsWith(normalized)) {
        score = 2;
      } else if (value.includes(normalized)) {
        score = 3;
      } else if (
        tokens.length > 1 &&
        tokens.every((token) => value.includes(token))
      ) {
        score = 4;
      }

      if (score == null) {
        continue;
      }

      const previous = scored.get(item.id);
      if (!previous || score < previous.score) {
        scored.set(item.id, { score, matchField: field });
      }
    }
  }

  return index
    .map((item) => {
      const score = scored.get(item.id);
      return score
        ? {
            item,
            matchField: score.matchField,
            score: score.score,
          }
        : null;
    })
    .filter(
      (entry): entry is SearchCandidate & { score: number } => entry !== null,
    )
    .sort((a, b) => {
      if (a.score !== b.score) {
        return a.score - b.score;
      }

      return a.item.name.localeCompare(b.item.name);
    })
    .map(({ item, matchField }) => ({ item, matchField }));
}

function collectLngLatPairs(value: unknown, pairs: [number, number][]): void {
  if (!Array.isArray(value)) {
    return;
  }

  if (
    value.length >= 2 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number"
  ) {
    pairs.push([value[0], value[1]]);
    return;
  }

  for (const child of value) {
    collectLngLatPairs(child, pairs);
  }
}

function collectGeometryPairs(
  geometry: GeoJSON.Geometry,
  pairs: [number, number][],
): void {
  if (geometry.type === "GeometryCollection") {
    for (const child of geometry.geometries) {
      collectGeometryPairs(child, pairs);
    }
    return;
  }

  collectLngLatPairs(geometry.coordinates, pairs);
}

function getBoundsFromGeometry(
  geometry: GeoJSON.Geometry | null | undefined,
): [number, number, number, number] | null {
  if (!geometry) {
    return null;
  }

  const pairs: [number, number][] = [];
  collectGeometryPairs(geometry, pairs);

  if (pairs.length === 0) {
    return null;
  }

  let west = Infinity;
  let east = -Infinity;
  let south = Infinity;
  let north = -Infinity;

  for (const [lng, lat] of pairs) {
    west = Math.min(west, lng);
    east = Math.max(east, lng);
    south = Math.min(south, lat);
    north = Math.max(north, lat);
  }

  return [south, west, north, east];
}

function toSearchIndex(
  watersheds?: GeoJSON.FeatureCollection<GeoJSON.Geometry, WatershedProperties>,
): WatershedIndexItem[] {
  if (!watersheds?.features?.length) {
    return [];
  }

  return watersheds.features
    .map((feature) => {
      const bbox = getBoundsFromGeometry(feature.geometry);
      if (!bbox) {
        return null;
      }

      const [south, west, north, east] = bbox;
      const center: [number, number] = [(south + north) / 2, (west + east) / 2];
      const props = feature.properties;

      const item: WatershedIndexItem = {
        id: String(feature.id ?? props.pws_id ?? ""),
        name: props.pws_name ?? props.huc10_name ?? "Unknown Watershed",
        sourceName: props.srcname ?? "",
        huc: props.huc10_id ?? "",
        center,
        bbox,
      };

      return item.id ? item : null;
    })
    .filter((item): item is WatershedIndexItem => item !== null);
}

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
    background: theme.palette.background.paper,
    color: theme.palette.text.primary,
    padding: theme.spacing(1.25),
    borderRadius: theme.spacing(1),
    border: `1px solid ${theme.palette.surface.border}`,
    boxShadow: "0 10px 26px rgba(0, 0, 0, 0.35)",
    zIndex: 1000,
    minWidth: 400,
    maxWidth: "min(440px, calc(100vw - 110px))",
  },
  searchContent: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1.5),
  },
  searchBody: {
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(0.75),
  },
  searchHeading: {
    fontSize: theme.typography.caption.fontSize,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: theme.palette.text.secondary,
  },
  searchInput: {
    minWidth: 0,
    flex: 1,
    "& .MuiInputBase-root": {
      height: 40,
      backgroundColor: theme.palette.background.default,
      color: theme.palette.text.primary,
      borderRadius: theme.spacing(0.5),
      paddingLeft: theme.spacing(1),
    },
    "& .MuiInputBase-input::placeholder": {
      color: theme.palette.text.secondary,
      opacity: 0.72,
      fontSize: "0.9rem",
      fontWeight: 400,
    },
    "& .MuiOutlinedInput-notchedOutline": {
      border: `1px solid ${theme.palette.surface.border}`,
    },
  },
  inputIcon: {
    color: theme.palette.text.secondary,
    fontSize: 20,
  },
  goButton: {
    fontSize: theme.typography.body2.fontSize,
    transitionDuration: "0.4s",
    backgroundColor: theme.palette.accent.main,
    color: theme.palette.accent.contrastText,
    minWidth: "auto",
    padding: `${theme.spacing(0.5)} ${theme.spacing(1)}`,
    height: 40,
    "&:hover": {
      backgroundColor: theme.palette.accent.dark,
    },
  },
  suggestions: {
    marginTop: theme.spacing(0.25),
    maxHeight: 220,
    overflowY: "auto",
    backgroundColor: theme.palette.background.default,
    borderRadius: theme.spacing(0.5),
    border: `1px solid ${theme.palette.surface.border}`,
  },
  suggestionItem: {
    "& + &": {
      borderTop: `1px solid ${
        theme.palette.mode === "dark"
          ? "rgba(255, 255, 255, 0.08)"
          : "rgba(0, 0, 0, 0.08)"
      }`,
    },
  },
  suggestionText: {
    color: theme.palette.text.primary,
    margin: 0,
  },
  suggestionMeta: {
    color: theme.palette.text.secondary,
    fontSize: theme.typography.caption.fontSize,
    display: "block",
    lineHeight: 1.3,
  },
  matchHighlight: {
    backgroundColor: theme.palette.accent.main,
    color: theme.palette.accent.contrastText,
  },
}));

/**
 * SearchControl - A custom map control component that provides location search functionality
 *
 * @component
 */
export default function SearchControl({ watersheds }: SearchControlProps) {
  const map = useMap();
  const navigate = useNavigate();
  const runId = useRunId();
  const { classes } = useStyles();
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    // Keep control interactions (click, drag, wheel) from leaking to the map.
    L.DomEvent.disableClickPropagation(root);
    L.DomEvent.disableScrollPropagation(root);
  }, []);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [input, setInput] = useState("");
  const [results, setResults] = useState<SearchCandidate[]>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);

  const searchIndex = useMemo(() => toSearchIndex(watersheds), [watersheds]);

  const clearSearchState = () => {
    setInput("");
    setResults([]);
    setActiveSuggestionIndex(0);
  };

  const closeAndReset = () => {
    clearSearchState();
    setIsSearchOpen(false);
  };

  const selectWatershed = (candidate: SearchCandidate) => {
    navigate({ to: `/watershed/${candidate.item.id}` });

    closeAndReset();
  };

  const handleSearch = () => {
    const trimmedInput = input.trim();
    const normalizedQuery = trimmedInput.toLowerCase();
    if (!normalizedQuery) {
      return;
    }

    const coords = parseLatLng(trimmedInput);
    if (coords) {
      const [lat, lng] = coords;
      if (!isValidLatLngRange(lat, lng)) {
        toast.error(
          "Invalid coordinate range. Latitude must be between -90 and 90, longitude between -180 and 180.",
        );
        return;
      }
      map.setView([lat, lng], 13);
      if (runId) {
        navigate({ to: "/" });
      }
      closeAndReset();
      return;
    }

    if (isCoordinateLike(trimmedInput)) {
      toast.error(
        'Invalid coordinates. Use "latitude, longitude" or "latitude longitude".',
      );
      return;
    }

    const matches = rankWatershedMatches(normalizedQuery, searchIndex);
    if (matches.length === 0) {
      setResults([]);
      toast.error("No watershed match found. Try coordinates or another name.");
      return;
    }

    setResults(matches);
    setActiveSuggestionIndex(0);
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" && results.length > 0) {
      event.preventDefault();
      setActiveSuggestionIndex((current) => (current + 1) % results.length);
      return;
    }

    if (event.key === "ArrowUp" && results.length > 0) {
      event.preventDefault();
      setActiveSuggestionIndex((current) =>
        current === 0 ? results.length - 1 : current - 1,
      );
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (results.length > 0) {
        selectWatershed(results[activeSuggestionIndex]);
      } else {
        handleSearch();
      }
    }
  };

  return (
    <>
      <div className="leaflet-bar leaflet-control" ref={rootRef}>
        <Button
          onClick={() => {
            if (isSearchOpen) {
              closeAndReset();
            } else {
              setIsSearchOpen(true);
            }
          }}
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
            <div className={classes.searchBody}>
              <Typography className={classes.searchHeading}>
                Find Watershed
              </Typography>
              <div className={classes.searchContent}>
                <TextField
                  size="small"
                  placeholder="Coordinates or watershed"
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    setResults([]);
                    setActiveSuggestionIndex(0);
                  }}
                  onKeyDown={handleInputKeyDown}
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

              {results.length > 0 && (
                <List className={classes.suggestions} role="listbox">
                  {results.map((candidate, index) => {
                    const metadata = [
                      candidate.item.huc,
                      candidate.item.sourceName,
                    ]
                      .filter(Boolean)
                      .join(" • ");
                    const matchedFieldValue = String(
                      candidate.item[candidate.matchField] ?? "",
                    ).trim();
                    const showMatchedFieldLine =
                      candidate.matchField !== "name" && !!matchedFieldValue;

                    return (
                      <ListItemButton
                        key={candidate.item.id}
                        className={classes.suggestionItem}
                        selected={index === activeSuggestionIndex}
                        onClick={() => selectWatershed(candidate)}
                        role="option"
                        aria-selected={index === activeSuggestionIndex}
                      >
                        <ListItemText
                          primary={highlightMatches(
                            candidate.item.name,
                            input,
                            classes.matchHighlight,
                          )}
                          secondary={
                            metadata || showMatchedFieldLine ? (
                              <>
                                {metadata && (
                                  <span className={classes.suggestionMeta}>
                                    {metadata}
                                  </span>
                                )}
                                {showMatchedFieldLine && (
                                  <span className={classes.suggestionMeta}>
                                    {`${candidate.matchField}: `}
                                    {highlightMatches(
                                      matchedFieldValue,
                                      input,
                                      classes.matchHighlight,
                                    )}
                                  </span>
                                )}
                              </>
                            ) : undefined
                          }
                          className={classes.suggestionText}
                          slotProps={{
                            secondary: {
                              className: classes.suggestionMeta,
                            },
                          }}
                        />
                      </ListItemButton>
                    );
                  })}
                </List>
              )}
            </div>
          </Paper>
        )}
      </div>
    </>
  );
}
