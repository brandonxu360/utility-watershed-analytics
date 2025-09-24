import { ChangeEvent, useState } from 'react';
import { FaChevronUp, FaChevronDown, FaWater, FaGlobe, FaTree } from 'react-icons/fa';
import { useWatershedOverlayStore } from '../../../../store/WatershedOverlayStore';
import './DataLayers.css';

/**
 * DataLayersControl - toggles visibility of map data layers:
 * - Subcatchments
 * - Channels
 * - Land Use
 */
export default function DataLayersControl() {
  const {
    subcatchment,
    channels,
    landuse,
    setSubcatchment,
    setChannels,
    setLanduse
  } = useWatershedOverlayStore();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Hill Slopes');

  const navTabs = [
    { key: 'Hill Slopes', icon: <FaWater title="Hill Slopes" /> },
    { key: 'Coverage', icon: <FaGlobe title="Coverage" /> },
    { key: 'Vegetation', icon: <FaTree title="Vegetation" /> },
  ];

  const toggleOpen = () => setIsOpen(prev => !prev);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { id, checked } = e.target;
    if (id === 'subcatchment') {
      setSubcatchment(checked);
      if (!checked && landuse) {
        setLanduse(false);
      }
    }
    if (id === 'channels') {
      setChannels(checked);
    }
    if (id === 'landuse') {
      if (checked) {
        setSubcatchment(true);
        setLanduse(true);
      } else {
        setLanduse(false);
        setSubcatchment(false);
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
                <div className="layerpicker-layers" id="layerpicker-layers">
                  {activeTab === 'Hill Slopes' && (
                    <>
                      <div className="layerpicker-layer">
                        <button className="layerpicker-title">Subcatchments</button>
                        <input
                          type="checkbox"
                          id="subcatchment"
                          checked={subcatchment}
                          onChange={handleChange}
                          disabled={landuse && subcatchment}
                        />
                      </div>
                      <div className="layerpicker-layer">
                        <button className="layerpicker-title">Channels</button>
                        <input
                          type="checkbox"
                          id="channels"
                          checked={channels}
                          onChange={handleChange}
                        />
                      </div>
                    </>
                  )}
                  {activeTab === 'Coverage' && (
                    <>
                      <div className="layerpicker-layer">
                        <button className="layerpicker-title">Land Use</button>
                        <input
                          type="checkbox"
                          id="landuse"
                          checked={landuse}
                          onChange={handleChange}
                        />
                      </div>
                    </>
                  )}
                  {activeTab === 'Vegetation' && (
                    <>
                    </>
                  )}
                </div>
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
