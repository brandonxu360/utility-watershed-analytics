import { createRoute, createRootRoute, createRouter, Outlet } from '@tanstack/react-router';
import Navbar from '../components/Navbar';
import Home from '../pages/Home';
import WatershedOverview from '../components/side-panels/WatershedOverview';
import LoginRoute from './LoginRoute';
import RegisterRoute from './RegisterRoute';
import About from '../pages/about/About';
import Team from '../pages/team/Team';
import AboutWepp from '../pages/about_wepp/About_WEPP';
import AboutWeppCloud from '../pages/about_weppcloud/About_WEPPcloud';
import AboutRHESSys from '../pages/about_rhessys/About_RHESSys';
import AboutWATAR from '../pages/about_watar/About_WATAR';
import AboutSBS from '../pages/about_sbs/About_SBS';
import Scenarios from '../pages/scenarios/Scenarios'


const rootRoute = createRootRoute({
  component: () => (
    <>
      <Navbar />
      <div>
        <Outlet />
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

const aboutWatarRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/about-watar',
  component: () => (
    <AboutWATAR />
  ),
});

const aboutSBSRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/about-sbs',
  component: () => (
    <AboutSBS />
  ),
});

const scenariosRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/scenarios',
  component: () => (
    <Scenarios />
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
  aboutRhessysRoute,
  aboutWatarRoute,
  aboutSBSRoute,
  scenariosRoute
]);

// Pass the route tree to the Router constructor
export const router = createRouter({ routeTree });
