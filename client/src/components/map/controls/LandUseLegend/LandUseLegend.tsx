import { useWatershedOverlayStore } from '../../../../store/WatershedOverlayStore';
import { FaXmark } from 'react-icons/fa6';
import './LandUseLegend.css';

export default function LandUseLegend() {
    const { landuselegend, landuseLegendMap, setLanduseLegend } = useWatershedOverlayStore();

    if (!landuselegend) return null;

    return (
        <div className="landuse-legend-wrapper" role="region" aria-label="Land use legend">
            <div className="landuse-legend">
                <div className="landuse-legend-header">
                    <FaXmark
                        onClick={() => setLanduseLegend(false)}
                        className='landuse-close'
                        aria-label='Close land use legend panel'
                        title='Close land use legend panel'
                    />
                    <h3>Land Use Legend</h3>
                </div>

                <div className="landuse-legend-content">
                    {Object.entries(landuseLegendMap).length === 0 && (
                        <div className="landuse-empty">No legend data available.</div>
                    )}

                    {Object.entries(landuseLegendMap).map(([color, desc]) => (
                        <div key={color} className="landuse-item">
                            <div className="landuse-swatch" style={{ background: color }} />
                            <span className="landuse-desc">{desc}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
