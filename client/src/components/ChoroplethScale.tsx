import React, { useMemo } from "react";
import { tss } from "../utils/tss";
import { createColormap } from "../utils/colormap";

type ChoroplethScaleProps = {
    colormap: string;
    range: { min: number; max: number };
    unit: string;
    style?: React.CSSProperties;
};

const useStyles = tss.create(({ theme }) => ({
    legend: {
        // Container styles can be overridden via style prop
    },
    gradient: {
        height: '20px',
        borderRadius: '4px',
        margin: `${theme.spacing(2)} 0`,
    },
    labels: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: theme.typography.caption.fontSize,
    },
    unit: {
        textAlign: 'center',
        fontSize: theme.typography.caption.fontSize,
        marginTop: theme.spacing(1),
        color: theme.palette.muted.main,
    },
}));

const formatValue = (value: number): string => {
    if (Math.abs(value) >= 1000) {
        return value.toFixed(0);
    } else if (Math.abs(value) >= 100) {
        return value.toFixed(1);
    } else if (Math.abs(value) >= 10) {
        return value.toFixed(2);
    }
    return value.toFixed(3);
};

export const ChoroplethScale: React.FC<ChoroplethScaleProps> = ({
    colormap,
    range,
    unit,
    style,
}) => {
    const { classes } = useStyles();

    const gradientStyle = useMemo(() => {
        const cmap = createColormap({ colormap, nshades: 64, format: 'hex' });
        const stops = Array.from({ length: cmap.length }, (_, i) => {
            const percent = (i / (cmap.length - 1)) * 100;
            return `${cmap[i]} ${percent.toFixed(1)}%`;
        }).join(', ');

        return {
            background: `linear-gradient(to right, ${stops})`,
        };
    }, [colormap]);

    return (
        <div className={classes.legend} style={style} data-testid="choropleth-legend">
            <div className={classes.gradient} style={gradientStyle} data-testid="choropleth-gradient" />
            <div className={classes.labels} data-testid="choropleth-labels">
                <span>{formatValue(range.min)}</span>
                <span>{formatValue((range.min + range.max) / 2)}</span>
                <span>{formatValue(range.max)}</span>
            </div>
            <div className={classes.unit} data-testid="choropleth-unit">
                {unit}
            </div>
        </div>
    );
};

export default ChoroplethScale;
