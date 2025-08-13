import { lazyRouteComponent, createRoute, createRootRoute, createRouter, Outlet } from '@tanstack/react-router';
import { WatershedIDProvider } from '../utils/watershedID/WatershedIDProvider';
import Navbar from '../components/navbar/Navbar';
import Home from '../pages/home/Home';
import WatershedOverview from '../components/side-panels/watershed/WatershedOverview';
import WatershedDataPanel from '../components/side-panels/watershed/WatershedDataPanel';

const About = lazyRouteComponent(() => import('../pages/about/About'));
const FAQ = lazyRouteComponent(() => import('../pages/faq/FAQ'));
const Documentation = lazyRouteComponent(() => import('../pages/documentation/Documentation'));
const Login = lazyRouteComponent(() => import('../pages/authentication/login/Login'));
const Register = lazyRouteComponent(() => import('../pages/authentication/register/Register'));

const rootRoute = createRootRoute({
  component: () => (
    <>
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <Navbar />
        <div style={{ display: "flex", flex: 1, minHeight: 0, height: "100%" }}>
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
  component: () => (
    <WatershedIDProvider>
      <Home />
    </WatershedIDProvider>
  ),
});

export const watershedOverviewRoute = createRoute({
  getParentRoute: () => homeRoute,
  path: '/watershed/$webcloudRunId',
  component: WatershedOverview,
});

export const watershedDataRoute = createRoute({
  getParentRoute: () => homeRoute,
  path: '/watershed/data/$webcloudRunId',
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

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'register',
  component: Register,
});

// Create the route tree
const routeTree = rootRoute.addChildren([
  homeRoute.addChildren([
    watershedOverviewRoute,
    watershedDataRoute,
  ]),
  aboutRoute,
  faqRoute,
  documentationRoute,
  loginRoute,
  registerRoute,
]);

// Pass the route tree to the Router constructor
export const router = createRouter({ routeTree });
