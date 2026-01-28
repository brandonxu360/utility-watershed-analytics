import { createRoute, createRootRoute, createRouter, Outlet } from '@tanstack/react-router';
import Navbar from '../components/navbar/Navbar';
import Home from '../pages/home/Home';
import WatershedOverview from '../components/side-panels/watershed/WatershedOverview';
import LoginRoute from './LoginRoute';
import RegisterRoute from './RegisterRoute';
import About from '../pages/about/About';
import Team from '../pages/team/Team';
import AboutWepp from '../pages/about_wepp/About_WEPP';
import AboutWeppCloud from '../pages/about_weppcloud/About_WEPPcloud';
import AboutRHESSys from '../pages/about_rhessys/About_RHESSys';

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
    <Home />
  ),
});

export const watershedOverviewRoute = createRoute({
  getParentRoute: () => homeRoute,
  path: '/watershed/$webcloudRunId',
  component: WatershedOverview,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginRoute,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'register',
  component: RegisterRoute,
});

const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/about',
  component: () => (
    <About />
  ),
});

const teamRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/team',
  component: () => (
    <Team />
  ),
});

const aboutWeppRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/about-wepp',
  component: () => (
    <AboutWepp />
  ),
});

const aboutWeppCloudRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/about-wepp-cloud',
  component: () => (
    <AboutWeppCloud />
  ),
});

const aboutRhessysRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/about-rhessys',
  component: () => (
    <AboutRHESSys />
  ),
});

// Create the route tree
const routeTree = rootRoute.addChildren([
  homeRoute.addChildren([
    watershedOverviewRoute,
  ]),
  loginRoute,
  registerRoute,
  aboutRoute,
  teamRoute,
  aboutWeppRoute,
  aboutWeppCloudRoute,
  aboutRhessysRoute
]);

// Pass the route tree to the Router constructor
export const router = createRouter({ routeTree });
