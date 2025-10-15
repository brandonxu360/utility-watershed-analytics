import React, { useState } from "react";
import { FaXmark } from "react-icons/fa6";
import { useBottomPanelStore } from "../../store/BottomPanelStore";
import CoverageBarChart from "../coverage-bar-chart/CoverageBarChart";
import './BottomPanel.css';

const shrubData = [
    { name: 'Zone 1', coverage: 120, density: 80 },
    { name: 'Zone 2', coverage: 98, density: 65 },
    { name: 'Zone 3', coverage: 86, density: 70 },
];

const treeData = [
    { name: 'Zone 1', coverage: 150, density: 90 },
    { name: 'Zone 2', coverage: 130, density: 85 },
    { name: 'Zone 3', coverage: 110, density: 75 },
];

export const VegetationCover: React.FC = () => {
    const { closePanel } = useBottomPanelStore();

    const [option, setOption] = useState<'shrub' | 'tree'>('shrub');

    return (
        <div>
            <div className="titleBar">
                <div className="vegCoverSelector">
                    <div className="option-align">
                        <label htmlFor="veg-cover-title">Vegetation Cover:</label>
                        <select id="veg-cover-title" value={option} onChange={(e) => setOption(e.target.value as 'shrub' | 'tree')}>
                            <option value="shrub">shrub</option>
                            <option value="tree">tree</option>
                        </select>
                    </div>
                </div>
                <div className='dateSelector'>
                    <div className="option-align">
                        <label htmlFor="veg-year">Select Year Range:</label>
                        <select id="veg-year">
                            <option value="2024-2025">2024-2025</option>
                            <option value="2023-2024">2023-2024</option>
                            <option value="2022-2023">2022-2023</option>
                        </select>
                    </div>
                    <FaXmark className='vegCloseButton' onClick={() => {
                        closePanel();
                    }} />
                </div>
            </div>
            {/* Simple for now as there are only 2 sets of data but will rework as more data is added */}
            <CoverageBarChart
                data={option === 'shrub' ? shrubData : treeData}
                title={option === 'shrub' ? 'Shrub Coverage' : 'Tree Coverage'}
                barKeys={[
                    { key: 'coverage', color: '#8884d8', activeFill: 'pink', activeStroke: 'blue' },
                    { key: 'density', color: '#82ca9d', activeFill: 'gold', activeStroke: 'purple' }
                ]}
            />
        </div>
    )
};