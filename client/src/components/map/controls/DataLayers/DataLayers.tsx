import { ChangeEvent, useState } from 'react';
import { useAppStore } from '../../../../store/store';
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
    clearSelectedHillslope,
    closePanel,
    resetOverlays,
  } = useAppStore();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Hill Slopes');

  const navTabs = [
    { key: 'Hill Slopes', icon: <FaWater title="Hill Slopes" /> },
    { key: 'Surface Data', icon: <FaGlobe title="Coverage" /> },
    { key: 'Coverage', icon: <FaTree title="Vegetation" /> },
    { key: 'Soil Burn', icon: <FaFireAlt title="Soil Burn" /> },
  ];

  const toggleOpen = () => setIsOpen(prev => !prev);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { id, checked } = e.target;

    if (id === 'subcatchment') {
      setSubcatchment(checked);
      if (!checked) {
        closePanel();
        setLanduse(false);
        clearSelectedHillslope();
      }
    }

    if (id === 'channels') {
      setChannels(checked);
    }

    if (id === 'landuse') {
      setSubcatchment(checked);
      setLanduse(checked);
      if (!checked) {
        resetOverlays();
      }
    }
  };

  return (
    <div className="layerpicker leaflet-control">
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
            {navTabs.map(tab => {
              const isActive = activeTab === tab.key;
              return (
                <div
                  key={tab.key}
                  className={`layerpicker-navbutton${isActive ? ' open active' : ''}`}
                  data-layer-tab={tab.key}
                  onClick={() => {
                    if (isActive) {
                      toggleOpen();
                    } else {
                      setActiveTab(tab.key);
                      setIsOpen(true);
                    }
                  }}
                >
                  {tab.icon}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
