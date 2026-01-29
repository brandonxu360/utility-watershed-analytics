import { lazyRouteComponent } from '@tanstack/react-router';

const RegisterRoute = lazyRouteComponent(() => import('../pages/authentication/Register'));
export default RegisterRoute;