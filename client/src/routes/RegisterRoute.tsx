import { lazyRouteComponent } from '@tanstack/react-router';

const RegisterRoute = lazyRouteComponent(() => import('../pages/Register'));
export default RegisterRoute;