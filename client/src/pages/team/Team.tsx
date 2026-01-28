import React from 'react';
import { useIsSmallScreen } from '../../hooks/useIsSmallScreen';
import TeamSidePanelContent from '../../components/side-panels/team-side-panel/TeamSidePanel';
import SmallScreenNotice from '../../components/small-screen-notice/SmallScreenNotice';
//import BottomPanel from '../../components/bottom-panels/BottomPanel';
import TeamMain from '../../components/team-main/TeamMain';
import './Team.css';

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
 * The main layout for the Team page.
 */
export default function Team() { 
  const isSmallScreen = useIsSmallScreen();

  if (isSmallScreen) {
    return <SmallScreenNotice />;
  }

  return (
    <div className='team-container'>
      <SidePanel>
        <TeamSidePanelContent />
      </SidePanel>
      <div className='team-wrapper' style={{ position: 'relative' }}>
        <TeamMain />
      </div>
    </div>
  )
  
}
