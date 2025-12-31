import React, { useMemo, useState, useEffect } from "react";
import { FaXmark } from "react-icons/fa6";
import { useBottomPanelStore } from "../../store/BottomPanelStore";
import { useWatershedOverlayStore, VegetationBandType } from "../../store/WatershedOverlayStore";
import { useMatch } from '@tanstack/react-router';
import { watershedOverviewRoute } from '../../routes/router';
import { CoverageLineChart } from "../coverage-line-chart/CoverageLineChart";
import { AggregatedRapRow } from "../../api/types";
import { useChoropleth } from "../../hooks/useChoropleth";
import { ChoroplethScale } from "../ChoroplethScale";
import { endYear, startYear } from "../../utils/constants";
import fetchRap from '../../api/rapApi';
import Select from "../select/Select";
import "./BottomPanel.css";

type RapStatus = {
    state: 'loading' | 'ready' | 'error';
    message?: string | null
};

type VegetationOption = "All" | "Shrub" | "Tree";

export const VegetationCover: React.FC = () => {
    const { selectedHillslopeId, closePanel, clearSelectedHillslope } = useBottomPanelStore();

    const {
        choropleth: { year: choroplethYear, bands: choroplethBands, range: choroplethRange, loading: choroplethLoading },
        setSubcatchment,
        setChoroplethYear,
        setChoroplethBands,
        resetChoropleth,
    } = useWatershedOverlayStore();

    const { config } = useChoropleth();

    const match = useMatch({ from: watershedOverviewRoute.id, shouldThrow: false });
    const watershedID = match?.params.webcloudRunId ?? null;
    // Temporary run id override for the current query engine dataset (hardcoded until new data is available)
    // This should be removed when the app is pointed at the updated runs or when a mapping
    // from route watershed id -> run id is available.
    const RUN_ID_OVERRIDE = 'or,wa-108';

    // Map UI option to band type
    const vegetationOptionToBand: Record<VegetationOption, VegetationBandType> = {
        "All": "all",
        "Shrub": "shrub",
        "Tree": "tree",
    };

    // Derive reverse mapping from vegetationOptionToBand to avoid duplicated definitions
    const bandToVegetationOption: Record<VegetationBandType, VegetationOption> = Object
        .entries(vegetationOptionToBand)
        .reduce((acc, [option, band]) => {
            acc[band as VegetationBandType] = option as VegetationOption;
            return acc;
        }, {} as Record<VegetationBandType, VegetationOption>);

    // Initialize from store state
    const [vegetationOption, setVegetationOption] = useState<VegetationOption>(
        bandToVegetationOption[choroplethBands]
    );

    const barKeys = useMemo(() => {
        const shrubKey = { key: 'shrub', color: '#8B4513', activeFill: '#d7a17a', activeStroke: '#5c3317' };
        const treeKey = { key: 'tree', color: '#4caf50', activeFill: '#a5d6a7', activeStroke: '#2e7d32' };

        return vegetationOption === 'Shrub' ? [shrubKey] : vegetationOption === 'Tree' ? [treeKey] : [shrubKey, treeKey];
    }, [vegetationOption]);

    const years = Array.from(
        { length: endYear - startYear + 1 },
        (_, i) => String(startYear + i)
    );

    // Initialize from store state
    const [selectedYear, setSelectedYear] = useState<string>(
        choroplethYear === null ? 'All' : String(choroplethYear)
    );

    // Sync vegetation option changes to choropleth store
    const handleVegetationChange = (v: string) => {
        const option = v as "All" | "Shrub" | "Tree";
        setVegetationOption(option);
        setChoroplethBands(vegetationOptionToBand[option]);
    };

    // Sync year changes to choropleth store
    const handleYearChange = (v: string) => {
        setSelectedYear(v);
        setChoroplethYear(v === 'All' ? null : Number(v));
    };

    // RAP timeseries fetched for selected hillslope (topaz id)
    const [rapTimeSeries, setRapTimeSeries] = useState<AggregatedRapRow[] | null>(null);
    const [rapStatus, setRapStatus] = useState<RapStatus>({ state: 'ready' });

    useEffect(() => {
        let mounted = true;
        async function loadRap() {
            setRapStatus({ state: 'loading' });

            try {
                const rows = selectedHillslopeId
                    ? await fetchRap({ mode: 'hillslope', topazId: selectedHillslopeId, runIdOrPath: RUN_ID_OVERRIDE, year: selectedYear === 'All' ? undefined : Number(selectedYear) })
                    : watershedID
                        ? await fetchRap({ mode: 'watershed', weppId: 108, runIdOrPath: RUN_ID_OVERRIDE, year: selectedYear === 'All' ? undefined : Number(selectedYear) })
                        : null;

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
    }, [selectedHillslopeId, selectedYear, watershedID]);

    const singleHillslopeChartData = useMemo(() => {
        if (!rapTimeSeries || rapTimeSeries.length === 0) return null;

        const rows = rapTimeSeries as AggregatedRapRow[];
        const toSeries = (year: number, coverage: number, shrub: number, tree: number) => ({ name: String(year), coverage, shrub, tree });

        if (selectedYear !== 'All') {
            const y = Number(selectedYear);
            const r = rows.find((rr) => rr.year === y);
            return [toSeries(y, r?.coverage ?? 0, r?.shrub ?? 0, r?.tree ?? 0)];
        }

        const map = new Map<number, { coverage: number; shrub: number; tree: number }>();
        for (let y = startYear; y <= endYear; y++) map.set(y, { coverage: 0, shrub: 0, tree: 0 });
        for (const r of rows) {
            map.set(r.year, { coverage: r.coverage ?? 0, shrub: r.shrub ?? 0, tree: r.tree ?? 0 });
        }
        return Array.from(map.entries()).sort((a, b) => a[0] - b[0]).map(([yr, v]) => toSeries(yr, v.coverage, v.shrub, v.tree));
    }, [rapTimeSeries, selectedYear]);

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
                            onChange={handleVegetationChange}
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
                            onChange={handleYearChange}
                            options={['All', ...years.slice().reverse()]}
                            ariaLabel="Select vegetation year"
                        />
                    </div>
                    <FaXmark className="vegCloseButton" onClick={() => {
                        clearSelectedHillslope();
                        setSubcatchment(false);
                        resetChoropleth();
                        closePanel();
                    }} />
                </div>
            </div>

            {rapStatus.state === 'loading' && <div style={{ textAlign: 'center' }}>Loading vegetation data…</div>}

            <CoverageLineChart
                data={chartData}
                title={chartTitle}
                barKeys={barKeys}
            />

            {config && !choroplethLoading && choroplethRange && (
                <div style={{ marginTop: '32px' }}>
                    <ChoroplethScale
                        colormap={config.colormap}
                        range={choroplethRange}
                        unit={config.unit}
                        style={{ padding: '0 1rem', marginBottom: '0.5rem' }}
                    />
                </div>
            )}
        </div>
    );
};

export default VegetationCover;
