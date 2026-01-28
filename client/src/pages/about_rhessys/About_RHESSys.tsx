import React from 'react';
import { useIsSmallScreen } from '../../hooks/useIsSmallScreen';
import RHESSysSidePanelContent from '../../components/side-panels/about-rhessys-side-panel/AboutRHESSysSidePanel';
import SmallScreenNotice from '../../components/small-screen-notice/SmallScreenNotice';
//import BottomPanel from '../../components/bottom-panels/BottomPanel';
import AboutRhessysMain from '../../components/about-rhessys-main/AboutRHESSysMain';
import './About_RHESSys.css';

/**
 * SidePanel component
 */
function SidePanel({ children }: { children: React.ReactNode }) {
  return (
    <div className='side-panel'>
      <div className='side-panel-content'>{children}</div>
    </div>
  );
}

/**
 * The main layout for the About RHESSys page.
 */
export default function AboutRHESSys() {
  const isSmallScreen = useIsSmallScreen();

  if (isSmallScreen) {
    return <SmallScreenNotice />;
  }

  return (
    <div className='rhessys-container'>
      <SidePanel>
        <RHESSysSidePanelContent />
      </SidePanel>
      <div className='rhessys-wrapper' style={{ position: 'relative' }}>
        <AboutRhessysMain />
      </div>
    </div>
  )
  
}
