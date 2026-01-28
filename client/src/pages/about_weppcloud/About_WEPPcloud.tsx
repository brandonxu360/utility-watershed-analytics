import React from 'react';
import { useIsSmallScreen } from '../../hooks/useIsSmallScreen';
import WeppCloudSidePanelContent from '../../components/side-panels/about-weppcloud-side-panel/AboutWeppCloudSidePanel';
import SmallScreenNotice from '../../components/small-screen-notice/SmallScreenNotice';
//import BottomPanel from '../../components/bottom-panels/BottomPanel';
import AboutWeppCloudMain from '../../components/about-weppcloud-main/AboutWeppCloudMain';
import './About_WEPPcloud.css';

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
 * The main layout for the About WEPPcloud page.
 */
export default function AboutWeppCloud() {
    const isSmallScreen = useIsSmallScreen();

    if (isSmallScreen) {
        return <SmallScreenNotice />;
    }

    return (
        <div className='weppcloud-container'>
            <SidePanel>
                <WeppCloudSidePanelContent />
            </SidePanel>
            <div className='weppcloud-wrapper' style={{ position: 'relative' }}>
                <AboutWeppCloudMain />
            </div>
        </div>
    )
  
}
