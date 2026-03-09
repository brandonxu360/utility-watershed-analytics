import React, { useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import MuiSelect, { type SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { tss } from "../../utils/tss";
import { useWatershed } from "../../contexts/WatershedContext";
import { getLayerParams } from "../../layers/types";
import {
  fetchRhessysTimeSeries,
  GATE_CREEK_SCENARIOS,
  GATE_CREEK_VARIABLES,
} from "../../api/rhessysOutputsApi";
import { CoverageLineChart } from "../CoverageLineChart";

type VariableMeta = { id: string; label: string; units: string };

const LINE_KEYS = [
  {
    key: "value",
    color: "#2196F3",
    activeFill: "#1976D2",
    activeStroke: "#0D47A1",
  },
];

const useStyles = tss.create(({ theme }) => ({
  titleBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    margin: `${theme.spacing(2)} ${theme.spacing(3)}`,
  },
  controls: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(2),
  },
  optionAlign: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
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
}));

export const RhessysTimeSeries: React.FC = () => {
  const { classes } = useStyles();
  const { dispatchLayerAction, layerDesired, enableLayerWithParams } =
    useWatershed();

  const runId =
    useParams({
      from: "/watershed/$webcloudRunId",
      select: (params) => params?.webcloudRunId,
      shouldThrow: false,
    }) ?? null;
  const params = getLayerParams(layerDesired, "rhessysOutputs");

  const spatialScale = params.spatialScale ?? "hillslope";
  const effectiveScenario = params.scenario || GATE_CREEK_SCENARIOS[0].id;

  const availableVariables: readonly VariableMeta[] =
    GATE_CREEK_VARIABLES[spatialScale];

  const effectiveVariable = useMemo(() => {
    if (
      params.variable &&
      availableVariables.some((v) => v.id === params.variable)
    ) {
      return params.variable;
    }
    return availableVariables[0].id;
  }, [params.variable, availableVariables]);

  const varMeta = availableVariables.find((v) => v.id === effectiveVariable);
  const isYearly = spatialScale === "patch";

  const { data: rawData, isLoading } = useQuery({
    queryKey: [
      "rhessys-timeseries",
      runId,
      effectiveScenario,
      effectiveVariable,
      spatialScale,
    ],
    queryFn: () =>
      fetchRhessysTimeSeries({
        runId: runId!,
        scenario: effectiveScenario,
        variables: [effectiveVariable],
        spatialScale,
      }),
    enabled: !!runId,
    staleTime: 1000 * 60 * 10,
  });

  const chartData = useMemo(() => {
    if (!rawData?.length) return [];
    return rawData.map((row) => ({
      name: isYearly
        ? String(row.year)
        : `${row.year}-${String(row.month).padStart(2, "0")}`,
      value: row[effectiveVariable] ?? 0,
    }));
  }, [rawData, effectiveVariable, isYearly]);

  const handleVariableChange = useCallback(
    (e: SelectChangeEvent) => {
      enableLayerWithParams("rhessysOutputs", {
        scenario: params.scenario,
        variable: e.target.value,
        spatialScale: params.spatialScale,
        year: params.year,
        mode: params.mode,
      });
    },
    [enableLayerWithParams, params],
  );

  const handleScenarioChange = useCallback(
    (e: SelectChangeEvent) => {
      enableLayerWithParams("rhessysOutputs", {
        scenario: e.target.value,
        variable: params.variable,
        spatialScale: params.spatialScale,
        year: params.year,
        mode: params.mode,
      });
    },
    [enableLayerWithParams, params],
  );

  const handleClose = useCallback(() => {
    dispatchLayerAction({
      type: "TOGGLE",
      id: "rhessysOutputs",
      on: false,
    });
  }, [dispatchLayerAction]);

  const scaleLabel = isYearly ? "yearly avg" : "monthly avg";
  const title = `${varMeta?.label ?? effectiveVariable} (${varMeta?.units ?? ""}, ${scaleLabel}) \u2013 ${effectiveScenario}`;

  return (
    <div>
      <div className={classes.titleBar}>
        <div className={classes.controls}>
          <div className={classes.optionAlign}>
            <Typography className={classes.optionAlignLabel}>
              Scenario:
            </Typography>
            <MuiSelect
              value={effectiveScenario}
              onChange={handleScenarioChange}
              size="small"
              className={classes.select}
              MenuProps={{ style: { zIndex: 20000 } }}
            >
              {GATE_CREEK_SCENARIOS.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.label}
                </MenuItem>
              ))}
            </MuiSelect>
          </div>
          <div className={classes.optionAlign}>
            <Typography className={classes.optionAlignLabel}>
              Variable:
            </Typography>
            <MuiSelect
              value={effectiveVariable}
              onChange={handleVariableChange}
              size="small"
              className={classes.select}
              MenuProps={{ style: { zIndex: 20000 } }}
            >
              {availableVariables.map((v) => (
                <MenuItem key={v.id} value={v.id}>
                  {v.label}
                </MenuItem>
              ))}
            </MuiSelect>
          </div>
        </div>
        <IconButton className={classes.closeButton} onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </div>

      {isLoading && (
        <Typography align="center">Loading time series data...</Typography>
      )}

      <CoverageLineChart
        data={chartData}
        title={title}
        lineKeys={LINE_KEYS}
      />
    </div>
  );
};

export default RhessysTimeSeries;
