import { tss } from 'tss-react';
import { useTheme } from '@mui/material/styles';
import { Paper, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useAppStore } from '../../../store/store';
import type { ThemeMode } from '../../../utils/theme';

const useStyles = tss.withParams<{ mode: ThemeMode }>().create(({ mode }) => ({
    landuseLegendWrapper: {
        position: 'absolute',
        left: 10,
        top: 60,
        zIndex: 1200,
        maxWidth: 360,
    },
    landuseLegend: {
        background: 'rgba(0, 0, 0, 0.85)',
        color: mode.colors.primary100,
        padding: mode.space[300],
        borderRadius: 6,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
    },
    landuseLegendHeader: {
        display: 'flex',
        alignItems: 'center',
        fontWeight: 'bold',
        gap: mode.space[100],
        marginBottom: mode.space[200],
    },
    landuseClose: {
        cursor: 'pointer',
        color: mode.colors.primary100,
        padding: mode.space[100],
    },
    landuseLegendContent: {
        display: 'flex',
        flexDirection: 'column',
        gap: mode.space[200],
        overflow: 'auto',
        maxHeight: '50vh',
    },
    landuseItem: {
        display: 'flex',
        alignItems: 'center',
        paddingRight: mode.space[400],
        gap: mode.space[300],
    },
    landuseSwatch: {
        width: 24,
        height: 24,
        border: '1px solid #ccc',
        borderRadius: 4,
        flex: '0 0 24px',
    },
    landuseDesc: {
        fontSize: '0.95rem',
        color: mode.colors.primary100,
    },
    landuseEmpty: {
        fontSize: '0.9rem',
        opacity: 0.85,
        color: mode.colors.primary100,
    },
    heading: {
        color: mode.colors.primary100,
        fontWeight: 'bold',
        fontSize: mode.fs[100],
    },
}));

export default function LandUseLegend() {
    const theme = useTheme();
    const mode = (theme as { mode: ThemeMode }).mode;
    const { classes } = useStyles({ mode });

    const { landuseLegendVisible, landuseLegendMap, setLanduseLegendVisible } = useAppStore();

    if (!landuseLegendVisible) return null;

    return (
        <div className={classes.landuseLegendWrapper} role="region" aria-label="Land use legend">
            <Paper className={classes.landuseLegend}>
                <div className={classes.landuseLegendHeader}>
                    <IconButton
                        onClick={() => setLanduseLegendVisible(false)}
                        className={classes.landuseClose}
                        aria-label='Close land use legend panel'
                        title='Close land use legend panel'
                        size="small"
                    >
                        <CloseIcon />
                    </IconButton>
                    <Typography variant="h6" className={classes.heading}>Land Use Legend</Typography>
                </div>

                <div className={classes.landuseLegendContent}>
                    {Object.entries(landuseLegendMap).length === 0 && (
                        <Typography className={classes.landuseEmpty}>No legend data available.</Typography>
                    )}

                    {Object.entries(landuseLegendMap).map(([color, desc]) => (
                        <div key={color} className={classes.landuseItem}>
                            <div className={classes.landuseSwatch} style={{ background: color }} />
                            <Typography className={classes.landuseDesc}>{desc}</Typography>
                        </div>
                    ))}
                </div>
            </Paper>
        </div>
    );
}
