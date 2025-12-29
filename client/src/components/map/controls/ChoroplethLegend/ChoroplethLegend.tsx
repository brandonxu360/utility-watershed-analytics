import React, { useMemo } from 'react';
import { FaXmark } from 'react-icons/fa6';
import { useWatershedOverlayStore } from '../../../../store/WatershedOverlayStore';
import { createColormap } from '../../../../utils/colormap';
import { useChoropleth, CHOROPLETH_YEARS } from '../../../../hooks/useChoropleth';
import './ChoroplethLegend.css';

const ChoroplethLegend: React.FC = () => {
    const {
        choropleth: {
            type: choroplethType,
            range: choroplethRange,
            loading: choroplethLoading,
            error: choroplethError,
            year: choroplethYear,
        },
        setChoroplethYear,
        resetChoropleth,
    } = useWatershedOverlayStore();

    const { config } = useChoropleth();

    const gradientStyle = useMemo(() => {
        if (!config) return {};

        const cmap = createColormap({ colormap: config.colormap, nshades: 64, format: 'hex' });
        const stops = Array.from({ length: cmap.length }, (_, i) => {
            const percent = (i / (cmap.length - 1)) * 100;
            return `${cmap[i]} ${percent.toFixed(1)}%`;
        }).join(', ');

        return {
            background: `linear-gradient(to right, ${stops})`,
        };
    }, [config]);

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

    const handleClose = () => {
        resetChoropleth();
    };

    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setChoroplethYear(value === 'all' ? null : Number(value));
    };

    if (choroplethType === 'none' || !config) {
        return null;
    }

    return (
        <div className="choropleth-legend">
            <div className="choropleth-legend-header">
                <h4 className="choropleth-legend-title">{config.title}</h4>
                <button
                    className="choropleth-legend-close"
                    onClick={handleClose}
                    title="Close legend"
                    aria-label="Close choropleth legend"
                >
                    <FaXmark />
                </button>
            </div>

            {choroplethLoading && (
                <div className="choropleth-legend-loading">Loading data...</div>
            )}

            {choroplethError && (
                <div className="choropleth-legend-error">{choroplethError}</div>
            )}

            {!choroplethLoading && !choroplethError && (
                <>
                    <div className="choropleth-legend-gradient" style={gradientStyle} />

                    {choroplethRange && (
                        <div className="choropleth-legend-labels">
                            <span className="choropleth-legend-label">
                                {formatValue(choroplethRange.min)}
                            </span>
                            <span className="choropleth-legend-label">
                                {formatValue((choroplethRange.min + choroplethRange.max) / 2)}
                            </span>
                            <span className="choropleth-legend-label">
                                {formatValue(choroplethRange.max)}
                            </span>
                        </div>
                    )}

                    <div className="choropleth-legend-unit">{config.unit}</div>
                </>
            )}

            <div className="choropleth-legend-year-selector">
                <label htmlFor="choropleth-year">Year:</label>
                <select
                    id="choropleth-year"
                    value={choroplethYear === null ? 'all' : choroplethYear}
                    onChange={handleYearChange}
                >
                    <option value="all">All Years (Average)</option>
                    {CHOROPLETH_YEARS.slice().reverse().map((year) => (
                        <option key={year} value={year}>
                            {year}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default ChoroplethLegend;
