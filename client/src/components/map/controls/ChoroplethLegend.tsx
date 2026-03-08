import { useMemo } from "react";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { tss } from "../../../utils/tss";
import { createColormap } from "../../../utils/colormap";

const useStyles = tss.create(({ theme }) => ({
    wrapper: {
        position: "absolute",
        top: 10,
        left: 10,
        zIndex: 1000,
        maxWidth: 240,
    },
    panel: {
        background: theme.palette.surface.overlay,
        color: theme.palette.primary.contrastText,
        padding: theme.spacing(1.5),
        borderRadius: 6,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
        maxHeight: 300,
        overflowY: "auto",
    },
    heading: {
        color: theme.palette.primary.contrastText,
        fontWeight: "bold",
        fontSize: theme.typography.body2.fontSize,
        marginBottom: theme.spacing(1),
    },
    entries: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(0.75),
    },
    entry: {
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(1.5),
    },
    swatch: {
        width: 20,
        height: 20,
        border: `1px solid ${theme.palette.muted.main}`,
        borderRadius: 3,
        flex: "0 0 20px",
    },
    label: {
        fontSize: theme.typography.subtitle1.fontSize,
        color: theme.palette.primary.contrastText,
    },
    gradientContainer: {
        display: "flex",
        alignItems: "stretch",
    },
    gradientBar: {
        width: 24,
        height: 160,
        borderRadius: 3,
        border: `1px solid ${theme.palette.muted.main}`,
        flexShrink: 0,
    },
    labelsCol: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        marginLeft: theme.spacing(1),
        height: 160,
    },
    unit: {
        fontSize: theme.typography.caption.fontSize,
        color: theme.palette.text.primary,
        textAlign: "center",
        marginTop: theme.spacing(0.75),
    },
}));

/** Categorical entry with a discrete color swatch */
export type CategoricalEntry = {
    value: number | string;
    hex: string;
};

/** Explicit gradient stop (value + color) */
export type GradientStop = {
    value: number;
    hex: string;
};

export type ChoroplethLegendData =
    | {
        mode: "colormap";
        colormap: string;
        range: { min: number; max: number };
        unit: string;
    }
    | {
        mode: "categorical";
        entries: CategoricalEntry[];
    }
    | {
        mode: "stops";
        stops: GradientStop[];
    };

export interface ChoroplethLegendProps {
    title: string;
    data: ChoroplethLegendData;
}

function formatNum(n: number): string {
    if (Math.abs(n) >= 1e6) return n.toExponential(2);
    if (Number.isInteger(n) || Math.abs(n) >= 100)
        return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
    return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

/** Scale a range + unit so large values are more readable (e.g. kg → t). */
function autoScale(
    range: { min: number; max: number },
    unit: string,
): { range: { min: number; max: number }; unit: string } {
    const absMax = Math.max(Math.abs(range.min), Math.abs(range.max));
    if (unit === "kg" && absMax >= 1000) {
        return { range: { min: range.min / 1000, max: range.max / 1000 }, unit: "t" };
    }
    return { range, unit };
}

export default function ChoroplethLegend({
    title,
    data,
}: ChoroplethLegendProps) {
    const { classes } = useStyles();

    const gradientCss = useMemo(() => {
        if (data.mode === "colormap") {
            const cmap = createColormap({
                colormap: data.colormap,
                nshades: 64,
                format: "hex",
            });
            // low index = low value (bottom), high index = high value (top)
            return `linear-gradient(to top, ${cmap.join(", ")})`;
        }
        if (data.mode === "stops" && data.stops.length >= 2) {
            // stops are ordered low→high; gradient goes bottom→top
            return `linear-gradient(to top, ${data.stops.map((s) => s.hex).join(", ")})`;
        }
        return "";
    }, [data]);

    return (
        <div
            className={classes.wrapper}
            role="region"
            aria-label="Choropleth legend"
            data-testid="choropleth-legend"
        >
            <Paper className={classes.panel}>
                <Typography variant="h6" className={classes.heading}>
                    {title}
                </Typography>

                {data.mode === "categorical" && (
                    <div className={classes.entries}>
                        {data.entries.map((entry) => (
                            <div key={entry.value} className={classes.entry}>
                                <div
                                    className={classes.swatch}
                                    style={{ backgroundColor: entry.hex }}
                                    aria-hidden="true"
                                />
                                <Typography className={classes.label}>{entry.value}</Typography>
                            </div>
                        ))}
                    </div>
                )}

                {data.mode === "colormap" && (() => {
                    const { range: scaled, unit: scaledUnit } = autoScale(data.range, data.unit);
                    return (
                        <>
                            <div className={classes.gradientContainer}>
                                <div
                                    className={classes.gradientBar}
                                    style={{ background: gradientCss }}
                                    data-testid="choropleth-gradient"
                                />
                                <div className={classes.labelsCol}>
                                    <Typography className={classes.label}>
                                        {formatNum(scaled.max)}
                                    </Typography>
                                    <Typography className={classes.label}>
                                        {formatNum((scaled.min + scaled.max) / 2)}
                                    </Typography>
                                    <Typography className={classes.label}>
                                        {formatNum(scaled.min)}
                                    </Typography>
                                </div>
                            </div>
                            {scaledUnit && (
                                <Typography className={classes.unit}>{scaledUnit}</Typography>
                            )}
                        </>
                    );
                })()}

                {data.mode === "stops" && data.stops.length >= 2 && (
                    <div className={classes.gradientContainer}>
                        <div
                            className={classes.gradientBar}
                            style={{ background: gradientCss }}
                            data-testid="choropleth-gradient"
                        />
                        <div className={classes.labelsCol}>
                            <Typography className={classes.label}>
                                {formatNum(data.stops[data.stops.length - 1].value)}
                            </Typography>
                            <Typography className={classes.label}>
                                {formatNum(
                                    (data.stops[0].value +
                                        data.stops[data.stops.length - 1].value) /
                                    2,
                                )}
                            </Typography>
                            <Typography className={classes.label}>
                                {formatNum(data.stops[0].value)}
                            </Typography>
                        </div>
                    </div>
                )}
            </Paper>
        </div>
    );
}
