import React from 'react';
import { useIsSmallScreen } from '../../hooks/useIsSmallScreen';
import AboutSidePanelContent from '../../components/side-panels/about-side-panel/AboutSidePanel';
import SmallScreenNotice from '../../components/small-screen-notice/SmallScreenNotice';
//import BottomPanel from '../../components/bottom-panels/BottomPanel';
import AboutMain from '../../components/about-main/AboutMain';
import './About.css';

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
 * The main layout for the About page.
 */
export default function About() { 
  const isSmallScreen = useIsSmallScreen();

  if (isSmallScreen) {
    return <SmallScreenNotice />;
  }

  return (
    <div className='about-container'>
      <SidePanel>
        <AboutSidePanelContent />
      </SidePanel>
      <div className='about-wrapper' style={{ position: 'relative' }}>
        <AboutMain />
      </div>
    </div>
  )

}
