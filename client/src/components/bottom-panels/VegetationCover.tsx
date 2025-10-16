import React, { useEffect, useRef, useState } from "react";
import { FaXmark, FaChevronDown } from "react-icons/fa6";
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

    const startYear = 1986;
    const endYear = 2024;

    const years = Array.from(
        { length: endYear - startYear + 1 },
        (_, i) => startYear + i
    );

    const [year, setYear] = useState<string>(String(endYear));
    const [menuOpen, setMenuOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        function onDocClick(e: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    return (
        <div>
            <div className="titleBar">
                <div className="vegCoverSelector">
                    <div className="option-align">
                        <label htmlFor="veg-cover-title">Vegetation Cover:</label>
                        <select
                            id="veg-cover-title"
                            value={option}
                            onChange={(e) => setOption(e.target.value as 'shrub' | 'tree')}
                        >
                            <option value="shrub">shrub</option>
                            <option value="tree">tree</option>
                        </select>
                    </div>
                </div>

                <div className='dateSelector'>
                    <div className="option-align">
                        <label htmlFor="veg-year">Select Year:</label>
                        {/* custom year dropdown */}
                        <div className="year-select-wrapper" ref={wrapperRef}>
                            <button
                                type="button"
                                className="year-button"
                                aria-haspopup="listbox"
                                aria-expanded={menuOpen}
                                onClick={() => setMenuOpen((s) => !s)}
                            >
                                {year}
                                <FaChevronDown style={{ fontSize: '0.75rem' }} />
                            </button>

                            {menuOpen && (
                                <div role="listbox" className="year-menu" tabIndex={-1}>
                                    {years.slice().reverse().map((y) => (
                                        <div
                                            key={y}
                                            role="option"
                                            className="year-item"
                                            onClick={() => {
                                                setYear(String(y));
                                                setMenuOpen(false);
                                            }}
                                        >
                                            {y}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <FaXmark className='vegCloseButton' onClick={() => closePanel()} />
                </div>
            </div>

            {/* Simple for now as there are only 2 sets of data but will rework as more data is added */}
            <CoverageBarChart
                data={option === 'shrub' ? shrubData : treeData}
                title={option === 'shrub' ? `Shrub Coverage (${year})` : `Tree Coverage (${year})`}
                barKeys={[
                    { key: 'coverage', color: '#8884d8', activeFill: 'pink', activeStroke: 'blue' },
                    { key: 'density', color: '#82ca9d', activeFill: 'gold', activeStroke: 'purple' }
                ]}
            />
        </div>
    );
};

export default VegetationCover;
