import { lazyRouteComponent } from '@tanstack/react-router';

const LoginRoute = lazyRouteComponent(() => import('../pages/authentication/Login'));
export default LoginRoute;
