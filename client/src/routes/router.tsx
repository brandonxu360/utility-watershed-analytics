import { createRoute, createRootRoute, createRouter, Outlet } from '@tanstack/react-router';
import { WatershedIDProvider } from '../context/watershed-id/WatershedIDProvider';
import Navbar from '../components/navbar/Navbar';
import Home from '../pages/home/Home';
import WatershedOverview from '../components/side-panels/watershed/WatershedOverview';
import LoginRoute from './LoginRoute';
import RegisterRoute from './RegisterRoute';
import { BottomPanelProvider } from '../context/bottom-panel/BottomPanelProvider';

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
      <BottomPanelProvider>
        <Home />
      </BottomPanelProvider>
    </WatershedIDProvider>
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

// Create the route tree
const routeTree = rootRoute.addChildren([
  homeRoute.addChildren([
    watershedOverviewRoute,
  ]),
  loginRoute,
  registerRoute,
]);

// Pass the route tree to the Router constructor
export const router = createRouter({ routeTree });
