import React from 'react';

import {
    ResponsiveContainer,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    LineChart,
} from 'recharts';

type ChartData = {
    name: string;
    coverage: number;
}[];

export type CoverageBarChartProps = {
    data: ChartData;
    title: string;
    barKeys: { key: string; color: string; activeFill: string; activeStroke: string }[];
};

export const CoverageBarChart: React.FC<CoverageBarChartProps> = ({ data, title, barKeys }) => {
    const isEmpty = !data || data.length === 0;

    return (
        <div style={{ width: '100%', height: 300 }}>
            {isEmpty ? (
                <div
                    role="status"
                    aria-live="polite"
                    style={{
                        height: 'calc(100% - 32px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--clr-text-muted, #666)',
                        fontSize: 32,
                        padding: 8,
                    }}
                >
                    {`No data found for ${title}`}
                </div>
            ) : (
                <>
                    <h3 data-testid="coverage-chart" style={{ textAlign: 'center', margin: '0 0 8px' }}>{title}</h3>

                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={data}
                            margin={{
                                top: 20,
                                right: 20,
                                bottom: 20,
                                left: 20,
                            }}
                        >
                            <CartesianGrid stroke="#f5f5f5" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            {barKeys.map((bar) => (
                                <Line
                                    key={bar.key}
                                    type="monotone"
                                    dataKey={bar.key}
                                    stroke={bar.color}
                                    strokeWidth={3}
                                    activeDot={{ r: 8, fill: bar.activeFill, stroke: bar.activeStroke, strokeWidth: 2 }}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </>
            )}
        </div>
    );
};

export default CoverageBarChart;
