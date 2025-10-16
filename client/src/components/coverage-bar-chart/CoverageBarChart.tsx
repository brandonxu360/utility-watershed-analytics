import React from 'react';
import {
    ResponsiveContainer,
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from 'recharts';

type CoverageBarChartProps = {
    data: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
    title: string;
    barKeys: { key: string; color: string; activeFill: string; activeStroke: string }[];
};

export const CoverageBarChart: React.FC<CoverageBarChartProps> = ({ data, title, barKeys }) => {
    return (
        <div style={{ width: '100%', height: 300 }}>
            <h3 style={{ textAlign: 'center', margin: '0 0 8px' }}>{title}</h3>
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
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

                    {barKeys.map((bk, idx) =>
                        idx === 0 ? (
                            <Bar key={bk.key} dataKey={bk.key} barSize={20} fill={bk.color} />
                        ) : (
                            <Line
                                key={bk.key}
                                type="monotone"
                                dataKey={bk.key}
                                stroke={bk.color}
                                strokeWidth={2}
                                dot={false}
                            />
                        )
                    )}
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};

export default CoverageBarChart;
