import { useState } from "react";
import { useRunId } from "../../hooks/useRunId";

import { type ScenarioSummaryRow } from "../../api/scenarioApi";
import { useScenariosSummary } from "../../hooks/useScenariosSummary";

import { tss } from "../../utils/tss";
import Box from "@mui/material/Box";
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

const useStyles = tss.create(({ theme }) => ({
  statusMessage: {
    padding: theme.spacing(3),
  },
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
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing(1),
    marginBottom: theme.spacing(2),
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

function buildCsvContent(data: ScenarioSummaryRow[]): string {
  const headers = ["Scenario", ...METRIC_COLUMNS.map((c) => c.header)];
  const rows = data.map((row) => [
    row.label,
    ...METRIC_COLUMNS.map((col) => {
      const val = row[col.key];
      return val == null ? "" : String(val);
    }),
  ]);
  return [headers, ...rows]
    .map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

function downloadCsv(data: ScenarioSummaryRow[]) {
  const csv = buildCsvContent(data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "scenarios_summary.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function copyCsv(data: ScenarioSummaryRow[]) {
  const csv = buildCsvContent(data);
  navigator.clipboard.writeText(csv);
}

export function ScenariosTable() {
  const { classes } = useStyles();
  const runId = useRunId();
  const [copied, setCopied] = useState(false);

  const { data, isLoading, isError, error } = useScenariosSummary(runId);

  function handleCopy() {
    if (!data) return;
    copyCsv(data);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (isLoading) {
    return (
      <Typography align="center" className={classes.statusMessage}>
        Loading scenario data…
      </Typography>
    );
  }

  if (isError) {
    return (
      <Typography
        align="center"
        color="error"
        className={classes.statusMessage}
      >
        {error instanceof Error
          ? error.message
          : "Failed to load scenario data"}
      </Typography>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Typography align="center" className={classes.statusMessage}>
        No scenario data available.
      </Typography>
    );
  }

  return (
    <>
      <Box className={classes.titleRow}>
        <Typography variant="h4" className={classes.title}>
          Annual Averages
        </Typography>
        <Tooltip title="Download as CSV">
          <IconButton size="small" onClick={() => downloadCsv(data)}>
            <DownloadIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={copied ? "Copied!" : "Copy as CSV"}>
          <IconButton size="small" onClick={handleCopy}>
            {copied ? (
              <CheckIcon fontSize="small" />
            ) : (
              <ContentCopyIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
      </Box>
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
