import Map from '../../components/map/Map';
import HomeCss from './Home.module.css'

const Home = () => {
  return (
    <div className={HomeCss['home-container']}>
      <div className={HomeCss['map-wrapper']}>
        <Map />
      </div>
    </div>
  );
};

export default Home;