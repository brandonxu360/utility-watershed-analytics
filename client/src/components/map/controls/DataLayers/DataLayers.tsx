import { ChangeEvent, useState } from 'react';
import { useWatershedOverlayStore } from '../../../../store/WatershedOverlayStore';
import DataLayersTabContent from './DataLayersTabContent';

import {
  FaChevronUp,
  FaChevronDown,
  FaWater,
  FaGlobe,
  FaTree,
  FaFireAlt,
} from 'react-icons/fa';

import './DataLayers.css';

/**
 * DataLayersControl - toggles visibility of map data layers:
 * - Subcatchments
 * - Channels
 * - Land Use
 */
export default function DataLayersControl() {
  const {
    setSubcatchment,
    setChannels,
    setLanduse,
    reset
  } = useWatershedOverlayStore();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Hill Slopes');

  const navTabs = [
    { key: 'Hill Slopes', icon: <FaWater title="Hill Slopes" /> },
    { key: 'Coverage', icon: <FaGlobe title="Coverage" /> },
    { key: 'Vegetation', icon: <FaTree title="Vegetation" /> },
    { key: 'Soil Burn', icon: <FaFireAlt title="Soil Burn" /> },
  ];

  const toggleOpen = () => setIsOpen(prev => !prev);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { id, checked } = e.target;

    if (id === 'subcatchment') {
      setSubcatchment(checked);
      if (!checked) {
        setLanduse(false);
      }
    }

    if (id === 'channels') {
      setChannels(checked);
    }

    if (id === 'landuse') {
      setSubcatchment(true);
      setLanduse(true);
      if (!checked) {
        reset();
      }
    }
  };

  return (
    <div className="layerpicker leaflet-control" id="layer-picker-region">
      <div>
        <div className="layerpicker-header" onClick={toggleOpen}>
          Data Layers <span className="layerpicker-chevron">{isOpen ? <FaChevronDown /> : <FaChevronUp />}</span>
        </div>
        {isOpen && (
          <div id="layerpicker-tab">
            <div>
              <div>
                <div className="layerpicker-heading">{activeTab}</div>
                <DataLayersTabContent
                  activeTab={activeTab}
                  handleChange={handleChange}
                />
              </div>
            </div>
          </div>
        )}
        <div className="layerpicker-nav">
          <div>
            {navTabs.map(tab => (
              <div
                key={tab.key}
                className={`layerpicker-navbutton${activeTab === tab.key ? ' open active' : ''}`}
                data-layer-tab={tab.key}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.icon}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
