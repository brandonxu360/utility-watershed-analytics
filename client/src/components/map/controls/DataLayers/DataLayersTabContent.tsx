import React from 'react';
import { ChangeEvent } from 'react';
import { FaQuestionCircle } from 'react-icons/fa';
import { VegetationCover } from '../../../bottom-panels/VegetationCover';
import { useAppStore } from '../../../../store/store';

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
        setLanduseLegendVisible,
        openPanel,
    } = useAppStore();

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
                            onClick={() => { setLanduseLegendVisible(true); }}
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
                        <button className="layerpicker-title">Evapotransportation</button>
                    </div>
                    <div className="layerpicker-layer">
                        <button className="layerpicker-title">Soil Moisture</button>
                    </div>
                </>
            )}
            {activeTab === 'Coverage' && (
                <>
                    <div className="layerpicker-layer">
                        <button className="layerpicker-title" onClick={
                            () => {
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
