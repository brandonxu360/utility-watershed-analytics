import React, { useMemo, useState, useEffect } from "react";
import { tss } from "../../utils/tss";
import { useAppStore } from "../../store/store";
import { VegetationBandType } from "../../store/slices/choroplethSlice";
import { useMatch } from "@tanstack/react-router";
import { CoverageLineChart } from "../CoverageLineChart";
import { AggregatedRapRow } from "../../api/types";
import { useChoropleth } from "../../hooks/useChoropleth";
import { ChoroplethScale } from "../ChoroplethScale";
import { endYear, startYear } from "../../utils/constants";
import fetchRap from "../../api/rapApi";
import Select from "../Select";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";

type RapStatus = {
  state: "loading" | "ready" | "error";
  message?: string | null;
};

type VegetationOption = "All" | "Shrub" | "Tree";

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
}));

export const VegetationCover: React.FC = () => {
  const { classes } = useStyles();
  const {
    selectedHillslopeId,
    choropleth: {
      year: choroplethYear,
      bands: choroplethBands,
      range: choroplethRange,
      loading: choroplethLoading,
    },
    closePanel,
    clearSelectedHillslope,
    setSubcatchment,
    setChoroplethYear,
    setChoroplethBands,
    resetChoropleth,
  } = useAppStore();

  const { config } = useChoropleth();

  const match = useMatch({
    from: '/watershed/$webcloudRunId',
    shouldThrow: false,
  });
  const runId = match ? match.params.webcloudRunId : null;

  // Map UI option to band type
  const vegetationOptionToBand: Record<VegetationOption, VegetationBandType> = {
    All: "all",
    Shrub: "shrub",
    Tree: "tree",
  };

  // Derive reverse mapping from vegetationOptionToBand to avoid duplicated definitions
  const bandToVegetationOption: Record<VegetationBandType, VegetationOption> =
    Object.entries(vegetationOptionToBand).reduce(
      (acc, [option, band]) => {
        acc[band as VegetationBandType] = option as VegetationOption;
        return acc;
      },
      {} as Record<VegetationBandType, VegetationOption>,
    );

  // Initialize from store state
  const [vegetationOption, setVegetationOption] = useState<VegetationOption>(
    bandToVegetationOption[choroplethBands],
  );

  const barKeys = useMemo(() => {
    const shrubKey = {
      key: "shrub",
      color: "#8B4513",
      activeFill: "#d7a17a",
      activeStroke: "#5c3317",
    };
    const treeKey = {
      key: "tree",
      color: "#4caf50",
      activeFill: "#a5d6a7",
      activeStroke: "#2e7d32",
    };

    return vegetationOption === "Shrub"
      ? [shrubKey]
      : vegetationOption === "Tree"
        ? [treeKey]
        : [shrubKey, treeKey];
  }, [vegetationOption]);

  const years = Array.from({ length: endYear - startYear + 1 }, (_, i) =>
    String(startYear + i),
  );

  // Initialize from store state
  const [selectedYear, setSelectedYear] = useState<string>(
    choroplethYear === null ? "All" : String(choroplethYear),
  );

  // Sync vegetation option changes to choropleth store
  const handleVegetationChange = (v: string) => {
    const option = v as "All" | "Shrub" | "Tree";
    setVegetationOption(option);
    setChoroplethBands(vegetationOptionToBand[option]);
  };

  // Sync year changes to choropleth store
  const handleYearChange = (v: string) => {
    setSelectedYear(v);
    setChoroplethYear(v === "All" ? null : Number(v));
  };

  // RAP timeseries fetched for selected hillslope (topaz id)
  const [rapTimeSeries, setRapTimeSeries] = useState<AggregatedRapRow[] | null>(
    null,
  );
  const [rapStatus, setRapStatus] = useState<RapStatus>({ state: "ready" });

  useEffect(() => {
    let mounted = true;
    async function loadRap() {
      setRapStatus({ state: "loading" });

      try {
        const rows = selectedHillslopeId
          ? await fetchRap({
            mode: "hillslope",
            topazId: selectedHillslopeId,
            runId: runId!,
            year: selectedYear === "All" ? undefined : Number(selectedYear),
          })
          : runId
            ? await fetchRap({
              mode: "watershed",
              weppId: 108,
              runId: runId,
              year: selectedYear === "All" ? undefined : Number(selectedYear),
            })
            : null;

        if (!mounted) return;
        setRapTimeSeries(Array.isArray(rows) ? rows : []);
        setRapStatus({ state: "ready" });
      } catch (err: unknown) {
        if (!mounted) return;
        const message = err instanceof Error ? err.message : String(err);
        setRapStatus({ state: "error", message });
        setRapTimeSeries(null);
      }
    }

    loadRap();
    return () => {
      mounted = false;
    };
  }, [selectedHillslopeId, selectedYear, runId]);

  const singleHillslopeChartData = useMemo(() => {
    if (!rapTimeSeries || rapTimeSeries.length === 0) return null;

    const rows = rapTimeSeries as AggregatedRapRow[];
    const toSeries = (
      year: number,
      coverage: number,
      shrub: number,
      tree: number,
    ) => ({ name: String(year), coverage, shrub, tree });

    if (selectedYear !== "All") {
      const y = Number(selectedYear);
      const r = rows.find((rr) => rr.year === y);
      return [toSeries(y, r?.coverage ?? 0, r?.shrub ?? 0, r?.tree ?? 0)];
    }

    const map = new Map<
      number,
      { coverage: number; shrub: number; tree: number }
    >();
    for (let y = startYear; y <= endYear; y++)
      map.set(y, { coverage: 0, shrub: 0, tree: 0 });
    for (const r of rows) {
      map.set(r.year, {
        coverage: r.coverage ?? 0,
        shrub: r.shrub ?? 0,
        tree: r.tree ?? 0,
      });
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([yr, v]) => toSeries(yr, v.coverage, v.shrub, v.tree));
  }, [rapTimeSeries, selectedYear]);

  const chartData = singleHillslopeChartData || [];

  const chartTitle = selectedHillslopeId
    ? `${vegetationOption} Coverage - Hillslope ${selectedHillslopeId} (${selectedYear})`
    : `${vegetationOption} Coverage (${selectedYear})`;

  return (
    <div>
      <div className={classes.titleBar}>
        <div className={classes.vegCoverSelector}>
          <div className={classes.optionAlign}>
            <Typography className={classes.optionAlignLabel}>
              Vegetation Cover:
            </Typography>
            <Select
              id="veg-cover-title"
              value={vegetationOption}
              onChange={handleVegetationChange}
              options={["All", "Shrub", "Tree"]}
              ariaLabel="Select vegetation type"
            />
          </div>
        </div>
        <div className={classes.dateSelector}>
          <div className={classes.optionAlign}>
            <Typography className={classes.optionAlignLabel}>
              Select Year:
            </Typography>
            <Select
              id="veg-year"
              value={selectedYear}
              onChange={handleYearChange}
              options={["All", ...years.slice().reverse()]}
              ariaLabel="Select vegetation year"
            />
          </div>
          <IconButton
            className={classes.closeButton}
            data-testid="veg-close-button"
            onClick={() => {
              clearSelectedHillslope();
              setSubcatchment(false);
              resetChoropleth();
              closePanel();
            }}
          >
            <CloseIcon />
          </IconButton>
        </div>
      </div>

      {rapStatus.state === "loading" && (
        <Typography align="center">Loading vegetation data…</Typography>
      )}

      <CoverageLineChart
        data={chartData}
        title={chartTitle}
        lineKeys={barKeys}
      />

      {config && !choroplethLoading && choroplethRange && (
        <div style={{ marginTop: "32px" }}>
          <ChoroplethScale
            colormap={config.colormap}
            range={choroplethRange}
            unit={config.unit}
            style={{ padding: "0 1rem", marginBottom: "0.5rem" }}
          />
        </div>
      )}
    </div>
  );
};

export default VegetationCover;
