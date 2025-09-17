import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query';
import { fetchWatersheds } from '../../../api/api';
import { useContext, useMemo, useState } from 'react';
import { FaPlus, FaXmark } from 'react-icons/fa6';
import { WatershedIDContext } from '../../../context/watershed-id/WatershedIDContext';
import { useBottomPanelContext } from '../../../context/bottom-panel/BottomPanelContext';
import { useWatershedOverlayContext } from '../../../context/watershed-overlay/WatershedOverlayProvider';
import CoverageBarChart from '../../coverage-bar-chart/CoverageBarChart';
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
    const [isOpen, setIsOpen] = useState(false);
    const [vegOption, setVegOption] = useState<'shrub' | 'tree' | ''>('');

    const { setSubcatchment, setUseSubcatchmentFeatureColor } = useWatershedOverlayContext();

    const navigate = useNavigate();
    const watershedId = useContext(WatershedIDContext);
    const bottomPanel = useBottomPanelContext();

    const { data: watersheds, isLoading, error } = useQuery({
        queryKey: ["watersheds"],
        queryFn: fetchWatersheds,
    });

    const toggleVeg = () => setIsOpen(open => !open);

    const watershed = useMemo(() => {
        if (!watersheds?.features || !watershedId) return null;
        return watersheds.features.find(
            (f: any) => f.id && f.id.toString() === watershedId
        );
    }, [watersheds?.features, watershedId]);

    const shrubData = [
        { name: 'Zone 1', coverage: 120, density: 80 },
        { name: 'Zone 2', coverage: 98, density: 65 },
        { name: 'Zone 3', coverage: 86, density: 70 },
    ];
    const treeData = [
        { name: 'Zone 1', coverage: 150, density: 90 },
        { name: 'Zone 2', coverage: 130, density: 85 },
        { name: 'Zone 3', coverage: 110, density: 75 },
    ];

    if (isLoading) return <SkeletonWatershedPanel />;
    if (error) return <div>Error: {(error as Error).message}</div>;
    if (!watersheds?.features) return <div>No watershed data found.</div>;
    if (!watershed) return <div>Watershed not found.</div>;

    return (
        <div className="watershedPanel">
            <button
                onClick={() => {
                    bottomPanel.closePanel();
                    navigate({
                        to: `/watershed/${watershedId}`,
                    });
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

                {/* Vegetation Cover Toggle */}
                <div>
                    <button
                        onClick={toggleVeg}
                        className="accordionButton"
                        aria-label={isOpen ? 'Close Vegetation Cover' : 'Open Vegetation Cover'}
                        title={isOpen ? 'Close Vegetation Cover' : 'Open Vegetation Cover'}
                    >
                        Vegetation Cover {isOpen ? <FaXmark /> : <FaPlus />}
                    </button>

                    {isOpen && (
                        <div className="vegetationSelector expanded">
                            <div className="veg-options">
                                {(['shrub', 'tree'] as const).map(option => (
                                    <div key={option} className='veg-options-container'>
                                        <input
                                            type="radio"
                                            id={option}
                                            name="veg"
                                            checked={vegOption === option}
                                            onChange={() => {
                                                setVegOption(option);
                                                bottomPanel.openPanel(
                                                    <div>
                                                        <div className='dateSelector right-align'>
                                                            <label htmlFor="veg-year">Select Year Range:</label>
                                                            <select id="veg-year">
                                                                <option value="2024-2025">2024-2025</option>
                                                                <option value="2023-2024">2023-2024</option>
                                                                <option value="2022-2023">2022-2023</option>
                                                                {/* …etc */}
                                                            </select>
                                                        </div>
                                                        {/* Simple for now as there are only 2 sets of data but will rework as more data is added */}
                                                        <CoverageBarChart
                                                            data={option === 'shrub' ? shrubData : treeData}
                                                            title={option === 'shrub' ? 'Shrub Coverage' : 'Tree Coverage'}
                                                            barKeys={[
                                                                { key: 'coverage', color: '#8884d8', activeFill: 'pink', activeStroke: 'blue' },
                                                                { key: 'density', color: '#82ca9d', activeFill: 'gold', activeStroke: 'purple' }
                                                            ]}
                                                        />
                                                    </div>
                                                );
                                            }}
                                        />
                                        <label htmlFor={option}>
                                            {option === 'shrub' ? 'Shrub Cover' : 'Tree Cover'}
                                        </label>
                                    </div>
                                ))}
                            </div>
                            <div>
                                <button
                                    type="button"
                                    className="clear-button"
                                    onClick={() => {
                                        setVegOption('');
                                        bottomPanel.closePanel();
                                    }}
                                >
                                    Clear Selection
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <button className="actionButton">Evapotransportation</button>
                <button className="actionButton">Soil Moisture</button>
                <button
                    className="actionButton"
                    onClick={() => {
                        setSubcatchment(true);
                        setUseSubcatchmentFeatureColor(true);
                    }}
                >
                    View Land Use
                </button>
            </div>
        </div>
    )
}
