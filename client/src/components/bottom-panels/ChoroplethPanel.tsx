// TODO: Placeholder file to be deleted for separate evapotranspiration and soil moisture panels

import React from "react";
import { FaXmark } from "react-icons/fa6";
import { useBottomPanelStore } from "../../store/BottomPanelStore";
import { useWatershedOverlayStore, ChoroplethType } from "../../store/WatershedOverlayStore";
import { useChoropleth, CHOROPLETH_YEARS } from "../../hooks/useChoropleth";
import { ChoroplethScale } from "../ChoroplethScale";
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

                {!choroplethLoading && !choroplethError && choroplethRange && (
                    <ChoroplethScale
                        colormap={config.colormap}
                        range={choroplethRange}
                        unit={config.unit}
                    />
                )}
            </div>
        </div>
    );
};

export default ChoroplethPanel;
