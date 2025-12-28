import React from 'react';
import { ChangeEvent } from 'react';
import { useWatershedOverlayStore } from '../../../../store/WatershedOverlayStore';
import { FaQuestionCircle } from 'react-icons/fa';
import { VegetationCover } from '../../../bottom-panels/VegetationCover';
import { useBottomPanelStore } from '../../../../store/BottomPanelStore';

type DataLayersTabContentProps = {
    activeTab: string;
    handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
};

const DataLayersTabContent: React.FC<DataLayersTabContentProps> = ({
    activeTab,
    handleChange,
}) => {
    const {
        subcatchment,
        channels,
        landuse,
        choropleth,
        setSubcatchment,
        setLanduseLegend,
        setChoropleth,
    } = useWatershedOverlayStore();

    const { openPanel } = useBottomPanelStore();

    const handleEvapotranspirationChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { checked } = e.target;
        if (checked) {
            setSubcatchment(true);
            setChoropleth('evapotranspiration');
        } else {
            setChoropleth('none');
        }
    };

    const handleSoilMoistureChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { checked } = e.target;
        if (checked) {
            setSubcatchment(true);
            setChoropleth('soilMoisture');
        } else {
            setChoropleth('none');
        }
    };

    return (
        <div className="layerpicker-layers" id="layerpicker-layers">
            {activeTab === 'Hill Slopes' && (
                <>
                    <div className="layerpicker-layer">
                        <button className="layerpicker-title">Subcatchments</button>
                        <input
                            type="checkbox"
                            id="subcatchment"
                            checked={subcatchment}
                            onChange={handleChange}
                            disabled={landuse && subcatchment}
                        />
                    </div>
                    <div className="layerpicker-layer">
                        <button className="layerpicker-title">Channels</button>
                        <input
                            type="checkbox"
                            id="channels"
                            checked={channels}
                            onChange={handleChange}
                        />
                    </div>
                </>
            )}
            {activeTab === 'Surface Data' && (
                <>
                    <div className="layerpicker-layer">
                        <button className="layerpicker-title">Land Use</button>
                        {landuse && <span
                            className="layerpicker-help-icon"
                            title="Land Use Legend"
                            onClick={() => { setLanduseLegend(true); }}
                        >
                            <FaQuestionCircle />
                        </span>}
                        <input
                            type="checkbox"
                            id="landuse"
                            checked={landuse}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="layerpicker-layer">
                        <button className="layerpicker-title">Evapotranspiration</button>
                        <input
                            type="checkbox"
                            id="evapotranspiration"
                            checked={choropleth === 'evapotranspiration'}
                            onChange={handleEvapotranspirationChange}
                        />
                    </div>
                    <div className="layerpicker-layer">
                        <button className="layerpicker-title">Soil Moisture</button>
                        <input
                            type="checkbox"
                            id="soilMoisture"
                            checked={choropleth === 'soilMoisture'}
                            onChange={handleSoilMoistureChange}
                        />
                    </div>
                </>
            )}
            {activeTab === 'Coverage' && (
                <>
                    <div className="layerpicker-layer">
                        <button className="layerpicker-title" onClick={
                            () => {
                                setSubcatchment(true);
                                openPanel(<VegetationCover />);
                            }
                        }>
                            Vegetation Cover
                        </button>
                    </div>
                </>
            )}
            {activeTab === 'Soil Burn' && (
                <>
                    <div className="layerpicker-layer">
                        <button className="layerpicker-title">Fire Severity</button>
                        <input
                            type="checkbox"
                            id="fireSeverity"
                            // checked={fireSeverity}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="layerpicker-layer">
                        <button className="layerpicker-title">Soil Burn Severity</button>
                        <input
                            type="checkbox"
                            id="soilBurnSeverity"
                            // checked={soilBurnSeverity}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="layerpicker-layer">
                        <button className="layerpicker-title">Predict</button>
                    </div>
                </>
            )}
        </div>
    );
};

export default DataLayersTabContent;
