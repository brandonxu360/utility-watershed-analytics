import React from "react";
import CoverageBarChart from "../coverage-bar-chart/CoverageBarChart";

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

type VegetationCoverProps = {
    option: 'shrub' | 'tree';
};

export const VegetationCover: React.FC<VegetationCoverProps> = ({ option }: { option: 'shrub' | 'tree' }) => {
    return (
        <div>
            <div className='dateSelector right-align'>
                <label htmlFor="veg-year">Select Year Range:</label>
                <select id="veg-year">
                    <option value="2024-2025">2024-2025</option>
                    <option value="2023-2024">2023-2024</option>
                    <option value="2022-2023">2022-2023</option>
                </select>
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