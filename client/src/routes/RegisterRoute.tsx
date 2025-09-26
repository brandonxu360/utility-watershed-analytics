import { lazyRouteComponent } from '@tanstack/react-router';

const RegisterRoute = lazyRouteComponent(() => import('../pages/authentication/register/Register'));
export default RegisterRoute;