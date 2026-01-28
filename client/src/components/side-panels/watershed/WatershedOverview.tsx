import { useMemo } from 'react';
import { useMatch, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query';
import { fetchWatersheds } from '../../../api/api';
import { WatershedProperties } from '../../../types/WatershedProperties';
import { watershedOverviewRoute } from '../../../routes/router';
import { useAppStore } from '../../../store/store';
import './Watershed.css'

/** 
 * Renders the "skeleton" version of the watershed panel while loading.
 */
function SkeletonWatershedPanel() {
    return (
        <div className="skeletonPanel">
            <div className='skeletonCloseButton' />
            <div className='skeletonTitleText' />

            <div className='skeletonParagraph' />
            <div className='skeletonLine' />
            <div className='skeletonLine' />
            <div className='skeletonLine' />
            <div className='skeletonLine' />
            <div className='skeletonParagraph' />

            <div className='skeletonActions'>
                <div className='skeletonButton' />
                <div className='skeletonButton' />
                <div className='skeletonButton' />
                <div className='skeletonButton' />
            </div>
        </div>
    );
}

export default function WatershedOverview() {
    const navigate = useNavigate();
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

    if (isLoading) return <SkeletonWatershedPanel />;
    if (error) return <div>Error: {(error as Error).message}</div>;
    if (!watersheds?.features) return <div>No watershed data found.</div>;
    if (!watershed) return <div>Watershed not found.</div>;

    return (
        <div className="watershedPanel">
            <button
                onClick={() => {
                    navigate({ to: "/" });
                    resetOverlays();
                }}
                className='closeButton'
                aria-label='Close watershed panel'
                title='Close watershed panel'
                style={{ padding: '0.313rem 0.5rem' }}
            >
                BACK
            </button>
            <div style={{ marginTop: '1.15rem' }}>
                <h2>{watershed.properties.pws_name}</h2>
                <p>This is where the description for the watershed will go. For now we have placeholder text.</p>
                <p>
                    <strong>County:</strong> {watershed.properties.county_nam ?? "N/A"}
                </p>
                <p>
                    <strong>Area:</strong> {watershed.properties.shape_area ? `${watershed.properties.shape_area.toFixed(2)}` : "N/A"}
                </p>
                <p>
                    <strong>Number of Customers:</strong>{" "} {/* Placeholder for now - no data for now */}
                    {watershed.properties.num_customers ?? "N/A"}
                </p>
                <p>
                    <strong>Source Name:</strong> {watershed.properties.srcname ?? "N/A"}
                </p>
                <p>
                    <strong>Source Type:</strong> {watershed.properties.srctype ?? "N/A"}
                </p>
            </div>

            <div style={{ marginTop: '2rem' }}>
                <div className="row">
                    <p style={{ marginBottom: '0' }}><strong>Watershed Models</strong></p>
                </div>

                <div className='accordionGroup' key={watershedID}>
                    <button
                        className='actionButton'
                        aria-label='View Uncalibrated WEPP Results'
                        title='View Uncalibrated WEPP Results'
                        onClick={() =>
                            window.open(
                                `https://wepp.cloud/weppcloud/runs/${watershedID}/disturbed9002_wbt/gl-dashboard`,
                                '_blank',
                                'noopener,noreferrer'
                            )
                        }
                    >
                        View Uncalibrated WEPP Results
                    </button>

                    <button
                        className='actionButton'
                        aria-label='View Calibrated RHESSys Results'
                        title='View Calibrated RHESSys Results'
                    >
                        View Calibrated RHESSys Results
                    </button>

                    <button
                        className='actionButton'
                        aria-label='Run WEPP cloud watershed analysis model'
                        title='Run WEPPcloud watershed analysis model'
                    >
                        WEPPcloud Watershed Analysis
                    </button>
                </div>
            </div>
        </div>
    )
}
