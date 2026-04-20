import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRunId } from "../../hooks/useRunId";
import {
  type ScenarioSummaryRow,
  scenariosSummaryOptions,
} from "../../api/scenarioApi";
import { tss } from "../../utils/tss";
import { copyCsv, downloadCsv } from "../../utils/download";
import IconButton from "@mui/material/IconButton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import CheckIcon from "@mui/icons-material/Check";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DownloadIcon from "@mui/icons-material/Download";
import PanelStatus from "../PanelStatus";

const useStyles = tss.create(({ theme }) => ({
  headerCell: {
    fontWeight: 600,
  },
  lastRow: {
    "&:last-child td, &:last-child th": {
      border: 0,
    },
  },
  scenarioCell: {
    fontWeight: 600,
  },
  titleRow: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing(2),
  },
  titleActions: {
    position: "absolute",
    right: 0,
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(0.5),
  },
  title: {
    fontWeight: "bold",
  },
}));

type MetricKey = {
  [K in keyof ScenarioSummaryRow]: ScenarioSummaryRow[K] extends number | null
    ? K
    : never;
}[keyof ScenarioSummaryRow];

type MetricColumn = {
  header: string;
  key: MetricKey;
};

const METRIC_COLUMNS: MetricColumn[] = [
  {
    header: "Water discharge from outlet (mm)",
    key: "waterDischarge",
  },
  {
    header: "Hillslope soil loss (t/ha)",
    key: "hillslopeSoilLoss",
  },
  {
    header: "Channel soil loss (t/ha)",
    key: "channelSoilLoss",
  },
  {
    header: "Sediment discharge from outlet (t/ha)",
    key: "sedimentDischarge",
  },
  {
    header: "Hillslope soil loss (t/yr)",
    key: "hillslopeSoilLossTonnesPerYear",
  },
  {
    header: "Channel soil loss (t/yr)",
    key: "channelSoilLossTonnesPerYear",
  },
  {
    header: "Sediment discharge from outlet (t/yr)",
    key: "sedimentDischargeTonnesPerYear",
  },
];

function formatValue(val: number | null): string {
  if (val == null) return "—";
  if (val === 0) return "0";
  return val.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
}

function scenarioCsvHeaders(): string[] {
  return ["Scenario", ...METRIC_COLUMNS.map((c) => c.header)];
}

function scenarioCsvRows(
  data: ScenarioSummaryRow[],
): (string | number | null)[][] {
  return data.map((row) => [
    row.label,
    ...METRIC_COLUMNS.map((col) => row[col.key]),
  ]);
}

export function ScenariosTable() {
  const { classes } = useStyles();
  const runId = useRunId();
  const watershedName = (runId ?? "watershed")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "_");
  const [copied, setCopied] = useState(false);

  const { data, isLoading, isError, error } = useQuery(
    scenariosSummaryOptions(runId),
  );

  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) clearTimeout(copyTimerRef.current);
    };
  }, []);

  function handleCopy() {
    if (!data) return;
    copyCsv(scenarioCsvHeaders(), scenarioCsvRows(data));
    setCopied(true);
    if (copyTimerRef.current !== null) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(false), 1500);
  }

  if (isLoading)
    return <PanelStatus status="loading" message="Loading scenario data…" />;
  if (isError)
    return (
      <PanelStatus status="error" message={error ? error.message : undefined} />
    );
  if (!data || data.length === 0)
    return (
      <PanelStatus
        status="empty"
        message="No scenario data for this watershed."
      />
    );

  return (
    <>
      <div className={classes.titleRow}>
        <Typography variant="h4" className={classes.title}>
          Annual Averages
        </Typography>
        <div className={classes.titleActions}>
          <Tooltip title="Download as CSV">
            <IconButton
              size="small"
              aria-label="Download as CSV"
              onClick={() =>
                downloadCsv(
                  `${watershedName}_scenarios_summary.csv`,
                  scenarioCsvHeaders(),
                  scenarioCsvRows(data),
                )
              }
            >
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={copied ? "Copied!" : "Copy as CSV"}>
            <IconButton
              size="small"
              aria-label={copied ? "Copied!" : "Copy as CSV"}
              onClick={handleCopy}
            >
              {copied ? (
                <CheckIcon fontSize="small" />
              ) : (
                <ContentCopyIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        </div>
      </div>
      <TableContainer>
        <Table
          size="small"
          aria-label="watershed scenarios"
          data-testid="scenarios-table"
        >
          <TableHead>
            <TableRow>
              <TableCell className={classes.headerCell}>Scenario</TableCell>
              {METRIC_COLUMNS.map((col) => (
                <TableCell
                  key={col.key}
                  align="center"
                  className={classes.headerCell}
                >
                  {col.header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row: ScenarioSummaryRow) => (
              <TableRow key={row.scenario} hover className={classes.lastRow}>
                <TableCell
                  component="th"
                  scope="row"
                  className={classes.scenarioCell}
                >
                  {row.label}
                </TableCell>
                {METRIC_COLUMNS.map((col) => (
                  <TableCell key={col.key} align="center">
                    {formatValue(row[col.key])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}

export default ScenariosTable;
