import { Outlet, useMatch } from '@tanstack/react-router';
import Map from '../../components/map/Map';
import HomeSidePanelContent from '../../components/home_info/HomeInfoPanel';
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
function SidePanel({ children }: SidePanelProps) {
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
export default function Home() {
  // Check if the user is on a watershed route
  const watershedMatch = useMatch({
    from: '/watershed/$watershedId',
    shouldThrow: false, // Stops invariant route errors i.e. when route doesn't match /watershed/$watershedId
  });
  const watershedId = watershedMatch?.params.watershedId;

  return (
    <div className='home-container'>
      <SidePanel>
        {watershedId ? <Outlet /> : <HomeSidePanelContent />}
      </SidePanel>

      <div className='map-wrapper'>
        <Map watershedId={watershedId} />
      </div>
    </div>
  );
}