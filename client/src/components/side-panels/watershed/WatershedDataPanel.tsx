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

export default function WatershedDataPanel() {
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
        <div className='watershedPanel'>
            <button
                onClick={() => {
                    navigate({ to: ".." });
                }}
                className='closeButton'
                aria-label='Close watershed panel'
                title='Close watershed panel'
                style={{ padding: '0.313rem 0.5rem' }}
            >
                BACK
            </button>

            <h2>{watershed.properties.pws_name}</h2>
            <p>This is where the overview data for the watershed will go. For now we have placeholder text.</p>
            <p>
                <strong>Total Coverage:</strong>{" "}
                {watershed.properties.num_customers ?? "N/A"}
            </p>
            <p>
                <strong>Data Statistic:</strong> {watershed.properties.source_type ?? "N/A"}
            </p>
            <p>
                <strong>Data Statistic:</strong> {watershed.properties.cnty_name ?? "N/A"}
            </p>
            <p>
                <strong>Data Statistic:</strong> {watershed.properties.acres ?? "N/A"}
            </p>

            <div className="row">
                <p style={{ marginBottom: '0' }}><strong>Watershed Models</strong></p>
            </div>

            <div className="accordionGroup">
                <AccordionItem title="Soil Burn Severity">
                    <button className="subButton">Firesev</button>
                    <button className="subButton">Predict</button>
                    <button className="subButton">Soil Burn Severity</button>
                </AccordionItem>

                <button className="actionButton">Vegetation Cover</button>
                <button className="actionButton">Evapotransportation</button>
                <button className="actionButton">Soil Moisture</button>
            </div>
        </div>
    )
}
