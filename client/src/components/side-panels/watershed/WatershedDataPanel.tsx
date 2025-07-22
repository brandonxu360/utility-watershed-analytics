import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query';
import { fetchWatersheds } from '../../../api/api';
import { useMemo, useState } from 'react';
import { useAppSelector } from '../../../app/hooks';
import { selectWatershedID } from '../../../features/watershed/watershedSlice';
import AccordionItem from '../../accordian-item/AccordianItem'
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

export default function WatershedDataPanel() {
    const navigate = useNavigate();

    const watershedId = useAppSelector(selectWatershedID)

    const { data: watersheds, isLoading, error } = useQuery({
        queryKey: ["watersheds"],
        queryFn: fetchWatersheds,
    });

    const [expandedPanel, setExpandedPanel] = useState<"vegetation" | null>(null);

    const togglePanel = (panel: "vegetation") => {
        setExpandedPanel(prev => (prev === panel ? null : panel));
    };

    const watershed = useMemo(() => {
        if (!watersheds?.features || !watershedId) return null;
        return watersheds.features.find(
            (f: any) => f.id && f.id.toString() === watershedId
        );
    }, [watersheds?.features, watershedId]);

    if (isLoading) return <SkeletonWatershedPanel />;
    if (error) return <div>Error: {(error as Error).message}</div>;
    if (!watersheds?.features) return <div>No watershed data found.</div>;
    if (!watershed) return <div>Watershed not found.</div>;

    return (
        <div className="watershedPanel">
            <button
                onClick={() => {
                    navigate({ to: ".." });
                }}
                className='closeButton'
                aria-label='Back to watershed overview panel'
                title='Back to watershed overview panel'
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

                <div>
                    <button
                        className="actionButton"
                        onClick={() => togglePanel("vegetation")}
                    >
                        Vegetation Cover
                    </button>
                    <div
                        className={
                            expandedPanel === "vegetation"
                                ? "dateSelector expanded"
                                : "dateSelector"
                        }
                    >
                        <label htmlFor="veg-year">Select Year Range:</label>
                        <select id="veg-year">
                            <option value="2024-2025">2024–2025</option>
                            <option value="2023-2024">2023–2024</option>
                            <option value="2022-2023">2022–2023</option>
                            {/* …etc */}
                        </select>
                    </div>
                </div>

                <button className="actionButton">Evapotransportation</button>
                <button className="actionButton">Soil Moisture</button>
            </div>
        </div>
    )
}
