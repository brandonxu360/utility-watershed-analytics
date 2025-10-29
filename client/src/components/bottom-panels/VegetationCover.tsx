import React, { useMemo, useState } from "react";
import { FaXmark } from "react-icons/fa6";
import { useBottomPanelStore } from "../../store/BottomPanelStore";
import CoverageBarChart from "../coverage-bar-chart/CoverageBarChart";
import Select from "../select/Select";
import "./BottomPanel.css";

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
    const { closePanel, selectedHillslopeId, selectedHillslopeProps } = useBottomPanelStore();

    const [option, setOption] = useState<"All" | "Shrub" | "Tree">("All");

    const startYear = 1986;
    const endYear = 2024;

    const years = Array.from(
        { length: endYear - startYear + 1 },
        (_, i) => String(startYear + i)
    );

    const [year, setYear] = useState<string>(String(endYear));

    const getMergedData = () => {
        const map = new Map<string, { name: string; coverage: number; density: number }>();

        const add = (d: { name: string; coverage: number; density: number }) => {
            const existing = map.get(d.name);
            if (existing) {
                existing.coverage += d.coverage;
                existing.density += d.density;
            } else {
                map.set(d.name, { ...d });
            }
        };

        shrubData.forEach(add);
        treeData.forEach(add);

        return Array.from(map.values());
    };

    const singleHillslopeData = useMemo(() => {
        if (!selectedHillslopeId || !selectedHillslopeProps) return null;
        // const props = selectedHillslopeProps;
        const tree = 0;
        const shrub = 0;
        const density = 0;

        const name = `Hillslope ${selectedHillslopeId}`;

        if (option === "Shrub") {
            return [{ name, coverage: shrub, density }];
        }
        if (option === "Tree") {
            return [{ name, coverage: tree, density }];
        }

        return [{ name, coverage: tree + shrub, density }];
    }, [selectedHillslopeId, selectedHillslopeProps, option]);

    const chartData = singleHillslopeData ?? (option === "Shrub" ? shrubData : option === "Tree" ? treeData : getMergedData());

    const chartTitle = selectedHillslopeId
        ? `${option} Coverage - Hillslope ${selectedHillslopeId} (${year})`
        : option === "Shrub"
            ? `Shrub Coverage (${year})`
            : option === "Tree"
                ? `Tree Coverage (${year})`
                : `All Coverage (${year})`;

    return (
        <div>
            <div className="titleBar">
                <div className="vegCoverSelector">
                    <div className="option-align">
                        <label htmlFor="veg-cover-title">Vegetation Cover:</label>
                        <Select
                            id="veg-cover-title"
                            value={option}
                            onChange={(v) => setOption(v as "All" | "Shrub" | "Tree")}
                            options={["All", "Shrub", "Tree"]}
                            ariaLabel="Select vegetation type"
                        />
                    </div>
                </div>

                <div className="dateSelector">
                    <div className="option-align">
                        <label htmlFor="veg-year">Select Year:</label>
                        <Select
                            id="veg-year"
                            value={year}
                            onChange={(v) => setYear(v)}
                            options={years.slice().reverse()}
                            ariaLabel="Select vegetation year"
                        />
                    </div>
                    <FaXmark className="vegCloseButton" onClick={() => closePanel()} />
                </div>
            </div>

            <CoverageBarChart
                data={chartData}
                title={chartTitle}
                barKeys={[
                    { key: "coverage", color: "#8884d8", activeFill: "pink", activeStroke: "blue" },
                    { key: "density", color: "#82ca9d", activeFill: "gold", activeStroke: "purple" },
                ]}
            />
        </div>
    );
};

export default VegetationCover;
