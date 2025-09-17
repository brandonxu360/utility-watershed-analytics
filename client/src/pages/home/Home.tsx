import { Outlet } from '@tanstack/react-router';
import { useContext } from 'react';
import { WatershedIDContext } from '../../context/watershed-id/WatershedIDContext';
import { WatershedOverlayProvider } from '../../context/watershed-overlay/WatershedOverlayProvider';
import { useBottomPanelContext } from '../../context/bottom-panel/BottomPanelContext';
import { BottomPanelProvider } from '../../context/bottom-panel/BottomPanelProvider';
import Map from '../../components/map/Map';
import HomeSidePanelContent from '../../components/side-panels/home-info/HomeInfoPanel';
import BottomPanel from '../../components/bottom-panel/BottomPanel';
import './Home.css';

/**
 * Interface for the @see {@link Home} function to enforce type safety.
 */
interface SidePanelProps {
  children: React.ReactNode;
}

/**
 * SidePanel component that wraps children with a styled container.
 * 
 * @param {SidePanelProps} props - The properties object.
 * @param {React.ReactNode} props.children - The content to be displayed inside the panel.
 * @returns {JSX.Element} A styled side panel containing the provided children.
 */
function SidePanel({ children }: SidePanelProps): JSX.Element {
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

  return (
    <BottomPanelProvider>
      <HomeContent watershedId={watershedId} />
    </BottomPanelProvider>
  );
}

function HomeContent({ watershedId }: { watershedId: string | null }) {
  const bottomPanel = useBottomPanelContext();

  return (
    <WatershedOverlayProvider>
      <div className='home-container'>
        <SidePanel>
          {watershedId ? <Outlet /> : <HomeSidePanelContent />}
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
    </WatershedOverlayProvider>
  );
}
