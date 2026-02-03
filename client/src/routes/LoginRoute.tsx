import { lazyRouteComponent } from '@tanstack/react-router';

const LoginRoute = lazyRouteComponent(() => import('../pages/Login'));
export default LoginRoute;
