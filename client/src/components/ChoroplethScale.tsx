import React, { useMemo } from "react";
import { createColormap } from "../utils/colormap";

type ChoroplethScaleProps = {
    colormap: string;
    range: { min: number; max: number };
    unit: string;
    style?: React.CSSProperties;
};

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
        <div className="choropleth-panel-legend" style={style}>
            <div
                className="choropleth-panel-gradient"
                style={{
                    ...gradientStyle,
                    height: '20px',
                    borderRadius: '4px',
                    margin: '0.5rem 0',
                }}
            />
            <div className="choropleth-panel-labels" style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
            }}>
                <span>{formatValue(range.min)}</span>
                <span>{formatValue((range.min + range.max) / 2)}</span>
                <span>{formatValue(range.max)}</span>
            </div>
            <div style={{ textAlign: 'center', fontSize: '0.75rem', marginTop: '0.25rem', color: '#666' }}>
                {unit}
            </div>
        </div>
    );
};

export default ChoroplethScale;
