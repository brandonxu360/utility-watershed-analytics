import React, { useMemo, useState, useEffect } from "react";
import { FaXmark } from "react-icons/fa6";
import { useAppStore } from "../../store/store";
import { CoverageLineChart } from "../coverage-line-chart/CoverageLineChart";
import { useChoropleth, CHOROPLETH_YEARS } from "../../hooks/useChoropleth";
import { ChoroplethScale } from "../ChoroplethScale";
import { fetchRapChoropleth } from "../../api/rapApi";
import { DEFAULT_RUN_ID } from "../../api/queryUtils";
import Select from "../select/Select";
import "./BottomPanel.css";

type EtStatus = {
    state: 'loading' | 'ready' | 'error';
    message?: string | null;
};

type EtTimeseriesRow = {
    year: number;
    value: number;
};

export const EvapotranspirationPanel: React.FC = () => {
    const {
        selectedHillslopeId,
        choropleth: {
            year: choroplethYear,
            range: choroplethRange,
            loading: choroplethLoading
        },
        closePanel,
        clearSelectedHillslope,
        setSubcatchment,
        setChoroplethYear,
        resetChoropleth,
    } = useAppStore();

    const { config } = useChoropleth();

    const years = ['All', ...CHOROPLETH_YEARS.slice().reverse().map(String)];

    const [selectedYear, setSelectedYear] = useState<string>(
        choroplethYear === null ? 'All' : String(choroplethYear)
    );

    const handleYearChange = (v: string) => {
        setSelectedYear(v);
        setChoroplethYear(v === 'All' ? null : Number(v));
    };

    const handleClose = () => {
        clearSelectedHillslope();
        setSubcatchment(false);
        resetChoropleth();
        closePanel();
    };

    // ET timeseries data
    const [etTimeSeries, setEtTimeSeries] = useState<EtTimeseriesRow[] | null>(null);
    const [etStatus, setEtStatus] = useState<EtStatus>({ state: 'ready' });

    useEffect(() => {
        let mounted = true;

        async function loadEtData() {
            setEtStatus({ state: 'loading' });

            try {
                const yearToFetch = selectedYear === 'All' ? null : Number(selectedYear);

                if (yearToFetch !== null) {
                    const rows = await fetchRapChoropleth({
                        runIdOrPath: DEFAULT_RUN_ID,
                        band: config?.bands ?? [],
                        year: yearToFetch,
                    });

                    if (!mounted) return;

                    const values = rows.map(r => r.value).filter(v => Number.isFinite(v));
                    const avgValue = values.length > 0
                        ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100
                        : 0;

                    setEtTimeSeries([{ year: yearToFetch, value: avgValue }]);
                    setEtStatus({ state: 'ready' });
                } else {
                    const allYearsData: EtTimeseriesRow[] = [];

                    for (const year of CHOROPLETH_YEARS) {
                        const rows = await fetchRapChoropleth({
                            runIdOrPath: DEFAULT_RUN_ID,
                            band: config?.bands ?? [],
                            year,
                        });

                        const values = rows.map(r => r.value).filter(v => Number.isFinite(v));
                        const avgValue = values.length > 0
                            ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100
                            : 0;

                        allYearsData.push({ year, value: avgValue });
                    }

                    if (!mounted) return;
                    setEtTimeSeries(allYearsData);
                    setEtStatus({ state: 'ready' });
                }
            } catch (err: unknown) {
                if (!mounted) return;
                const message = err instanceof Error ? err.message : String(err);
                setEtStatus({ state: 'error', message });
                setEtTimeSeries(null);
            }
        }

        loadEtData();
        return () => { mounted = false; };
    }, [selectedYear, selectedHillslopeId, config]);

    const chartData = useMemo(() => {
        if (!etTimeSeries || etTimeSeries.length === 0) return [];

        return etTimeSeries
            .sort((a, b) => a.year - b.year)
            .map(row => ({
                name: String(row.year),
                coverage: row.value,
                et: row.value,
            }));
    }, [etTimeSeries]);

    const lineKeys = [
        { key: 'et', color: '#1976d2', activeFill: '#90caf9', activeStroke: '#0d47a1' }
    ];

    const chartTitle = selectedHillslopeId
        ? `Evapotranspiration - Hillslope ${selectedHillslopeId} (${selectedYear})`
        : `Evapotranspiration (${selectedYear})`;

    return (
        <div>
            <div className="titleBar">
                <div className="vegCoverSelector">
                    <h3 style={{ margin: 0, fontSize: '1rem' }}>Evapotranspiration</h3>
                </div>

                <div className="dateSelector">
                    <div className="option-align">
                        <label htmlFor="et-year">Select Year:</label>
                        <Select
                            id="et-year"
                            value={selectedYear}
                            onChange={handleYearChange}
                            options={years}
                            ariaLabel="Select evapotranspiration year"
                        />
                    </div>
                    <FaXmark className="vegCloseButton" onClick={handleClose} />
                </div>
            </div>

            {etStatus.state === 'loading' && (
                <div style={{ textAlign: 'center', padding: '1rem' }}>Loading evapotranspiration data…</div>
            )}

            {etStatus.state === 'error' && (
                <div style={{ textAlign: 'center', padding: '1rem', color: '#d32f2f' }}>
                    {etStatus.message ?? 'Failed to load data'}
                </div>
            )}

            {etStatus.state === 'ready' && (
                <CoverageLineChart
                    data={chartData}
                    title={chartTitle}
                    lineKeys={lineKeys}
                />
            )}

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

export default EvapotranspirationPanel;
