import { lazyRouteComponent } from '@tanstack/react-router';

const AboutRoute = lazyRouteComponent(() => import('../pages/about/About'));
export default AboutRoute;