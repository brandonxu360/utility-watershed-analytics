import React from 'react';

import {
    BarChart, Bar, Rectangle, XAxis, YAxis,
    CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

type CoverageBarChartProps = {
    data: any[];
    title: string;
    barKeys: { key: string; color: string; activeFill: string; activeStroke: string }[];
};

export const CoverageBarChart: React.FC<CoverageBarChartProps> = ({ data, title, barKeys }) => (
    <div style={{ width: '100%', height: 300 }}>
        <h3 style={{ textAlign: 'center' }}>{title}</h3>
        <ResponsiveContainer>
            <BarChart
                data={data}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                {barKeys.map(({ key, color, activeFill, activeStroke }) => (
                    <Bar
                        key={key}
                        dataKey={key}
                        fill={color}
                        activeBar={<Rectangle fill={activeFill} stroke={activeStroke} />}
                    />
                ))}
            </BarChart>
        </ResponsiveContainer>
    </div>
);

export default CoverageBarChart;
