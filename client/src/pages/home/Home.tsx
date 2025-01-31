import { useState } from 'react';
import Map from '../../components/map/Map';
import HomeCss from './Home.module.css';

const Home = () => {
  const [isSideContentOpen, setIsSideContentOpen] = useState(false);

  return (
    <div className={HomeCss['home-container']}>
      <div className={`${HomeCss['side-panel']} ${isSideContentOpen ? HomeCss['open'] : ''}`}>
        <div className={HomeCss['side-panel-content']}>
          <h2>Explore Watershed Analytics</h2>
          <p>
            Visualize and analyze hydrologic and environmental data for watersheds across the western United States. Gain insights into observed and modeled data to understand water and environmental conditions.
          </p>
          <h3>Tier 1 Watersheds</h3>
          <p>
            Access modeled results that provide initial insights but have not yet been calibrated.
          </p>
          <h3>Tier 2 Watersheds</h3>
          <p>
            Explore calibrated model results for enhanced accuracy and reliability. Start analyzing now to uncover trends, compare models, and support data-driven decisions for watershed management.
          </p>
          <strong>Get Started: Select a watershed to explore its data.</strong>
        </div>
      </div>
      <div className={`${HomeCss['map-wrapper']} ${isSideContentOpen ? HomeCss['map-shrink'] : ''}`}>
        <Map setIsSideContentOpen={setIsSideContentOpen} />
      </div>
    </div>
  );
};

export default Home;