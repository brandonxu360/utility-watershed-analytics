import { lazyRouteComponent, createRoute, createRootRoute, createRouter, Outlet } from '@tanstack/react-router';
import Navbar from '../components/navbar/Navbar';
import Home from '../pages/home/Home';
import Watershed from '../components/side-panels/watershed/WatershedPanel';
import WatershedOverview from '../components/side-panels/watershed/WatershedOverview';
import WatershedDataPanel from '../components/side-panels/watershed/WatershedDataPanel';

const About = lazyRouteComponent(() => import('../pages/about/About'));
const FAQ = lazyRouteComponent(() => import('../pages/faq/FAQ'));
const Documentation = lazyRouteComponent(() => import('../pages/documentation/Documentation'));
const Login = lazyRouteComponent(() => import('../pages/login/Login'));

const rootRoute = createRootRoute({
  component: () => (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100svh' }}>
        <Navbar />
        <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
          <Outlet />
        </div>
      </div>
    </>
  ),
  notFoundComponent: () => <div>404: Page Not Found</div>,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Home,
});

const watershedIdRoute = createRoute({
  getParentRoute: () => homeRoute,
  path: '/watershed/$webcloudRunId',
  component: Watershed,
});

const watershedOverviewRoute = createRoute({
  getParentRoute: () => watershedIdRoute,
  path: '/',
  component: WatershedOverview,
});

const watershedDataRoute = createRoute({
  getParentRoute: () => watershedIdRoute,
  path: 'data',
  component: WatershedDataPanel,
});

const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/about',
  component: About,
})

const faqRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/faq',
  component: FAQ,
});

const documentationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/documentation',
  component: Documentation,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: Login,
});

// Create the route tree
const routeTree = rootRoute.addChildren([
  homeRoute.addChildren([
    watershedIdRoute.addChildren([watershedOverviewRoute, watershedDataRoute]),
  ]),
  aboutRoute,
  faqRoute,
  documentationRoute,
  loginRoute,
]);

// Pass the route tree to the Router constructor
export const router = createRouter({ routeTree });