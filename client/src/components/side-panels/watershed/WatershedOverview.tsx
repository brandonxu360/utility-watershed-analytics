import { useNavigate, useParams } from '@tanstack/react-router'
import './Watershed.css'
import AccordionItem from '../../accordian-item/AccordianItem'
import { useQuery } from '@tanstack/react-query';
import { fetchWatersheds } from '../../../api/api';

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
    const { webcloudRunId } = useParams({ from: '/watershed/$webcloudRunId' });
    const navigate = useNavigate();

    const { data: watersheds, isLoading, error } = useQuery({
        queryKey: ["watersheds"],
        queryFn: fetchWatersheds,
    });

    if (isLoading) {
        return <SkeletonWatershedPanel />;
    }

    if (error) return <div>Error: {(error as Error).message}</div>;
    if (!watersheds?.features) return <div>No watershed data found.</div>;

    const watershed = watersheds.features.find(
        (f: any) => f.id && f.id.toString() === webcloudRunId
    );

    if (!watershed) return <div>Watershed not found.</div>;

    return (
        <div className="watershedPanel">
            <button
                onClick={() => {
                    navigate({ to: "/" });
                }}
                className='closeButton'
                aria-label='Close watershed panel'
                title='Close watershed panel'
                style={{ padding: '0.313rem 0.5rem' }}
            >
                BACK
            </button>
            <h2>{watershed.properties.pws_name}</h2>
            <p>This is where the description for the watershed will go. For now we have placeholder text.</p>
            <p>
                <strong>Number of Customers:</strong>{" "}
                {watershed.properties.num_customers ?? "N/A"}
            </p>
            <p>
                <strong>Source Type:</strong> {watershed.properties.source_type ?? "N/A"}
            </p>
            <p>
                <strong>County:</strong> {watershed.properties.cnty_name ?? "N/A"}
            </p>
            <p>
                <strong>Acres:</strong> {watershed.properties.acres ?? "N/A"}
            </p>

            <div className="row">
                <p style={{ marginBottom: '0' }}><strong>Watershed Models</strong></p>
            </div>

            <div className='accordionGroup' key={webcloudRunId}>
                <AccordionItem title="View Calibrated WEPP Results">
                    <button className='subButton'>Spatial Outputs</button>
                    <button className='subButton'>Tabular Outputs</button>
                </AccordionItem>

                <AccordionItem title="View Calibrated RHESSys Results">
                    <button className='subButton'>Spatial Outputs</button>
                    <button className='subButton'>Tabular Outputs</button>
                </AccordionItem>

                <button
                    className="actionButton"
                    aria-label='View Watershed Data'
                    title='View Watershed Data'
                    onClick={() => navigate({ to: `./data` })}
                >
                    View Watershed Data
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
    )
}
