import { lazyRouteComponent } from '@tanstack/react-router';

const FaqRoute = lazyRouteComponent(() => import('../pages/faq/FAQ'));
export default FaqRoute;
