import React, { useMemo } from "react";
import { FaXmark } from "react-icons/fa6";
import { useBottomPanelStore } from "../../store/BottomPanelStore";
import { useWatershedOverlayStore, ChoroplethType } from "../../store/WatershedOverlayStore";
import { useChoropleth, CHOROPLETH_YEARS } from "../../hooks/useChoropleth";
import { createColormap } from "../../utils/colormap";
import Select from "../select/Select";
import "./BottomPanel.css";

type ChoroplethPanelProps = {
    choroplethType: Exclude<ChoroplethType, 'none'>;
};

export const ChoroplethPanel: React.FC<ChoroplethPanelProps> = ({ choroplethType }) => {
    const { closePanel } = useBottomPanelStore();
    const {
        choropleth: { range: choroplethRange, loading: choroplethLoading, error: choroplethError, year: choroplethYear },
        setChoroplethYear,
        setSubcatchment,
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
        setSubcatchment(false);
        closePanel();
    };

    const years = ['All', ...CHOROPLETH_YEARS.slice().reverse().map(String)];

    const handleYearChange = (value: string) => {
        setChoroplethYear(value === 'All' ? null : Number(value));
    };

    if (!config) {
        return null;
    }

    return (
        <div>
            <div className="titleBar">
                <div className="vegCoverSelector">
                    <h3 style={{ margin: 0, fontSize: '1rem' }}>{config.title}</h3>
                </div>

                <div className="dateSelector">
                    <div className="option-align">
                        <label htmlFor={`choropleth-year-${choroplethType}`}>Select Year:</label>
                        <Select
                            id={`choropleth-year-${choroplethType}`}
                            value={choroplethYear === null ? 'All' : String(choroplethYear)}
                            onChange={handleYearChange}
                            options={years}
                            ariaLabel="Select year"
                        />
                    </div>
                    <FaXmark className="vegCloseButton" onClick={handleClose} />
                </div>
            </div>

            <div className="choropleth-panel-content">
                {choroplethLoading && (
                    <div style={{ textAlign: 'center', padding: '1rem' }}>Loading data...</div>
                )}

                {choroplethError && (
                    <div style={{ textAlign: 'center', padding: '1rem', color: '#d32f2f' }}>
                        {choroplethError}
                    </div>
                )}

                {!choroplethLoading && !choroplethError && (
                    <div className="choropleth-panel-legend">
                        <div
                            className="choropleth-panel-gradient"
                            style={{
                                ...gradientStyle,
                                height: '20px',
                                borderRadius: '4px',
                                margin: '0.5rem 0',
                            }}
                        />

                        {choroplethRange && (
                            <div className="choropleth-panel-labels" style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '0.75rem',
                            }}>
                                <span>{formatValue(choroplethRange.min)}</span>
                                <span>{formatValue((choroplethRange.min + choroplethRange.max) / 2)}</span>
                                <span>{formatValue(choroplethRange.max)}</span>
                            </div>
                        )}

                        <div style={{ textAlign: 'center', fontSize: '0.75rem', marginTop: '0.25rem', color: '#666' }}>
                            {config.unit}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChoroplethPanel;
