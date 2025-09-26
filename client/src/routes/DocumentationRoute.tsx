import { lazyRouteComponent } from '@tanstack/react-router';

const DocumentationRoute = lazyRouteComponent(() => import('../pages/documentation/Documentation'));
export default DocumentationRoute;
