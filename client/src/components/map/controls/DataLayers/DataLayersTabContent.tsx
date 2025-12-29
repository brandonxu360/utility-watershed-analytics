import React from 'react';
import { ChangeEvent } from 'react';
import { useWatershedOverlayStore, ChoroplethType } from '../../../../store/WatershedOverlayStore';
import { FaQuestionCircle } from 'react-icons/fa';
import { VegetationCover } from '../../../bottom-panels/VegetationCover';
import { ChoroplethPanel } from '../../../bottom-panels/ChoroplethPanel';
import { useBottomPanelStore } from '../../../../store/BottomPanelStore';
import { useChoropleth } from '../../../../hooks/useChoropleth';

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
        choropleth: { type: choroplethType },
        setSubcatchment,
        setLanduseLegend,
        setChoroplethType,
    } = useWatershedOverlayStore();

    const { openPanel } = useBottomPanelStore();
    const { isActive } = useChoropleth();

    const handleChoroplethClick = (type: Exclude<ChoroplethType, 'none'>) => () => {
        setSubcatchment(true);
        setChoroplethType(type);
        openPanel(<ChoroplethPanel choroplethType={type} />);
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
                        <button
                            className="layerpicker-title"
                            onClick={handleChoroplethClick('evapotranspiration')}
                            style={{ fontWeight: isActive && choroplethType === 'evapotranspiration' ? 'bold' : 'normal' }}
                        >
                            Evapotranspiration
                        </button>
                    </div>
                    <div className="layerpicker-layer">
                        <button
                            className="layerpicker-title"
                            onClick={handleChoroplethClick('soilMoisture')}
                            style={{ fontWeight: isActive && choroplethType === 'soilMoisture' ? 'bold' : 'normal' }}
                        >
                            Soil Moisture
                        </button>
                    </div>
                </>
            )}
            {activeTab === 'Coverage' && (
                <>
                    <div className="layerpicker-layer">
                        <button className="layerpicker-title" onClick={
                            () => {
                                setSubcatchment(true);
                                setChoroplethType('vegetationCover');
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
