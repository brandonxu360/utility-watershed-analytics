import React, { useMemo, useRef, useState, useEffect } from "react";
import { tss } from "../../utils/tss";
import { downloadCsv, downloadChartAsPng } from "../../utils/download";
import { useWatershed } from "../../contexts/WatershedContext";
import { getLayerParams } from "../../layers/types";
import { useRunId } from "../../hooks/useRunId";
import { CoverageLineChart } from "../CoverageLineChart";

import {
  endYear,
  startYear,
  VEGETATION_OPTIONS,
  type VegetationBandType,
} from "../../utils/constants";

import { AggregatedRapRow } from "../../api/types";
import fetchRap from "../../api/rapApi";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import MuiSelect, { type SelectChangeEvent } from "@mui/material/Select";

type RapStatus = {
  state: "loading" | "ready" | "error";
  message?: string | null;
};

const useStyles = tss.create(({ theme }) => ({
  titleBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    margin: `${theme.spacing(2)} ${theme.spacing(3)}`,
  },
  vegCoverSelector: {
    display: "flex",
    alignItems: "center",
    width: "auto",
    minWidth: 180,
    gap: theme.spacing(2),
  },
  dateSelector: {
    display: "flex",
    alignItems: "center",
    width: "auto",
    minWidth: 180,
    gap: theme.spacing(2),
  },
  optionAlign: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    marginRight: theme.spacing(0.5),
  },
  optionAlignLabel: {
    display: "block",
    whiteSpace: "nowrap",
    fontSize: theme.typography.subtitle2.fontSize,
  },
  select: {
    minWidth: 100,
    color: theme.palette.primary.contrastText,
    backgroundColor: theme.palette.primary.main,
    fontSize: theme.typography.body2.fontSize,
    "& .MuiSelect-select": {
      padding: `${theme.spacing(0.5)} ${theme.spacing(1)}`,
      paddingRight: `${theme.spacing(4)} !important`,
    },
    "& .MuiOutlinedInput-notchedOutline": {
      border: "none",
    },
    "& .MuiSvgIcon-root": {
      color: theme.palette.primary.contrastText,
    },
  },
  closeButton: {
    backgroundColor: theme.palette.error.main,
    color: theme.palette.primary.contrastText,
    borderRadius: 2,
    fontSize: theme.typography.caption.fontSize,
    cursor: "pointer",
    "&:hover": {
      backgroundColor: theme.palette.error.main,
    },
  },
  downloadButton: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    borderRadius: 2,
    fontSize: theme.typography.caption.fontSize,
    cursor: "pointer",
    "&:hover": {
      backgroundColor: theme.palette.primary.dark,
    },
  },
}));

export const VegetationCover: React.FC = () => {
  const { classes } = useStyles();
  const {
    layerDesired,
    dispatchLayerAction,
    selectedHillslopeId,
    clearSelectedHillslope,
  } = useWatershed();

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [downloadAnchorEl, setDownloadAnchorEl] = useState<HTMLElement | null>(
    null,
  );

  const runId = useRunId();
  const watershedName = (runId ?? "watershed")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "_");

  const choroplethParams = getLayerParams(layerDesired, "choropleth");
  const bands = (choroplethParams.bands as VegetationBandType) ?? "all";
  const selectedYear =
    choroplethParams.year === null ? "All" : String(choroplethParams.year);

  const vegOption =
    VEGETATION_OPTIONS.find((o) => o.value === bands) ?? VEGETATION_OPTIONS[0];

  const years = useMemo(
    () =>
      Array.from({ length: endYear - startYear + 1 }, (_, i) =>
        String(startYear + i),
      ),
    [],
  );

  const handleBandsChange = (e: SelectChangeEvent) => {
    dispatchLayerAction({
      type: "SET_PARAM",
      id: "choropleth",
      key: "bands",
      value: e.target.value,
    });
  };

  const handleYearChange = (e: SelectChangeEvent) => {
    const v = e.target.value;
    dispatchLayerAction({
      type: "SET_PARAM",
      id: "choropleth",
      key: "year",
      value: v === "All" ? null : Number(v),
    });
  };

  // RAP timeseries
  const [rapTimeSeries, setRapTimeSeries] = useState<AggregatedRapRow[] | null>(
    null,
  );
  const [rapStatus, setRapStatus] = useState<RapStatus>({ state: "ready" });

  useEffect(() => {
    const controller = new AbortController();

    async function loadRap() {
      if (!runId) {
        setRapTimeSeries([]);
        setRapStatus({ state: "ready" });
        return;
      }

      setRapStatus({ state: "loading" });
      const yearParam =
        selectedYear === "All" ? undefined : Number(selectedYear);

      try {
        const rows = selectedHillslopeId
          ? await fetchRap(
              {
                mode: "hillslope",
                topazId: selectedHillslopeId,
                runId,
                year: yearParam,
              },
              controller.signal,
            )
          : await fetchRap(
              { mode: "watershed", runId, year: yearParam },
              controller.signal,
            );

        if (controller.signal.aborted) return;
        setRapTimeSeries(Array.isArray(rows) ? rows : []);
        setRapStatus({ state: "ready" });
      } catch (err: unknown) {
        if (controller.signal.aborted) return;
        setRapStatus({
          state: "error",
          message: err instanceof Error ? err.message : String(err),
        });
        setRapTimeSeries(null);
      }
    }

    loadRap();
    return () => {
      controller.abort();
    };
  }, [selectedHillslopeId, selectedYear, runId]);

  const chartData = useMemo(() => {
    if (!rapTimeSeries?.length) return [];

    const toSeries = (
      year: number,
      coverage: number,
      shrub: number,
      tree: number,
    ) => ({ name: String(year), coverage, shrub, tree });

    if (selectedYear !== "All") {
      const y = Number(selectedYear);
      const r = rapTimeSeries.find((rr) => rr.year === y);
      return [toSeries(y, r?.coverage ?? 0, r?.shrub ?? 0, r?.tree ?? 0)];
    }

    const map = new Map<
      number,
      { coverage: number; shrub: number; tree: number }
    >();
    for (let y = startYear; y <= endYear; y++)
      map.set(y, { coverage: 0, shrub: 0, tree: 0 });
    for (const r of rapTimeSeries) {
      map.set(r.year, {
        coverage: r.coverage ?? 0,
        shrub: r.shrub ?? 0,
        tree: r.tree ?? 0,
      });
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a - b)
      .map(([yr, v]) => toSeries(yr, v.coverage, v.shrub, v.tree));
  }, [rapTimeSeries, selectedYear]);

  // When the user selects "All" years we prefer to show a percent sign
  // instead of the literal word so titles read like "All Coverage (%)".
  const selectedYearDisplay = selectedYear === "All" ? "%" : selectedYear;

  const chartTitle = selectedHillslopeId
    ? `${vegOption.label} Coverage - Hillslope ${selectedHillslopeId} (${selectedYearDisplay})`
    : `${vegOption.label} Coverage (${selectedYearDisplay})`;

  const hillslopeSuffix = selectedHillslopeId
    ? `_hillslope_${selectedHillslopeId}`
    : "";
  const fileBase = `${watershedName}_veg_cover_${vegOption.value}_${selectedYear === "All" ? "all_years" : selectedYear}${hillslopeSuffix}`;
  const csvFilename = `${fileBase}.csv`;
  const pngFilename = `${fileBase}.png`;

  function buildVegCsvRows() {
    return chartData.map((row) => [
      row.name,
      ...vegOption.chartKeys.map((k) => {
        const v = row[k.key as keyof typeof row] as number;
        return typeof v === "number" ? parseFloat(v.toFixed(4)) : v;
      }),
    ]);
  }

  function buildVegCsvHeaders() {
    return [
      "Year",
      ...vegOption.chartKeys.map(
        (k) => k.key.charAt(0).toUpperCase() + k.key.slice(1),
      ),
    ];
  }

  async function handleDownloadGraph() {
    setDownloadAnchorEl(null);
    if (chartContainerRef.current) {
      try {
        await downloadChartAsPng(chartContainerRef.current, pngFilename);
      } catch (err) {
        console.error("Failed to export chart as PNG.", err);
      }
    }
  }

  function handleDownloadCsv() {
    setDownloadAnchorEl(null);
    downloadCsv(csvFilename, buildVegCsvHeaders(), buildVegCsvRows());
  }

  async function handleDownloadAll() {
    setDownloadAnchorEl(null);
    if (chartContainerRef.current) {
      try {
        await downloadChartAsPng(chartContainerRef.current, pngFilename);
      } catch (err) {
        console.error("Failed to export chart as PNG.", err);
      }
    }
    downloadCsv(csvFilename, buildVegCsvHeaders(), buildVegCsvRows());
  }

  return (
    <div>
      <div className={classes.titleBar}>
        <div className={classes.vegCoverSelector}>
          <div className={classes.optionAlign}>
            <Typography className={classes.optionAlignLabel}>
              Vegetation Cover:
            </Typography>
            <MuiSelect
              id="veg-cover-title"
              value={bands}
              onChange={handleBandsChange}
              size="small"
              className={classes.select}
              aria-label="Select vegetation type"
              MenuProps={{ style: { zIndex: 20000 } }}
            >
              {VEGETATION_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </MuiSelect>
          </div>
        </div>
        <div className={classes.dateSelector}>
          <div className={classes.optionAlign}>
            <Typography className={classes.optionAlignLabel}>
              Select Year:
            </Typography>
            <MuiSelect
              id="veg-year"
              value={selectedYear}
              onChange={handleYearChange}
              size="small"
              className={classes.select}
              aria-label="Select vegetation year"
              MenuProps={{
                style: { zIndex: 20000 },
                PaperProps: { style: { maxHeight: 200 } },
              }}
            >
              <MenuItem value="All">All</MenuItem>
              {years
                .slice()
                .reverse()
                .map((y) => (
                  <MenuItem key={y} value={y}>
                    {y}
                  </MenuItem>
                ))}
            </MuiSelect>
          </div>
          <IconButton
            className={classes.downloadButton}
            aria-label="Download vegetation cover"
            onClick={(e) => setDownloadAnchorEl(e.currentTarget)}
          >
            <DownloadIcon />
          </IconButton>
          <IconButton
            className={classes.closeButton}
            data-testid="veg-close-button"
            onClick={() => {
              clearSelectedHillslope();
              dispatchLayerAction({
                type: "TOGGLE",
                id: "choropleth",
                on: false,
              });
            }}
          >
            <CloseIcon />
          </IconButton>
        </div>
      </div>

      <Menu
        anchorEl={downloadAnchorEl}
        open={Boolean(downloadAnchorEl)}
        onClose={() => setDownloadAnchorEl(null)}
        sx={{ zIndex: 20000 }}
      >
        <MenuItem onClick={handleDownloadAll}>All</MenuItem>
        <MenuItem onClick={handleDownloadGraph}>Graph (PNG)</MenuItem>
        <MenuItem onClick={handleDownloadCsv}>Data (CSV)</MenuItem>
      </Menu>

      {rapStatus.state === "loading" && (
        <Typography align="center">Loading vegetation data…</Typography>
      )}

      <div ref={chartContainerRef}>
        <CoverageLineChart
          data={chartData}
          title={chartTitle}
          lineKeys={vegOption.chartKeys}
          yAxisLabel="Percent Cover (%)"
        />
      </div>
    </div>
  );
};

export default VegetationCover;
