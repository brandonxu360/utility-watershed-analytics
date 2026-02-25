import React, { useEffect, useState, useMemo } from "react";
import { tss } from "../../utils/tss";
import { useAppStore } from "../../store/store";
import { useMatch } from "@tanstack/react-router";
import { watershedOverviewRoute } from "../../routes/router";
import { fetchScenariosParquet, ScenarioRow } from "../../api/scenariosApi";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";

type LoadStatus = {
  state: "loading" | "ready" | "error";
  message?: string | null;
};

/** A single metric column shown in the pivoted table. */
type MetricColumn = {
  /** Display header (includes units). */
  header: string;
  /** If set, look up this key in the raw data to get the value. */
  sourceKey?: string;
  /**
   * If set, compute the value from the scenario's raw metrics map.
   * Takes precedence over sourceKey.
   */
  compute?: (metrics: Map<string, number>) => number | null;
};

/**
 * The columns we display, in order.  The "water discharge (mm)" column is
 * derived: discharge_m3_yr / (area_ha × 10 000) × 1 000.
 */
const METRIC_COLUMNS: MetricColumn[] = [
  {
    header: "Total contributing area to outlet (ha)",
    sourceKey: "Total contributing area to outlet",
  },
  {
    header: "Avg. Ann. water discharge from outlet (mm)",
    compute: (m) => {
      const discharge = m.get("Avg. Ann. water discharge from outlet");
      const area = m.get("Total contributing area to outlet");
      if (discharge == null || area == null || area === 0) return null;
      return (discharge / (area * 10_000)) * 1_000;
    },
  },
  {
    header: "Avg. Ann. total hillslope soil loss (tonnes)",
    sourceKey: "Avg. Ann. total hillslope soil loss",
  },
  {
    header: "Avg. Ann. total channel soil loss (tonnes)",
    sourceKey: "Avg. Ann. total channel soil loss",
  },
  {
    header: "Avg. Ann. sediment discharge from outlet (tonnes)",
    sourceKey: "Avg. Ann. sediment discharge from outlet",
  },
];

const useStyles = tss.create(({ theme }) => ({
  titleBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    margin: `${theme.spacing(1)} ${theme.spacing(3)}`,
  },
  titleLabel: {
    fontSize: theme.typography.subtitle1.fontSize,
    fontWeight: 600,
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
  tableWrapper: {
    overflowX: "auto",
    margin: `0 ${theme.spacing(3)} ${theme.spacing(2)}`,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: theme.typography.body2.fontSize,
    tableLayout: "fixed",
    "& th, & td": {
      padding: `${theme.spacing(1)} ${theme.spacing(1.5)}`,
      borderBottom: `1px solid ${theme.palette.divider}`,
      verticalAlign: "middle",
    },
    "& th": {
      fontWeight: 600,
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      textAlign: "center",
      whiteSpace: "normal",
      wordWrap: "break-word",
      position: "sticky",
      top: 0,
      zIndex: 1,
    },
    "& td": {
      textAlign: "right",
    },
    "& tbody tr:nth-of-type(odd)": {
      backgroundColor: theme.palette.action.hover,
    },
    "& tbody tr:hover": {
      backgroundColor: theme.palette.action.selected,
    },
  },
  scenarioCell: {
    fontWeight: 600,
    textAlign: "left",
    whiteSpace: "nowrap",
  },
  scenarioHeader: {
    textAlign: "left",
  },
  emptyMessage: {
    padding: theme.spacing(3),
    textAlign: "center",
  },
}));

/** Pretty-print a scenario key like "sbs_map" → "Sbs Map". */
function formatScenarioName(raw: string): string {
  return raw
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Format a number for the table cells. */
function formatValue(val: number | null): string {
  if (val == null) return "—";
  if (val === 0) return "0";
  const abs = Math.abs(val);
  if (abs >= 0.01 && abs < 1e6) {
    return val.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }
  return val.toExponential(3);
}

/**
 * Pivot raw parquet rows into a map of scenario → metric values.
 * Each scenario gets a Map<metricKey, value>.
 */
function pivotData(
  rows: ScenarioRow[],
): { scenario: string; metrics: Map<string, number> }[] {
  const grouped = new Map<string, Map<string, number>>();

  for (const row of rows) {
    let metricMap = grouped.get(row.scenario);
    if (!metricMap) {
      metricMap = new Map();
      grouped.set(row.scenario, metricMap);
    }
    metricMap.set(row.key, row.value);
  }

  return Array.from(grouped.entries()).map(([scenario, metrics]) => ({
    scenario,
    metrics,
  }));
}

export const ScenariosTable: React.FC = () => {
  const { classes } = useStyles();
  const { closePanel } = useAppStore();

  const match = useMatch({
    from: watershedOverviewRoute.id,
    shouldThrow: false,
  });
  const runId = match ? match.params.webcloudRunId : null;

  const [rows, setRows] = useState<ScenarioRow[] | null>(null);
  const [status, setStatus] = useState<LoadStatus>({ state: "loading" });

  // Fetch parquet data
  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!runId) {
        setStatus({ state: "error", message: "No watershed selected" });
        return;
      }

      setStatus({ state: "loading" });
      try {
        const data = await fetchScenariosParquet(runId);
        if (!mounted) return;
        setRows(data);
        setStatus({ state: "ready" });
      } catch (err: unknown) {
        if (!mounted) return;
        const message = err instanceof Error ? err.message : String(err);
        setStatus({ state: "error", message });
        setRows(null);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [runId]);

  // Pivot data: scenarios as rows, metrics as columns
  const pivoted = useMemo(() => {
    if (!rows || rows.length === 0) return [];
    return pivotData(rows);
  }, [rows]);

  return (
    <div>
      <div className={classes.titleBar}>
        <Typography className={classes.titleLabel}>
          Watershed Scenarios
        </Typography>
        <IconButton
          className={classes.closeButton}
          data-testid="scenarios-close-button"
          onClick={() => closePanel()}
        >
          <CloseIcon />
        </IconButton>
      </div>

      {status.state === "loading" && (
        <Typography align="center" className={classes.emptyMessage}>
          Loading scenario data…
        </Typography>
      )}

      {status.state === "error" && (
        <Typography
          align="center"
          color="error"
          className={classes.emptyMessage}
        >
          {status.message ?? "Failed to load scenario data"}
        </Typography>
      )}

      {status.state === "ready" && pivoted.length === 0 && (
        <Typography align="center" className={classes.emptyMessage}>
          No scenario data available.
        </Typography>
      )}

      {status.state === "ready" && pivoted.length > 0 && (
        <div className={classes.tableWrapper}>
          <table className={classes.table} data-testid="scenarios-table">
            <thead>
              <tr>
                <th className={classes.scenarioHeader} style={{ width: "15%" }}>
                  Scenarios
                </th>
                {METRIC_COLUMNS.map((col) => (
                  <th key={col.header}>{col.header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pivoted.map(({ scenario, metrics }) => (
                <tr key={scenario}>
                  <td className={classes.scenarioCell}>
                    {formatScenarioName(scenario)}
                  </td>
                  {METRIC_COLUMNS.map((col) => {
                    const val = col.compute
                      ? col.compute(metrics)
                      : col.sourceKey != null
                        ? (metrics.get(col.sourceKey) ?? null)
                        : null;
                    return (
                      <td key={col.header}>
                        {formatValue(val)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ScenariosTable;
