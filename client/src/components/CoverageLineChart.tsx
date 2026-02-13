import React from 'react';
import { tss } from '../utils/tss';
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

export type CoverageLineChartProps = {
    data: ChartData;
    title: string;
    lineKeys: { key: string; color: string; activeFill: string; activeStroke: string }[];
};

const useStyles = tss.create(({ theme }) => ({
    container: {
        width: '100%',
        height: 300,
    },
    emptyState: {
        height: 'calc(100% - 32px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: theme.palette.muted.main,
        fontSize: 32,
        padding: theme.spacing(1),
    },
    title: {
        textAlign: 'center',
        margin: `0 0 ${theme.spacing(1)}`,
    },
}));

export const CoverageLineChart: React.FC<CoverageLineChartProps> = ({ data, title, lineKeys }) => {
    const { classes, theme } = useStyles();
    const isEmpty = !data || data.length === 0;

    return (
        <div className={classes.container}>
            {isEmpty ? (
                <div
                    role="status"
                    aria-live="polite"
                    className={classes.emptyState}
                >
                    {`No data found for ${title}`}
                </div>
            ) : (
                <>
                    <h3 data-testid="coverage-chart" className={classes.title}>{title}</h3>

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
                            <CartesianGrid 
                                stroke={theme.palette.surface.light} 
                                data-testid="cartesian-grid"
                                data-stroke={theme.palette.surface.light.toLowerCase()}
                            />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            {lineKeys.map((line) => (
                                <Line
                                    key={line.key}
                                    type="monotone"
                                    dataKey={line.key}
                                    stroke={line.color}
                                    strokeWidth={3}
                                    activeDot={{ r: 8, fill: line.activeFill, stroke: line.activeStroke, strokeWidth: 2 }}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </>
            )}
        </div>
    );
};

export default CoverageLineChart;
