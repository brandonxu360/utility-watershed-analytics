import React, { useMemo, useState, useEffect } from "react";
import { FaXmark } from "react-icons/fa6";
import { useBottomPanelStore } from "../../store/BottomPanelStore";
import { fetchRapTimeseries, RapRow } from '../../api/rapApi';
import { useWatershedOverlayStore } from "../../store/WatershedOverlayStore";
import CoverageBarChart from "../coverage-line-chart/CoverageLineChart";
import Select from "../select/Select";
import "./BottomPanel.css";

type RapStatus = {
    state: 'loading' | 'ready' | 'error';
    message?: string | null
};

export const VegetationCover: React.FC = () => {
    const { selectedHillslopeId, closePanel, clearSelectedHillslope } = useBottomPanelStore();
    const { setSubcatchment } = useWatershedOverlayStore();

    const [vegetationOption, setVegetationOption] = useState<"All" | "Shrub" | "Tree">("All");

    const barKeys = useMemo(() => {
        const shrubKey = { key: 'shrub', color: '#4caf50', activeFill: '#a5d6a7', activeStroke: '#2e7d32' };
        const treeKey = { key: 'tree', color: '#8B4513', activeFill: '#d7a17a', activeStroke: '#5c3317' };

        if (vegetationOption === 'All') return [shrubKey, treeKey];
        if (vegetationOption === 'Shrub') return [shrubKey];
        return [treeKey];
    }, [vegetationOption]);

    const startYear = 1986;
    const endYear = 2023;

    const years = Array.from(
        { length: endYear - startYear + 1 },
        (_, i) => String(startYear + i)
    );

    const [selectedYear, setSelectedYear] = useState<string>('All');

    // RAP timeseries fetched for selected hillslope (topaz id)
    const [rapTimeSeries, setRapTimeSeries] = useState<RapRow[] | null>(null);
    const [rapStatus, setRapStatus] = useState<RapStatus>({ state: 'ready' });

    // RAP band -> vegetation mapping
    // RAP band codes:
    // 1: annual forbs & grasses
    // 2: bare ground
    // 3: litter
    // 4: perennial forbs & grasses
    // 5: shrub
    // 6: tree
    const BAND_MAPPING: Record<"All" | "Shrub" | "Tree", number[]> = useMemo(() => ({
        All: [1, 4, 5, 6],
        Shrub: [5],
        Tree: [6],
    }), []);

    useEffect(() => {
        let mounted = true;
        async function loadRap() {
            if (!selectedHillslopeId) {
                setRapTimeSeries(null);
                setRapStatus({ state: 'ready' });
                return;
            }

            setRapStatus({ state: 'loading' });
            try {
                const rows = await fetchRapTimeseries(selectedHillslopeId, undefined, selectedYear === 'All' ? undefined : Number(selectedYear));
                if (!mounted) return;
                setRapTimeSeries(Array.isArray(rows) ? rows : []);
                setRapStatus({ state: 'ready' });
            } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
                if (!mounted) return;
                setRapStatus({ state: 'error', message: err?.message ?? String(err) });
                setRapTimeSeries(null);
            }
        }

        loadRap();

        return () => {
            mounted = false;
        };
    }, [selectedHillslopeId, selectedYear]);

    const singleHillslopeChartData = useMemo(() => {
        if (!selectedHillslopeId) return null;
        if (!rapTimeSeries || rapTimeSeries.length === 0) return null;

        const allowedBands = BAND_MAPPING[vegetationOption];

        // If a single year is selected, return a single-entry dataset for that year
        if (selectedYear !== 'All') {
            const yearNum = Number(selectedYear);
            let total = 0;
            let shrub = 0;
            let tree = 0;
            for (const row of rapTimeSeries) {
                if (row.topaz_id !== selectedHillslopeId) continue;
                if (row.year !== yearNum) continue;
                const valueNum = row.value;
                // accumulate overall total for allowed bands
                if (allowedBands && allowedBands.includes(row.band)) {
                    total += valueNum;
                }
                // also accumulate shrub/tree separately
                if (row.band === 5) shrub += valueNum;
                if (row.band === 6) tree += valueNum;
            }
            return [{ name: String(yearNum), coverage: total, shrub, tree }];
        }

        // All years: initialize full year range so missing years show as 0
        const valuesByYear = new Map<number, { coverage: number; shrub: number; tree: number }>();
        for (let y = startYear; y <= endYear; y++) valuesByYear.set(y, { coverage: 0, shrub: 0, tree: 0 });

        for (const row of rapTimeSeries) {
            if (row.topaz_id !== selectedHillslopeId) continue;
            const yearEntry = valuesByYear.get(row.year);
            if (!yearEntry) continue;
            const valueNum = row.value;
            // overall coverage only counts allowed bands
            if (allowedBands && allowedBands.includes(row.band)) {
                yearEntry.coverage += valueNum;
            }
            if (row.band === 5) yearEntry.shrub += valueNum;
            if (row.band === 6) yearEntry.tree += valueNum;
            valuesByYear.set(row.year, yearEntry);
        }

        const chartSeries = Array.from(valuesByYear.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([yr, vals]) => ({ name: String(yr), coverage: vals.coverage, shrub: vals.shrub, tree: vals.tree }));

        return chartSeries.length ? chartSeries : null;
    }, [selectedHillslopeId, rapTimeSeries, vegetationOption, startYear, endYear, selectedYear, BAND_MAPPING]);

    const chartData = singleHillslopeChartData || [];

    const chartTitle = selectedHillslopeId
        ? `${vegetationOption} Coverage - Hillslope ${selectedHillslopeId} (${selectedYear})`
        : `${vegetationOption} Coverage (${selectedYear})`;

    return (
        <div>
            <div className="titleBar">
                <div className="vegCoverSelector">
                    <div className="option-align">
                        <label htmlFor="veg-cover-title">Vegetation Cover:</label>
                        <Select
                            id="veg-cover-title"
                            value={vegetationOption}
                            onChange={(v) => setVegetationOption(v as "All" | "Shrub" | "Tree")}
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
                            value={selectedYear}
                            onChange={(v) => setSelectedYear(v)}
                            options={['All', ...years.slice().reverse()]}
                            ariaLabel="Select vegetation year"
                        />
                    </div>
                    <FaXmark className="vegCloseButton" onClick={() => {
                        clearSelectedHillslope();
                        setSubcatchment(false);
                        closePanel()
                    }} />
                </div>
            </div>

            {rapStatus.state === 'loading' && <div style={{ textAlign: 'center', marginBottom: 8 }}>Loading vegetation data…</div>}

            <CoverageBarChart
                data={chartData}
                title={chartTitle}
                barKeys={barKeys}
            />
        </div>
    );
};

export default VegetationCover;
