import React from 'react';
import { useIsSmallScreen } from '../../hooks/useIsSmallScreen';
import WeppSidePanelContent from '../../components/side-panels/about-wepp-side-panel/AboutWeppSidePanel';
import SmallScreenNotice from '../../components/small-screen-notice/SmallScreenNotice';
//import BottomPanel from '../../components/bottom-panels/BottomPanel';
import AboutWeppMain from '../../components/about-wepp-main/AboutWeppMain';
import './About_WEPP.css';

/**
 * SidePanel component
 */
function SidePanel({ children }: { children: React.ReactNode }) {
  return (
    <div className='side-panel'>
      <div className='side-panel-content'>{children}</div>
    </div>
  )
}

/**
 * The main layout for the About WEPP page.
 */
export default function AboutWepp() {
  const isSmallScreen = useIsSmallScreen();

  if (isSmallScreen) {
    return <SmallScreenNotice />;
  }

  return (
    <div className='wepp-container'>
      <SidePanel>
        <WeppSidePanelContent />
      </SidePanel>
      <div className='wepp-wrapper' style={{ position: 'relative' }}>
        <AboutWeppMain />
      </div>
    </div>
  )
  
}
