import { useMemo } from 'react';
import { useMatch, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query';
import { fetchWatersheds } from '../../api/api';
import { WatershedProperties } from '../../types/WatershedProperties';
import { watershedOverviewRoute } from '../../routes/router';
import { useAppStore } from '../../store/store';
import { tss } from "tss-react";
import { useTheme } from '@mui/material/styles';
import { ThemeMode } from '../../utils/theme';
import { toast } from 'react-toastify';
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";

const useStyles = tss.withParams<{ mode: ThemeMode }>().create(({ mode }) => ({
    closeButton: {
        backgroundColor: mode.colors.error,
        color: mode.colors.primary100,
        fontSize: mode.fs[100],
        marginTop: mode.space[300],
        marginBottom: mode.space[200],
        padding: '0.313rem 0.5rem',
    },
    contentBox: {
        marginTop: '1.15rem',
    },
    modelsBox: {
        marginTop: '1.5rem',
    },
    title: {
        marginBottom: mode.space[300],
        fontSize: mode.fs[200],
    },
    paragraph: {
        marginBottom: mode.space[200],
        fontSize: mode.fs[200],
    },
    accordionGroup: {
        marginTop: mode.space[400],
        paddingBottom: mode.space[300],
        display: 'flex',
        flexDirection: 'column',
        gap: mode.space[300],
    },
    actionButton: {
        width: '100%',
        color: mode.colors.primary100,
        borderBottom: `1px solid ${mode.colors.primary100}`,
        padding: `${mode.space[300]} ${mode.space[400]}`,
        justifyContent: 'flex-start',
        fontSize: mode.fs[100],
        '&:hover': {
            borderColor: '#646cff',
        },
    },
    skeletonClose: {
        marginTop: mode.space[300],
        marginBottom: mode.space[400],
    },
    skeletonText: {
        marginBottom: mode.space[200],
    },
    skeletonParagraph: {
        marginBottom: mode.space[300],
    },
    skeletonGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: mode.space[300],
        marginTop: mode.space[600],
    },
}));

/** 
 * Renders the "skeleton" version of the watershed panel while loading.
 */
function SkeletonWatershedPanel({ mode }: { mode: ThemeMode }) {
    const { classes } = useStyles({ mode });
    return (
        <div>
            <Skeleton variant="rectangular" width="20%" height="1.75rem" className={classes.skeletonClose} />
            <Skeleton variant="text" width="60%" height="1.75rem" className={classes.skeletonText} />

            <Skeleton variant="text" width="90%" height="1.75rem" className={classes.skeletonParagraph} />
            <Skeleton variant="text" width="60%" height="1.75rem" className={classes.skeletonParagraph} />
            <Skeleton variant="text" width="60%" height="1.75rem" className={classes.skeletonParagraph} />
            <Skeleton variant="text" width="60%" height="1.75rem" className={classes.skeletonParagraph} />
            <Skeleton variant="text" width="60%" height="1.75rem" className={classes.skeletonParagraph} />
            <Skeleton variant="text" width="90%" height="1.75rem" className={classes.skeletonParagraph} />

            <div className={classes.skeletonGroup}>
                <Skeleton variant="rectangular" width="100%" height="3rem" />
                <Skeleton variant="rectangular" width="100%" height="3rem" />
                <Skeleton variant="rectangular" width="100%" height="3rem" />
                <Skeleton variant="rectangular" width="100%" height="3rem" />
            </div>
        </div>
    );
}

export default function WatershedOverview() {
    const theme = useTheme();
    const mode = (theme as { mode: ThemeMode }).mode;
    const navigate = useNavigate();

    const { classes } = useStyles({ mode });
    const { resetOverlays } = useAppStore();

    const match = useMatch({ from: watershedOverviewRoute.id, shouldThrow: false });
    const watershedID = match?.params.webcloudRunId ?? null;

    const { data: watersheds, isLoading, error } = useQuery({
        queryKey: ["watersheds"],
        queryFn: fetchWatersheds,
    });

    const watershed = useMemo(() => {
        if (!watersheds?.features || !watershedID) return null;
        return watersheds.features.find(
            (feature: GeoJSON.Feature<GeoJSON.Geometry, WatershedProperties>) => feature.id && feature.id.toString() === watershedID
        );
    }, [watersheds?.features, watershedID]);

    if (isLoading) return <SkeletonWatershedPanel mode={mode} />;
    if (error) return <div>Error: {(error as Error).message}</div>;
    if (!watersheds?.features) return <div>No watershed data found.</div>;

    if (!watershed) {
        toast.error("Watershed not found.");
        navigate({ to: "/" });
    }

    return (
        <div>
            <Button
                onClick={() => {
                    navigate({ to: "/" });
                    resetOverlays();
                }}
                className={classes.closeButton}
                aria-label='Close watershed panel'
                title='Close watershed panel'
                variant="contained"
            >
                BACK
            </Button>
            <div className={classes.contentBox}>
                <Typography variant="h6" className={classes.title}>
                    <strong>{watershed.properties.pws_name}</strong>
                </Typography>
                <Typography variant="body1" className={classes.paragraph}>
                    This is where the description for the watershed will go. For now we have placeholder text.
                </Typography>
                <Typography variant="body1" className={classes.paragraph}>
                    <strong>County:</strong> {watershed.properties.county_nam ?? "N/A"}
                </Typography>
                <Typography variant="body1" className={classes.paragraph}>
                    <strong>Area:</strong> {watershed.properties.shape_area ? `${watershed.properties.shape_area.toFixed(2)}` : "N/A"}
                </Typography>
                <Typography variant="body1" className={classes.paragraph}>
                    <strong>Number of Customers:</strong>{" "}
                    {watershed.properties.num_customers ?? "N/A"}
                </Typography>
                <Typography variant="body1" className={classes.paragraph}>
                    <strong>Source Name:</strong> {watershed.properties.srcname ?? "N/A"}
                </Typography>
                <Typography variant="body1" className={classes.paragraph}>
                    <strong>Source Type:</strong> {watershed.properties.srctype ?? "N/A"}
                </Typography>
            </div>

            <div className={classes.modelsBox}>
                <div>
                    <Typography variant="body1">
                        <strong>Watershed Models</strong>
                    </Typography>
                </div>
                <div className={classes.accordionGroup} key={watershedID}>
                    <Button
                        className={classes.actionButton}
                        aria-label='View Calibrated WEPP Results'
                        title='View Calibrated WEPP Results'
                        variant="text"
                    >
                        View Calibrated WEPP Results
                    </Button>

                    <Button
                        className={classes.actionButton}
                        aria-label='View Calibrated RHESSys Results'
                        title='View Calibrated RHESSys Results'
                        variant="text"
                    >
                        View Calibrated RHESSys Results
                    </Button>

                    <Button
                        className={classes.actionButton}
                        aria-label='Run WEPP cloud watershed analysis model'
                        title='Run WEPPcloud watershed analysis model'
                        variant="text"
                    >
                        WEPPcloud Watershed Analysis
                    </Button>
                </div>
            </div>
        </div>
    )
}
