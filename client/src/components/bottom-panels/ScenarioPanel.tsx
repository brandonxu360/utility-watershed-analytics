import React from "react";
import { tss } from "../../utils/tss";
import { Paper, Typography, IconButton } from "@mui/material";
import { useWatershed } from "../../contexts/WatershedContext";
import { useScenarioData } from "../../hooks/useScenarioData";
import { formatScenarioLabel } from "../../layers/scenario";
import { ChoroplethScale } from "../ChoroplethScale";
import CloseIcon from "@mui/icons-material/Close";

const useStyles = tss.create(({ theme }) => ({
    root: {
        display: "flex",
        flexDirection: "column",
        height: "100%",
        padding: theme.spacing(2),
        boxSizing: "border-box",
        background: theme.palette.surface.light,
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: theme.spacing(1),
    },
    title: {
        fontWeight: 600,
        color: theme.palette.primary.dark,
    },
    closeButton: {
        color: theme.palette.primary.dark,
    },
    scaleContainer: {
        maxWidth: 300,
    },
    loading: {
        color: theme.palette.muted.main,
        fontStyle: "italic",
    },
}));

export const ScenarioPanel: React.FC = () => {
    const { classes } = useStyles();
    const { dispatchLayerAction } = useWatershed();
    const { selectedScenario, variableConfig, range, isLoading, hasData } =
        useScenarioData();

    if (!selectedScenario) return null;

    const title = `${formatScenarioLabel(selectedScenario)} - ${variableConfig.label}`;

    return (
        <Paper className={classes.root} elevation={0} square>
            <div className={classes.header}>
                <Typography variant="subtitle1" className={classes.title}>
                    {title}
                </Typography>
                <IconButton
                    size="small"
                    onClick={() =>
                        dispatchLayerAction({ type: "TOGGLE", id: "scenario", on: false })
                    }
                    className={classes.closeButton}
                    aria-label="Close scenario panel"
                >
                    <CloseIcon fontSize="small" />
                </IconButton>
            </div>

            {isLoading && (
                <Typography className={classes.loading}>Loading data...</Typography>
            )}

            {hasData && range && (
                <div className={classes.scaleContainer}>
                    <ChoroplethScale
                        colormap={variableConfig.colormap}
                        range={range}
                        unit={variableConfig.unit}
                    />
                </div>
            )}
        </Paper>
    );
};

export default ScenarioPanel;
