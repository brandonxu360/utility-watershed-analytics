import { lazyRouteComponent } from '@tanstack/react-router';

const LoginRoute = lazyRouteComponent(() => import('../pages/authentication/login/Login'));
export default LoginRoute;
