import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import {
  fetchScenariosSummary,
  type ScenarioSummaryRow,
} from "../../api/scenarioApi";
import { tss } from "../../utils/tss";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

const useStyles = tss.create(({ theme }) => ({
  statusMessage: {
    padding: theme.spacing(3),
  },
  title: {
    fontWeight: 600,
    padding: `${theme.spacing(1)} ${theme.spacing(3)} 0 ${theme.spacing(3)}`,
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
}));

/** Keys of ScenarioSummaryRow that hold numeric metric values. */
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
  { header: "Total contributing area to outlet (ha)", key: "totalArea" },
  {
    header: "Avg. Ann. water discharge from outlet (mm)",
    key: "waterDischarge",
  },
  {
    header: "Avg. Ann. total hillslope soil loss (tonnes)",
    key: "hillslopeSoilLoss",
  },
  {
    header: "Avg. Ann. total channel soil loss (tonnes)",
    key: "channelSoilLoss",
  },
  {
    header: "Avg. Ann. sediment discharge from outlet (tonnes)",
    key: "sedimentDischarge",
  },
];

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

export function ScenariosTable() {
  const { classes } = useStyles();
  const runId =
    useParams({
      from: "/watershed/$webcloudRunId",
      select: (params) => params?.webcloudRunId,
      shouldThrow: false,
    }) ?? null;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["scenariosSummary", runId],
    queryFn: () => fetchScenariosSummary(runId!),
    enabled: !!runId,
    staleTime: 5 * 60_000,
    retry: 1,
  });

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
                align="right"
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
                <TableCell key={col.key} align="right">
                  {formatValue(row[col.key])}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default ScenariosTable;
