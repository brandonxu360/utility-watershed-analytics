import React, { useContext } from 'react';
import { WatershedIDContext } from '../../context/watershed-id/WatershedIDContext';
import { useBottomPanelContext } from '../../context/bottom-panel/BottomPanelContext';
import WatershedOverview from '../../components/side-panels/watershed/WatershedOverview';
import HomeSidePanelContent from '../../components/side-panels/home-info/HomeInfoPanel';
import BottomPanel from '../../components/bottom-panel/BottomPanel';
import Map from '../../components/map/Map';
import './Home.css';

/**
 * SidePanel component that wraps children with a styled container.
 * 
 * @param {React.ReactNode} props.children - The content to be displayed inside the panel.
 * @returns {JSX.Element} A styled side panel containing the provided children.
 */
function SidePanel({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <div className='side-panel'>
      <div className='side-panel-content'>{children}</div>
    </div>
  );
}

/**
 * Home component that serves as the main layout for the home page.
 * It determines whether to show a specific watershed panel or the default home info panel.
 * 
 * @returns {JSX.Element} The main home page layout including a side panel and a map.
 */
export default function Home(): JSX.Element {
  const watershedId = useContext(WatershedIDContext);
  const bottomPanel = useBottomPanelContext();

  return (
    <div className='home-container'>
      <SidePanel>
        {watershedId ? <WatershedOverview /> : <HomeSidePanelContent />}
      </SidePanel>
      <div className='map-wrapper' style={{ position: 'relative' }}>
        <Map />
        {bottomPanel.isOpen && (
          <BottomPanel
            isOpen={bottomPanel.isOpen}
            onClose={bottomPanel.closePanel}
          >
            {bottomPanel.content}
          </BottomPanel>
        )}
      </div>
    </div>
  );
}
