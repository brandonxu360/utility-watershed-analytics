import React from 'react';
import { watershedOverviewRoute } from '../../routes/router';
import { useMatch } from '@tanstack/react-router';
import { useAppStore } from '../../store/store';
import WatershedOverview from '../../components/side-panels/watershed/WatershedOverview';
import HomeSidePanelContent from '../../components/side-panels/home-info/HomeInfoPanel';
import BottomPanel from '../../components/bottom-panels/BottomPanel';
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
  const { isPanelOpen, panelContent } = useAppStore();
  const match = useMatch({ from: watershedOverviewRoute.id, shouldThrow: false });
  const watershedID = match?.params.webcloudRunId ?? null;

  return (
    <div className='home-container'>
      <SidePanel>
        {watershedID ? <WatershedOverview /> : <HomeSidePanelContent />}
      </SidePanel>
      <div className='map-wrapper' style={{ position: 'relative' }}>
        <Map />
        {isPanelOpen && (
          <BottomPanel
            isOpen={isPanelOpen}
          >
            {panelContent}
          </BottomPanel>
        )}
      </div>
    </div>
  );
}
